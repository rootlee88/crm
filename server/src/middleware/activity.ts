import { AuthRequest } from './auth';
import prisma from '../utils/prisma';

export const logActivity = async (
  req: AuthRequest,
  type: string,
  action: string,
  targetType?: string,
  targetId?: number,
  content?: string
) => {
  if (!req.user) return;
  
  await prisma.activity.create({
    data: {
      userId: req.user.userId,
      type,
      action,
      targetType,
      targetId,
      content,
    },
  });
};