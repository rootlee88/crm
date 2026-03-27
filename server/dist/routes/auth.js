"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma_1 = __importDefault(require("../utils/prisma"));
const jwt_1 = require("../utils/jwt");
const auth_1 = require("../middleware/auth");
const activity_1 = require("../middleware/activity");
const router = express_1.default.Router();
// 用户登录
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        console.log('Login attempt:', username);
        if (!username || !password) {
            return res.status(400).json({ message: '用户名和密码不能为空' });
        }
        const user = await prisma_1.default.user.findUnique({
            where: { username },
        });
        console.log('User found:', user ? 'yes' : 'no');
        if (!user) {
            return res.status(401).json({ message: '用户名或密码错误' });
        }
        if (user.status === 0) {
            return res.status(401).json({ message: '账号已被禁用' });
        }
        const isPasswordValid = await bcryptjs_1.default.compare(password, user.password);
        console.log('Password valid:', isPasswordValid);
        if (!isPasswordValid) {
            return res.status(401).json({ message: '用户名或密码错误' });
        }
        const token = (0, jwt_1.generateToken)({
            userId: user.id,
            username: user.username,
            role: user.role,
            departmentId: user.departmentId ?? undefined,
            dataScope: user.dataScope,
        });
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
        await (0, activity_1.logActivity)(req, 'login', '用户登录', undefined, undefined, `用户 ${user.username} 登录系统`);
    }
    catch (error) {
        console.error('登录错误:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});
// 获取当前用户信息
router.get('/me', auth_1.authMiddleware, async (req, res) => {
    try {
        const user = await prisma_1.default.user.findUnique({
            where: { id: req.user.userId },
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
    }
    catch (error) {
        console.error('获取用户信息错误:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});
// 创建用户 (仅管理员)
router.post('/', auth_1.authMiddleware, async (req, res) => {
    try {
        const { username, password, email, realName, role, departmentId, dataScope } = req.body;
        if (!username || !password) {
            return res.status(400).json({ message: '用户名和密码不能为空' });
        }
        const existingUser = await prisma_1.default.user.findUnique({
            where: { username },
        });
        if (existingUser) {
            return res.status(400).json({ message: '用户名已存在' });
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const user = await prisma_1.default.user.create({
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
    }
    catch (error) {
        console.error('创建用户错误:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});
// 获取用户列表
router.get('/', auth_1.authMiddleware, async (req, res) => {
    try {
        const users = await prisma_1.default.user.findMany({
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
    }
    catch (error) {
        console.error('获取用户列表错误:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});
// 更新用户
router.put('/:id', auth_1.authMiddleware, async (req, res) => {
    try {
        let { id } = req.params;
        if (Array.isArray(id)) {
            id = id[0];
        }
        const { email, realName, role, status, password, departmentId, dataScope } = req.body;
        const updateData = {};
        if (email !== undefined)
            updateData.email = email;
        if (realName !== undefined)
            updateData.realName = realName;
        if (role !== undefined)
            updateData.role = role;
        if (status !== undefined)
            updateData.status = status;
        if (departmentId !== undefined)
            updateData.departmentId = departmentId;
        if (dataScope !== undefined)
            updateData.dataScope = dataScope;
        if (password)
            updateData.password = await bcryptjs_1.default.hash(password, 10);
        const user = await prisma_1.default.user.update({
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
    }
    catch (error) {
        console.error('更新用户错误:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});
// 删除用户
router.delete('/:id', auth_1.authMiddleware, async (req, res) => {
    try {
        let { id } = req.params;
        if (Array.isArray(id)) {
            id = id[0];
        }
        await prisma_1.default.user.delete({
            where: { id: parseInt(id) },
        });
        res.json({ message: '用户删除成功' });
    }
    catch (error) {
        console.error('删除用户错误:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map