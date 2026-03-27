import express from 'express';
import prisma from '../utils/prisma';
import { AuthRequest, authMiddleware } from '../middleware/auth';
import { dataScopeMiddleware } from '../middleware/dataScope';
import { logActivity } from '../middleware/activity';

const router = express.Router();

router.use(authMiddleware);
router.use(dataScopeMiddleware);

// 获取线索列表
router.get('/', async (req: AuthRequest, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 10;
    const search = req.query.search as string | undefined;
    const status = req.query.status !== undefined ? Number(req.query.status) : undefined;
    const ownerId = req.query.ownerId ? Number(req.query.ownerId) : undefined;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { company: { contains: search } },
        { phone: { contains: search } },
      ];
    }
    if (status !== undefined) where.status = status;
    if (ownerId) where.ownerId = ownerId;
    
    if (req.dataScopeUserIds && req.dataScopeUserIds.length > 0) {
      where.ownerId = { in: req.dataScopeUserIds };
    }

    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        include: {
          owner: {
            select: { id: true, username: true, realName: true },
          },
          customer: true,
        },
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.lead.count({ where }),
    ]);

    res.json({
      data: leads,
      total,
      page,
      pageSize,
    });
  } catch (error) {
    console.error('获取线索列表错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取线索详情
router.get('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    let { id } = req.params;
    if (Array.isArray(id)) {
      id = id[0];
    }

    const lead = await prisma.lead.findUnique({
      where: { id: parseInt(id) },
      include: {
        owner: {
          select: { id: true, username: true, realName: true },
        },
        customer: true,
      },
    });

    if (!lead) {
      return res.status(404).json({ message: '线索不存在' });
    }

    res.json(lead);
  } catch (error) {
    console.error('获取线索详情错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 创建线索
router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { name, phone, email, company, source, ownerId, remark } = req.body;

    const lead = await prisma.lead.create({
      data: {
        name,
        phone,
        email,
        company,
        source,
        ownerId,
        remark,
      },
      include: {
        owner: {
          select: { id: true, username: true, realName: true },
        },
      },
    });

    await logActivity(req, 'create', '创建线索', 'lead', lead.id, `创建线索: ${name}`);

    res.json(lead);
  } catch (error) {
    console.error('创建线索错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 更新线索
router.put('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    let { id } = req.params;
    if (Array.isArray(id)) {
      id = id[0];
    }
    const { name, phone, email, company, source, ownerId, status, remark } = req.body;

    const lead = await prisma.lead.update({
      where: { id: parseInt(id) },
      data: {
        name,
        phone,
        email,
        company,
        source,
        ownerId,
        status,
        remark,
      },
      include: {
        owner: {
          select: { id: true, username: true, realName: true },
        },
      },
    });

    await logActivity(req, 'update', '更新线索', 'lead', lead.id, `更新线索: ${name}`);

    res.json(lead);
  } catch (error) {
    console.error('更新线索错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 线索转换为客户
router.put('/:id/convert', authMiddleware, async (req: AuthRequest, res) => {
  try {
    let { id } = req.params;
    if (Array.isArray(id)) {
      id = id[0];
    }
    const { customerId } = req.body;

    const lead = await prisma.lead.findUnique({
      where: { id: parseInt(id) },
    });

    if (!lead) {
      return res.status(404).json({ message: '线索不存在' });
    }

    const updatedLead = await prisma.lead.update({
      where: { id: parseInt(id) },
      data: { status: 3 },
    });

    if (customerId) {
      await prisma.lead.update({
        where: { id: parseInt(id) },
        data: { customerId },
      });
    }

    await logActivity(req, 'convert', '转换线索', 'lead', parseInt(id), `将线索 "${lead.name}" 转换为客户`);

    res.json({ message: '线索转换成功', lead: updatedLead });
  } catch (error) {
    console.error('线索转换错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 删除线索
router.delete('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    let { id } = req.params;
    if (Array.isArray(id)) {
      id = id[0];
    }
    const leadId = parseInt(id);
    
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      select: { name: true },
    });

    await prisma.lead.delete({
      where: { id: leadId },
    });

    await logActivity(req, 'delete', '删除线索', 'lead', leadId, `删除线索: ${lead?.name}`);

    res.json({ message: '线索删除成功' });
  } catch (error) {
    console.error('删除线索错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

export default router;