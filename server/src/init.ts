import prisma from './utils/prisma';
import bcrypt from 'bcryptjs';

const initDatabase = async () => {
  try {
    // 检查是否已有管理员
    const adminExists = await prisma.user.findUnique({
      where: { username: 'admin' },
    });

    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await prisma.user.create({
        data: {
          username: 'admin',
          password: hashedPassword,
          email: 'admin@crm.com',
          realName: '系统管理员',
          role: 'admin',
          status: 1,
        },
      });
      console.log('✅ 默认管理员账号已创建');
      console.log('   用户名: admin');
      console.log('   密码: admin123');
    } else {
      console.log('ℹ️  管理员账号已存在');
    }
  } catch (error) {
    console.error('初始化数据库错误:', error);
  }
};

initDatabase();