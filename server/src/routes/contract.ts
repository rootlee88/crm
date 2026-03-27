import express from 'express';
import prisma from '../utils/prisma';
import { AuthRequest, authMiddleware } from '../middleware/auth';
import { logActivity } from '../middleware/activity';

const router = express.Router();

const generateContractNo = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `CT${year}${month}${random}`;
};

// 获取合同列表
router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 10;
    const search = req.query.search as string | undefined;
    const status = req.query.status !== undefined ? Number(req.query.status) : undefined;
    const customerId = req.query.customerId ? Number(req.query.customerId) : undefined;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    
    if (search) {
      where.OR = [
        { contractNo: { contains: search } },
      ];
    }
    if (status !== undefined) where.status = status;
    if (customerId) where.customerId = customerId;

    const [contracts, total] = await Promise.all([
      prisma.contract.findMany({
        where,
        include: {
          customer: true,
          opportunity: true,
          creator: {
            select: { id: true, username: true, realName: true },
          },
        },
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.contract.count({ where }),
    ]);

    res.json({
      data: contracts,
      total,
      page,
      pageSize,
    });
  } catch (error) {
    console.error('获取合同列表错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取合同详情
router.get('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    let { id } = req.params;
    if (Array.isArray(id)) {
      id = id[0];
    }

    const contract = await prisma.contract.findUnique({
      where: { id: parseInt(id) },
      include: {
        customer: true,
        opportunity: true,
        creator: {
          select: { id: true, username: true, realName: true },
        },
      },
    });


    res.json(contract);
  } catch (error) {
    console.error('获取合同详情错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 创建合同
router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { customerId, opportunityId, amount, signDate, startDate, endDate, fileUrl, remark } = req.body;

    const contract = await prisma.contract.create({
      data: {
        contractNo: generateContractNo(),
        customerId,
        opportunityId,
        amount: amount || 0,
        signDate,
        startDate,
        endDate,
        fileUrl,
        remark,
        createdBy: req.user!.userId,
      },
      include: {
        customer: true,
        opportunity: true,
        creator: {
          select: { id: true, username: true, realName: true },
        },
      },
    });
    await logActivity(req, 'create', '创建合同', 'contract', contract?.id, `创建合同: ${contract?.contractNo}`);


    res.json(contract);
  } catch (error) {
    console.error('创建合同错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 更新合同
router.put('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    let { id } = req.params;
    if (Array.isArray(id)) {
      id = id[0];
    }
    const { customerId, opportunityId, amount, signDate, startDate, endDate, status, fileUrl, remark } = req.body;

    const contract = await prisma.contract.update({
      where: { id: parseInt(id) },
      data: {
        customerId,
        opportunityId,
        amount,
        signDate,
        startDate,
        endDate,
        status,
        fileUrl,
        remark,
      },
      include: {
        customer: true,
        opportunity: true,
        creator: {
          select: { id: true, username: true, realName: true },
        },
      },
    });
    await logActivity(req, 'update', '更新合同', 'contract', contract?.id, `更新合同: ${contract?.contractNo}`);

    res.json(contract);
  } catch (error) {
    console.error('更新合同错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 删除合同
router.delete('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    let { id } = req.params;
    if (Array.isArray(id)) {
      id = id[0];
    }
    const contractId = parseInt(id);
    
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      select: { contractNo: true },
    });

    await prisma.contract.delete({
      where: { id: contractId },
    });

    await logActivity(req, 'delete', '删除合同', 'contract', contractId, `删除合同: ${contract?.contractNo}`);

    res.json({ message: '合同删除成功' });
  } catch (error) {
    console.error('删除合同错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

export default router;