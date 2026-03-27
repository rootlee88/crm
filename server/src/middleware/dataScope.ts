import { Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middleware/auth';

export const dataScopeMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ message: '未授权访问' });
  }

  if (user.role === 'admin' || user.dataScope === 'all') {
    return next();
  }

  if (user.dataScope === 'department' && user.departmentId) {
    const departmentUserIds = await prisma.user.findMany({
      where: { departmentId: user.departmentId },
      select: { id: true },
    });
    req.dataScopeUserIds = departmentUserIds.map(u => u.id);
  } else {
    req.dataScopeUserIds = [user.userId];
  }

  next();
};

declare global {
  namespace Express {
    interface Request {
      dataScopeUserIds?: number[];
    }
  }
}
