import express from 'express';
import prisma from '../utils/prisma';
import { AuthRequest, authMiddleware } from '../middleware/auth';
import { dataScopeMiddleware } from '../middleware/dataScope';
import { logActivity } from '../middleware/activity';

const router = express.Router();

router.use(authMiddleware);
router.use(dataScopeMiddleware);

// 获取商机列表
router.get('/', async (req: AuthRequest, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 10;
    const search = req.query.search as string | undefined;
    const stage = req.query.stage as string | undefined;
    const status = req.query.status !== undefined ? Number(req.query.status) : undefined;
    const ownerId = req.query.ownerId ? Number(req.query.ownerId) : undefined;
    const customerId = req.query.customerId ? Number(req.query.customerId) : undefined;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search } },
      ];
    }
    if (stage) where.stage = stage;
    if (status !== undefined) where.status = status;
    if (ownerId) where.ownerId = ownerId;
    if (customerId) where.customerId = customerId;

    if (req.dataScopeUserIds && req.dataScopeUserIds.length > 0) {
      where.ownerId = { in: req.dataScopeUserIds };
    }

    const [opportunities, total] = await Promise.all([
      prisma.opportunity.findMany({
        where,
        include: {
          customer: true,
          owner: {
            select: { id: true, username: true, realName: true },
          },
        },
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.opportunity.count({ where }),
    ]);

    res.json({
      data: opportunities,
      total,
      page,
      pageSize,
    });
  } catch (error) {
    console.error('获取商机列表错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取商机详情
router.get('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    let { id } = req.params;
    if (Array.isArray(id)) {
      id = id[0];
    }

    const opportunity = await prisma.opportunity.findUnique({
      where: { id: parseInt(id) },
      include: {
        customer: true,
        owner: {
          select: { id: true, username: true, realName: true },
        },
        contracts: true,
      },
    });

    if (!opportunity) {
      return res.status(404).json({ message: '商机不存在' });
    }

    res.json(opportunity);
  } catch (error) {
    console.error('获取商机详情错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 创建商机
router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { name, customerId, amount, stage, probability, expectedDate, ownerId, remark } = req.body;

    const opportunity = await prisma.opportunity.create({
      data: {
        name,
        customerId,
        amount: amount || 0,
        stage: stage || 'prospecting',
        probability: probability || 10,
        expectedDate,
        ownerId,
        remark,
      },
      include: {
        customer: true,
        owner: {
          select: { id: true, username: true, realName: true },
        },
      },
    });

    await logActivity(req, 'create', '创建商机', 'opportunity', opportunity.id, `创建商机: ${name}`);

    res.json(opportunity);
  } catch (error) {
    console.error('创建商机错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 更新商机
router.put('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    let { id } = req.params;
    if (Array.isArray(id)) {
      id = id[0];
    }
    const { name, customerId, amount, stage, probability, expectedDate, ownerId, status, remark } = req.body;

    const opportunity = await prisma.opportunity.update({
      where: { id: parseInt(id) },
      data: {
        name,
        customerId,
        amount,
        stage,
        probability,
        expectedDate,
        ownerId,
        status,
        remark,
      },
      include: {
        customer: true,
        owner: {
          select: { id: true, username: true, realName: true },
        },
      },
    });

    await logActivity(req, 'update', '更新商机', 'opportunity', opportunity.id, `更新商机: ${name}`);

    res.json(opportunity);
  } catch (error) {
    console.error('更新商机错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 删除商机
router.delete('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    let { id } = req.params;
    if (Array.isArray(id)) {
      id = id[0];
    }
    const oppId = parseInt(id);
    
    const opportunity = await prisma.opportunity.findUnique({
      where: { id: oppId },
      select: { name: true },
    });

    await prisma.opportunity.delete({
      where: { id: oppId },
    });

    await logActivity(req, 'delete', '删除商机', 'opportunity', oppId, `删除商机: ${opportunity?.name}`);

    res.json({ message: '商机删除成功' });
  } catch (error) {
    console.error('删除商机错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

export default router;