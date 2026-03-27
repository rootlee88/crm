import express from 'express';
import prisma from '../utils/prisma';
import { AuthRequest, authMiddleware, requireRole } from '../middleware/auth';

const router = express.Router();

router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const departments = await prisma.department.findMany({
      where: { status: 1 },
      orderBy: { id: 'asc' },
    });
    res.json(departments);
  } catch (error) {
    console.error('获取部门列表错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

router.get('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    let { id } = req.params;
    if (Array.isArray(id)) {
      id = id[0];
    }
    const department = await prisma.department.findUnique({
      where: { id: parseInt(id) },
      include: {
        users: {
          select: { id: true, username: true, realName: true },
        },
      },
    });
    if (!department) {
      return res.status(404).json({ message: '部门不存在' });
    }
    res.json(department);
  } catch (error) {
    console.error('获取部门详情错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

router.post('/', authMiddleware, requireRole('admin'), async (req: AuthRequest, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ message: '部门名称不能为空' });
    }
    const department = await prisma.department.create({
      data: { name },
    });
    res.json(department);
  } catch (error) {
    console.error('创建部门错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

router.put('/:id', authMiddleware, requireRole('admin'), async (req: AuthRequest, res) => {
  try {
    let { id } = req.params;
    if (Array.isArray(id)) {
      id = id[0];
    }
    const { name, status } = req.body;
    const department = await prisma.department.update({
      where: { id: parseInt(id) },
      data: { name, status },
    });
    res.json(department);
  } catch (error) {
    console.error('更新部门错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

router.delete('/:id', authMiddleware, requireRole('admin'), async (req: AuthRequest, res) => {
  try {
    let { id } = req.params;
    if (Array.isArray(id)) {
      id = id[0];
    }
    const userCount = await prisma.user.count({ where: { departmentId: parseInt(id) } });
    if (userCount > 0) {
      return res.status(400).json({ message: '该部门下还有用户，无法删除' });
    }
    await prisma.department.delete({ where: { id: parseInt(id) } });
    res.json({ message: '部门删除成功' });
  } catch (error) {
    console.error('删除部门错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

export default router;
