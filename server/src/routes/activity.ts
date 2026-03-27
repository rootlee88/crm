import express from 'express';
import prisma from '../utils/prisma';
import { AuthRequest, authMiddleware } from '../middleware/auth';

const router = express.Router();

// 获取活动日志列表
router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 20;
    const type = req.query.type as string | undefined;
    const targetType = req.query.targetType as string | undefined;
    const userId = req.query.userId ? Number(req.query.userId) : undefined;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    
    if (type) where.type = type;
    if (targetType) where.targetType = targetType;
    if (userId) where.userId = userId;

    const [activities, total] = await Promise.all([
      prisma.activity.findMany({
        where,
        include: {
          user: {
            select: { id: true, username: true, realName: true },
          },
        },
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.activity.count({ where }),
    ]);

    res.json({
      data: activities,
      total,
      page,
      pageSize,
    });
  } catch (error) {
    console.error('获取活动日志错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取今日活动统计
router.get('/today', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const activities = await prisma.activity.findMany({
      where: {
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
      },
      include: {
        user: {
          select: { id: true, username: true, realName: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(activities);
  } catch (error) {
    console.error('获取今日活动错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

export default router;