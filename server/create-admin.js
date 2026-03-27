const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function main() {
  const prisma = new PrismaClient();
  
  try {
    // 检查是否已存在
    const existing = await prisma.user.findUnique({ where: { username: 'admin' } });
    if (existing) {
      console.log('Admin user already exists');
      return;
    }

    const hashedPassword = await bcrypt.hash('admin123', 10);
    const user = await prisma.user.create({
      data: {
        username: 'admin',
        password: hashedPassword,
        email: 'admin@crm.com',
        realName: '系统管理员',
        role: 'admin',
        status: 1,
      },
    });
    console.log('Admin created, id:', user.id);
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();