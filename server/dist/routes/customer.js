"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const prisma_1 = __importDefault(require("../utils/prisma"));
const auth_1 = require("../middleware/auth");
const dataScope_1 = require("../middleware/dataScope");
const activity_1 = require("../middleware/activity");
const router = express_1.default.Router();
router.use(auth_1.authMiddleware);
router.use(dataScope_1.dataScopeMiddleware);
// 获取客户列表
router.get('/', async (req, res) => {
    try {
        const page = Number(req.query.page) || 1;
        const pageSize = Number(req.query.pageSize) || 10;
        const search = req.query.search;
        const status = req.query.status !== undefined ? Number(req.query.status) : undefined;
        const ownerId = req.query.ownerId ? Number(req.query.ownerId) : undefined;
        const skip = (page - 1) * pageSize;
        const where = {};
        if (search) {
            where.OR = [
                { name: { contains: search } },
                { company: { contains: search } },
                { phone: { contains: search } },
            ];
        }
        if (status !== undefined)
            where.status = status;
        if (ownerId)
            where.ownerId = ownerId;
        if (req.dataScopeUserIds && req.dataScopeUserIds.length > 0) {
            where.ownerId = { in: req.dataScopeUserIds };
        }
        const [customers, total] = await Promise.all([
            prisma_1.default.customer.findMany({
                where,
                include: {
                    owner: {
                        select: { id: true, username: true, realName: true },
                    },
                },
                skip,
                take: pageSize,
                orderBy: { createdAt: 'desc' },
            }),
            prisma_1.default.customer.count({ where }),
        ]);
        res.json({
            data: customers,
            total,
            page,
            pageSize,
        });
    }
    catch (error) {
        console.error('获取客户列表错误:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});
// 获取客户详情
router.get('/:id', auth_1.authMiddleware, async (req, res) => {
    try {
        let { id } = req.params;
        if (Array.isArray(id)) {
            id = id[0];
        }
        const customer = await prisma_1.default.customer.findUnique({
            where: { id: parseInt(id) },
            include: {
                owner: {
                    select: { id: true, username: true, realName: true },
                },
                leads: true,
                opportunities: true,
                contracts: true,
            },
        });
        if (!customer) {
            return res.status(404).json({ message: '客户不存在' });
        }
        res.json(customer);
    }
    catch (error) {
        console.error('获取客户详情错误:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});
// 创建客户
router.post('/', auth_1.authMiddleware, async (req, res) => {
    try {
        const { name, company, phone, email, address, industry, source, ownerId, remark } = req.body;
        const customer = await prisma_1.default.customer.create({
            data: {
                name,
                company,
                phone,
                email,
                address,
                industry,
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
        // await logActivity(req, 'create', '创建客户', 'customer', customer.id, `创建客户: ${name}`);
        await (0, activity_1.logActivity)(req, 'create', '创建客户', 'customer', customer.id, `创建客户: ${name}`);
        res.json(customer);
    }
    catch (error) {
        console.error('创建客户错误:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});
// 更新客户
router.put('/:id', auth_1.authMiddleware, async (req, res) => {
    try {
        let { id } = req.params;
        if (Array.isArray(id)) {
            id = id[0];
        }
        const { name, company, phone, email, address, industry, source, ownerId, status, remark } = req.body;
        const customer = await prisma_1.default.customer.update({
            where: { id: parseInt(id) },
            data: {
                name,
                company,
                phone,
                email,
                address,
                industry,
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
        await (0, activity_1.logActivity)(req, 'update', '更新客户', 'customer', customer.id, `更新客户: ${name}`);
        res.json(customer);
    }
    catch (error) {
        console.error('更新客户错误:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});
// 删除客户
router.delete('/:id', auth_1.authMiddleware, async (req, res) => {
    try {
        let { id } = req.params;
        if (Array.isArray(id)) {
            id = id[0];
        }
        const customerId = parseInt(id);
        const customer = await prisma_1.default.customer.findUnique({
            where: { id: customerId },
            select: { name: true },
        });
        await prisma_1.default.customer.delete({
            where: { id: customerId },
        });
        await (0, activity_1.logActivity)(req, 'delete', '删除客户', 'customer', customerId, `删除客户: ${customer?.name}`);
        res.json({ message: '客户删除成功' });
    }
    catch (error) {
        console.error('删除客户错误:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});
exports.default = router;
//# sourceMappingURL=customer.js.map