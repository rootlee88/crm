import express from 'express';
import prisma from '../utils/prisma';
import { AuthRequest, authMiddleware } from '../middleware/auth';

const router = express.Router();

// 数据权限过滤
const getDataFilter = (user: AuthRequest['user']) => {
  const filter: any = {};
  if (user?.role === 'user') {
    filter.ownerId = user.userId;
  } else if (user?.role === 'manager') {
    // 经理可以看到自己部门的，用户数据中也保存了部门信息
    filter.ownerId = user.userId;
  }
  return filter;
};

// 获取仪表盘统计数据
router.get('/statistics', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const dataFilter = getDataFilter(req.user);

    // 客户统计
    const customerCount = await prisma.customer.count({ where: dataFilter });
    
    // 线索统计
    const leadFilter = { ...dataFilter };
    const leadCount = await prisma.lead.count({ where: leadFilter });
    const leadNewCount = await prisma.lead.count({ where: { ...leadFilter, status: 1 } });
    const leadConvertedCount = await prisma.lead.count({ where: { ...leadFilter, status: 3 } });
    
    // 商机统计
    const oppFilter = { ...dataFilter, status: 1 };
    const opportunityCount = await prisma.opportunity.count({ where: oppFilter });
    const opportunityAmount = await prisma.opportunity.aggregate({
      where: oppFilter,
      _sum: { amount: true },
    });
    
    // 合同统计
    const contractFilter = { ...dataFilter, status: 1 };
    const contractCount = await prisma.contract.count({ where: contractFilter });
    const contractAmount = await prisma.contract.aggregate({
      where: contractFilter,
      _sum: { amount: true },
    });
    
    // 任务统计
    const taskFilter = { OR: [{ assigneeId: req.user?.userId }, { ownerId: req.user?.userId }] };
    const taskTotal = await prisma.task.count({ where: taskFilter });
    const taskPending = await prisma.task.count({ where: { ...taskFilter, status: { in: [1, 2] } } });
    const taskCompleted = await prisma.task.count({ where: { ...taskFilter, status: 3 } });
    
    // 今日活动
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todayActivities = await prisma.activity.count({
      where: {
        createdAt: { gte: today, lt: tomorrow },
      },
    });

    res.json({
      customers: { total: customerCount },
      leads: { total: leadCount, new: leadNewCount, converted: leadConvertedCount },
      opportunities: { total: opportunityCount, amount: opportunityAmount._sum.amount || 0 },
      contracts: { total: contractCount, amount: contractAmount._sum.amount || 0 },
      tasks: { total: taskTotal, pending: taskPending, completed: taskCompleted },
      activities: { today: todayActivities },
    });
  } catch (error) {
    console.error('获取统计数据错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取销售漏斗数据
router.get('/funnel', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const dataFilter = getDataFilter(req.user);
    const stages = [
      { key: 'prospecting', label: '初步接触' },
      { key: 'qualification', label: '需求确认' },
      { key: 'proposal', label: '方案报价' },
      { key: 'negotiation', label: '谈判' },
      { key: 'closed_won', label: '成交' },
    ];

    const funnelData = await Promise.all(
      stages.map(async (stage) => {
        const count = await prisma.opportunity.count({
          where: { ...dataFilter, stage: stage.key, status: 1 },
        });
        const amount = await prisma.opportunity.aggregate({
          where: { ...dataFilter, stage: stage.key, status: 1 },
          _sum: { amount: true },
        });
        return { stage: stage.key, label: stage.label, count, amount: amount._sum.amount || 0 };
      })
    );

    res.json(funnelData);
  } catch (error) {
    console.error('获取销售漏斗错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取最近转化线索
router.get('/recent-converted', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const dataFilter = getDataFilter(req.user);
    const leads = await prisma.lead.findMany({
      where: { ...dataFilter, status: 3 },
      include: { owner: { select: { id: true, username: true, realName: true } }, customer: true },
      orderBy: { updatedAt: 'desc' },
      take: 10,
    });
    res.json(leads);
  } catch (error) {
    console.error('获取最近转化线索错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// ===== 报表分析 API =====

// 销售业绩报表 - 按月统计
router.get('/reports/sales', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { year } = req.query;
    const targetYear = year ? parseInt(year as string) : new Date().getFullYear();
    const dataFilter = getDataFilter(req.user);

    // 按月统计合同金额
    const monthlyData = [];
    for (let month = 1; month <= 12; month++) {
      const startDate = new Date(targetYear, month - 1, 1);
      const endDate = new Date(targetYear, month, 0, 23, 59, 59);

      const result = await prisma.contract.aggregate({
        where: {
          ...dataFilter,
          status: 1,
          signDate: { gte: startDate, lte: endDate },
        },
        _sum: { amount: true },
        _count: true,
      });

      const closedOpps = await prisma.opportunity.aggregate({
        where: {
          ...dataFilter,
          status: 0,
          stage: 'closed_won',
          updatedAt: { gte: startDate, lte: endDate },
        },
        _sum: { amount: true },
        _count: true,
      });

      monthlyData.push({
        month,
        monthName: `${month}月`,
        contractAmount: result._sum.amount || 0,
        contractCount: result._count,
        wonAmount: closedOpps._sum.amount || 0,
        wonCount: closedOpps._count,
      });
    }

    // 年度总结
    const totalContractAmount = monthlyData.reduce((sum, m) => sum + m.contractAmount, 0);
    const totalWonAmount = monthlyData.reduce((sum, m) => sum + m.wonAmount, 0);

    res.json({
      year: targetYear,
      monthly: monthlyData,
      summary: {
        totalContractAmount,
        totalContractCount: monthlyData.reduce((sum, m) => sum + m.contractCount, 0),
        totalWonAmount,
        totalWonCount: monthlyData.reduce((sum, m) => sum + m.wonCount, 0),
      },
    });
  } catch (error) {
    console.error('获取销售业绩报表错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 客户增长趋势 - 按月统计
router.get('/reports/customer-growth', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { year } = req.query;
    const targetYear = year ? parseInt(year as string) : new Date().getFullYear();

    // 获取所有客户的创建时间，按月统计
    const customers = await prisma.customer.findMany({
      select: { createdAt: true },
    });

    const monthlyData = [];
    let cumulative = 0;

    for (let month = 1; month <= 12; month++) {
      const startDate = new Date(targetYear, month - 1, 1);
      const endDate = new Date(targetYear, month, 0, 23, 59, 59);

      const count = customers.filter(c => {
        const created = new Date(c.createdAt);
        return created >= startDate && created <= endDate;
      }).length;

      cumulative += count;

      monthlyData.push({
        month,
        monthName: `${month}月`,
        newCount: count,
        cumulative,
      });
    }

    // 计算总客户数
    const totalCustomers = await prisma.customer.count();

    res.json({
      year: targetYear,
      monthly: monthlyData,
      total: totalCustomers,
    });
  } catch (error) {
    console.error('获取客户增长趋势错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 转化率分析
router.get('/reports/conversion', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const dataFilter = getDataFilter(req.user);
    const { month, year } = req.query;
    
    let startDate: Date, endDate: Date;
    
    if (month && year) {
      startDate = new Date(parseInt(year as string), parseInt(month as string) - 1, 1);
      endDate = new Date(parseInt(year as string), parseInt(month as string), 0, 23, 59, 59);
    } else {
      // 默认本月
      const now = new Date();
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    }

    // 线索转化漏斗
    const totalLeads = await prisma.lead.count({ where: { ...dataFilter, createdAt: { gte: startDate, lte: endDate } } });
    const contactedLeads = await prisma.lead.count({ where: { ...dataFilter, status: 2, createdAt: { gte: startDate, lte: endDate } } });
    const convertedLeads = await prisma.lead.count({ where: { ...dataFilter, status: 3, createdAt: { gte: startDate, lte: endDate } } });
    
    // 商机转化漏斗
    const totalOpps = await prisma.opportunity.count({ where: { ...dataFilter, createdAt: { gte: startDate, lte: endDate } } });
    const proposalOpps = await prisma.opportunity.count({ where: { ...dataFilter, stage: 'proposal', createdAt: { gte: startDate, lte: endDate } } });
    const negotiationOpps = await prisma.opportunity.count({ where: { ...dataFilter, stage: 'negotiation', createdAt: { gte: startDate, lte: endDate } } });
    const wonOpps = await prisma.opportunity.count({ where: { ...dataFilter, stage: 'closed_won', status: 0, updatedAt: { gte: startDate, lte: endDate } } });
    
    // 线索转化率
    const leadContactRate = totalLeads > 0 ? ((contactedLeads / totalLeads) * 100).toFixed(1) : '0';
    const leadConvertRate = totalLeads > 0 ? ((convertedLeads / totalLeads) * 100).toFixed(1) : '0';
    
    // 商机转化率
    const oppProposalRate = totalOpps > 0 ? ((proposalOpps / totalOpps) * 100).toFixed(1) : '0';
    const oppNegotiationRate = totalOpps > 0 ? ((negotiationOpps / totalOpps) * 100).toFixed(1) : '0';
    const oppWinRate = totalOpps > 0 ? ((wonOpps / totalOpps) * 100).toFixed(1) : '0';

    res.json({
      period: { startDate: startDate.toISOString(), endDate: endDate.toISOString() },
      leads: {
        total: totalLeads,
        contacted: contactedLeads,
        converted: convertedLeads,
        contactRate: parseFloat(leadContactRate),
        convertRate: parseFloat(leadConvertRate),
      },
      opportunities: {
        total: totalOpps,
        proposal: proposalOpps,
        negotiation: negotiationOpps,
        won: wonOpps,
        proposalRate: parseFloat(oppProposalRate),
        negotiationRate: parseFloat(oppNegotiationRate),
        winRate: parseFloat(oppWinRate),
      },
    });
  } catch (error) {
    console.error('获取转化率分析错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 销售漏斗详细数据
router.get('/reports/funnel-detail', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const dataFilter = getDataFilter(req.user);

    // 线索阶段统计
    const leadStages = await Promise.all([
      prisma.lead.count({ where: { ...dataFilter, status: 1 } }),
      prisma.lead.count({ where: { ...dataFilter, status: 2 } }),
      prisma.lead.count({ where: { ...dataFilter, status: 3 } }),
      prisma.lead.count({ where: { ...dataFilter, status: 4 } }),
    ]);

    // 商机阶段统计
    const oppStages = await Promise.all([
      prisma.opportunity.count({ where: { ...dataFilter, stage: 'prospecting', status: 1 } }),
      prisma.opportunity.count({ where: { ...dataFilter, stage: 'qualification', status: 1 } }),
      prisma.opportunity.count({ where: { ...dataFilter, stage: 'proposal', status: 1 } }),
      prisma.opportunity.count({ where: { ...dataFilter, stage: 'negotiation', status: 1 } }),
      prisma.opportunity.count({ where: { ...dataFilter, stage: 'closed_won', status: 0 } }),
    ]);

    res.json({
      leads: {
        new: leadStages[0],
        contacted: leadStages[1],
        converted: leadStages[2],
        abandoned: leadStages[3],
      },
      opportunities: {
        prospecting: oppStages[0],
        qualification: oppStages[1],
        proposal: oppStages[2],
        negotiation: oppStages[3],
        won: oppStages[4],
      },
    });
  } catch (error) {
    console.error('获取漏斗详情错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

export default router;