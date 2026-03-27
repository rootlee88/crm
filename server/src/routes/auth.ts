import express from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../utils/prisma';
import { generateToken } from '../utils/jwt';
import { AuthRequest, authMiddleware } from '../middleware/auth';
import { logActivity } from '../middleware/activity';

const router = express.Router();

// 用户登录
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    console.log('Login attempt:', username);

    if (!username || !password) {
      return res.status(400).json({ message: '用户名和密码不能为空' });
    }

    const user = await prisma.user.findUnique({
      where: { username },
    });

    console.log('User found:', user ? 'yes' : 'no');

    if (!user) {
      return res.status(401).json({ message: '用户名或密码错误' });
    }

    if (user.status === 0) {
      return res.status(401).json({ message: '账号已被禁用' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log('Password valid:', isPasswordValid);

    if (!isPasswordValid) {
      return res.status(401).json({ message: '用户名或密码错误' });
    }

    const token = generateToken({
      userId: user.id,
      username: user.username,
      role: user.role,
      departmentId: user.departmentId ?? undefined,
      dataScope: user.dataScope,
    });
    
    await logActivity(req as AuthRequest, 'login', '用户登录', undefined, undefined, `用户 ${user.username} 登录系统`);

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        realName: user.realName,
        role: user.role,
      },
    });

  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取当前用户信息
router.get('/me', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        id: true,
        username: true,
        email: true,
        realName: true,
        role: true,
        departmentId: true,
        department: { select: { id: true, name: true } },
        dataScope: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    res.json(user);
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 创建用户 (仅管理员)
router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { username, password, email, realName, role, departmentId, dataScope } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: '用户名和密码不能为空' });
    }

    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return res.status(400).json({ message: '用户名已存在' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        email,
        realName,
        role: role || 'user',
        departmentId,
        dataScope: dataScope || 'self',
      },
      select: {
        id: true,
        username: true,
        email: true,
        realName: true,
        role: true,
        departmentId: true,
        dataScope: true,
        status: true,
        createdAt: true,
      },
    });

    res.json(user);
  } catch (error) {
    console.error('创建用户错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取用户列表
router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        realName: true,
        role: true,
        departmentId: true,
        department: { select: { id: true, name: true } },
        dataScope: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(users);
  } catch (error) {
    console.error('获取用户列表错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 更新用户
router.put('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    let { id } = req.params;
    if (Array.isArray(id)) {
      id = id[0];
    }
    const { email, realName, role, status, password, departmentId, dataScope } = req.body;

    const updateData: any = {};
    if (email !== undefined) updateData.email = email;
    if (realName !== undefined) updateData.realName = realName;
    if (role !== undefined) updateData.role = role;
    if (status !== undefined) updateData.status = status;
    if (departmentId !== undefined) updateData.departmentId = departmentId;
    if (dataScope !== undefined) updateData.dataScope = dataScope;
    if (password) updateData.password = await bcrypt.hash(password, 10);

    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        realName: true,
        role: true,
        departmentId: true,
        dataScope: true,
        status: true,
      },
    });

    res.json(user);
  } catch (error) {
    console.error('更新用户错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 删除用户
router.delete('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    let { id } = req.params;
    if (Array.isArray(id)) {
      id = id[0];
    }

    await prisma.user.delete({
      where: { id: parseInt(id) },
    });

    res.json({ message: '用户删除成功' });
  } catch (error) {
    console.error('删除用户错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 修改当前用户密码
router.put('/password', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: '旧密码和新密码不能为空' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
    });

    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: '旧密码错误' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: req.user!.userId },
      data: { password: hashedPassword },
    });

    res.json({ message: '密码修改成功' });
  } catch (error) {
    console.error('修改密码错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

export default router;