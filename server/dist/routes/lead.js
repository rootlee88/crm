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
// 获取线索列表
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
        const [leads, total] = await Promise.all([
            prisma_1.default.lead.findMany({
                where,
                include: {
                    owner: {
                        select: { id: true, username: true, realName: true },
                    },
                    customer: true,
                },
                skip,
                take: pageSize,
                orderBy: { createdAt: 'desc' },
            }),
            prisma_1.default.lead.count({ where }),
        ]);
        res.json({
            data: leads,
            total,
            page,
            pageSize,
        });
    }
    catch (error) {
        console.error('获取线索列表错误:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});
// 获取线索详情
router.get('/:id', auth_1.authMiddleware, async (req, res) => {
    try {
        let { id } = req.params;
        if (Array.isArray(id)) {
            id = id[0];
        }
        const lead = await prisma_1.default.lead.findUnique({
            where: { id: parseInt(id) },
            include: {
                owner: {
                    select: { id: true, username: true, realName: true },
                },
                customer: true,
            },
        });
        if (!lead) {
            return res.status(404).json({ message: '线索不存在' });
        }
        res.json(lead);
    }
    catch (error) {
        console.error('获取线索详情错误:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});
// 创建线索
router.post('/', auth_1.authMiddleware, async (req, res) => {
    try {
        const { name, phone, email, company, source, ownerId, remark } = req.body;
        const lead = await prisma_1.default.lead.create({
            data: {
                name,
                phone,
                email,
                company,
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
        await (0, activity_1.logActivity)(req, 'create', '创建线索', 'lead', lead.id, `创建线索: ${name}`);
        res.json(lead);
    }
    catch (error) {
        console.error('创建线索错误:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});
// 更新线索
router.put('/:id', auth_1.authMiddleware, async (req, res) => {
    try {
        let { id } = req.params;
        if (Array.isArray(id)) {
            id = id[0];
        }
        const { name, phone, email, company, source, ownerId, status, remark } = req.body;
        const lead = await prisma_1.default.lead.update({
            where: { id: parseInt(id) },
            data: {
                name,
                phone,
                email,
                company,
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
        await (0, activity_1.logActivity)(req, 'update', '更新线索', 'lead', lead.id, `更新线索: ${name}`);
        res.json(lead);
    }
    catch (error) {
        console.error('更新线索错误:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});
// 线索转换为客户
router.put('/:id/convert', auth_1.authMiddleware, async (req, res) => {
    try {
        let { id } = req.params;
        if (Array.isArray(id)) {
            id = id[0];
        }
        const { customerId } = req.body;
        const lead = await prisma_1.default.lead.findUnique({
            where: { id: parseInt(id) },
        });
        if (!lead) {
            return res.status(404).json({ message: '线索不存在' });
        }
        const updatedLead = await prisma_1.default.lead.update({
            where: { id: parseInt(id) },
            data: { status: 3 },
        });
        if (customerId) {
            await prisma_1.default.lead.update({
                where: { id: parseInt(id) },
                data: { customerId },
            });
        }
        await (0, activity_1.logActivity)(req, 'convert', '转换线索', 'lead', parseInt(id), `将线索 "${lead.name}" 转换为客户`);
        res.json({ message: '线索转换成功', lead: updatedLead });
    }
    catch (error) {
        console.error('线索转换错误:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});
// 删除线索
router.delete('/:id', auth_1.authMiddleware, async (req, res) => {
    try {
        let { id } = req.params;
        if (Array.isArray(id)) {
            id = id[0];
        }
        const leadId = parseInt(id);
        const lead = await prisma_1.default.lead.findUnique({
            where: { id: leadId },
            select: { name: true },
        });
        await prisma_1.default.lead.delete({
            where: { id: leadId },
        });
        await (0, activity_1.logActivity)(req, 'delete', '删除线索', 'lead', leadId, `删除线索: ${lead?.name}`);
        res.json({ message: '线索删除成功' });
    }
    catch (error) {
        console.error('删除线索错误:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});
exports.default = router;
//# sourceMappingURL=lead.js.map