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
// 获取任务列表
router.get('/', async (req, res) => {
    try {
        const page = Number(req.query.page) || 1;
        const pageSize = Number(req.query.pageSize) || 10;
        const status = req.query.status !== undefined ? Number(req.query.status) : undefined;
        const assigneeId = req.query.assigneeId ? Number(req.query.assigneeId) : undefined;
        const ownerId = req.query.ownerId ? Number(req.query.ownerId) : undefined;
        const type = req.query.type;
        const skip = (page - 1) * pageSize;
        const where = {};
        if (status !== undefined)
            where.status = status;
        if (assigneeId)
            where.assigneeId = assigneeId;
        if (ownerId)
            where.ownerId = ownerId;
        if (type)
            where.type = type;
        if (req.dataScopeUserIds && req.dataScopeUserIds.length > 0) {
            where.OR = [
                { ownerId: { in: req.dataScopeUserIds } },
                { assigneeId: { in: req.dataScopeUserIds } },
            ];
        }
        const [tasks, total] = await Promise.all([
            prisma_1.default.task.findMany({
                where,
                include: {
                    assignee: {
                        select: { id: true, username: true, realName: true },
                    },
                    creator: {
                        select: { id: true, username: true, realName: true },
                    },
                },
                skip,
                take: pageSize,
                orderBy: { createdAt: 'desc' },
            }),
            prisma_1.default.task.count({ where }),
        ]);
        res.json({
            data: tasks,
            total,
            page,
            pageSize,
        });
    }
    catch (error) {
        console.error('获取任务列表错误:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});
// 获取任务详情
router.get('/:id', auth_1.authMiddleware, async (req, res) => {
    try {
        let { id } = req.params;
        if (Array.isArray(id)) {
            id = id[0];
        }
        const task = await prisma_1.default.task.findUnique({
            where: { id: parseInt(id) },
            include: {
                assignee: {
                    select: { id: true, username: true, realName: true },
                },
                creator: {
                    select: { id: true, username: true, realName: true },
                },
            },
        });
        if (!task) {
            return res.status(404).json({ message: '任务不存在' });
        }
        res.json(task);
    }
    catch (error) {
        console.error('获取任务详情错误:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});
// 创建任务
router.post('/', auth_1.authMiddleware, async (req, res) => {
    try {
        const { title, content, type, priority, dueDate, assigneeId, relatedType, relatedId } = req.body;
        const task = await prisma_1.default.task.create({
            data: {
                title,
                content,
                type: type || 'general',
                priority: priority || 2,
                dueDate,
                assigneeId,
                ownerId: req.user.userId,
                relatedType,
                relatedId,
            },
            include: {
                assignee: {
                    select: { id: true, username: true, realName: true },
                },
                creator: {
                    select: { id: true, username: true, realName: true },
                },
            },
        });
        await (0, activity_1.logActivity)(req, 'create', '创建任务', 'task', task.id, `创建任务: ${title}`);
        res.json(task);
    }
    catch (error) {
        console.error('创建任务错误:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});
// 更新任务
router.put('/:id', auth_1.authMiddleware, async (req, res) => {
    try {
        let { id } = req.params;
        if (Array.isArray(id)) {
            id = id[0];
        }
        const { title, content, type, priority, dueDate, assigneeId, relatedType, relatedId, status } = req.body;
        const task = await prisma_1.default.task.update({
            where: { id: parseInt(id) },
            data: {
                title,
                content,
                type,
                priority,
                dueDate,
                assigneeId,
                relatedType,
                relatedId,
                status,
            },
            include: {
                assignee: {
                    select: { id: true, username: true, realName: true },
                },
                creator: {
                    select: { id: true, username: true, realName: true },
                },
            },
        });
        await (0, activity_1.logActivity)(req, 'update', '更新任务', 'task', task.id, `更新任务: ${title}`);
        res.json(task);
    }
    catch (error) {
        console.error('更新任务错误:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});
// 更新任务状态
router.put('/:id/status', auth_1.authMiddleware, async (req, res) => {
    try {
        let { id } = req.params;
        if (Array.isArray(id)) {
            id = id[0];
        }
        const taskId = parseInt(id);
        const status = Number(req.body.status);
        const existingTask = await prisma_1.default.task.findUnique({
            where: { id: taskId },
            select: { title: true },
        });
        const task = await prisma_1.default.task.update({
            where: { id: taskId },
            data: { status },
            include: {
                assignee: {
                    select: { id: true, username: true, realName: true },
                },
                creator: {
                    select: { id: true, username: true, realName: true },
                },
            },
        });
        await (0, activity_1.logActivity)(req, 'update', '更新任务状态', 'task', task.id, `更新任务状态: ${existingTask?.title}`);
        res.json(task);
    }
    catch (error) {
        console.error('更新任务状态错误:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});
// 删除任务
router.delete('/:id', auth_1.authMiddleware, async (req, res) => {
    try {
        let { id } = req.params;
        if (Array.isArray(id)) {
            id = id[0];
        }
        const taskId = parseInt(id);
        const task = await prisma_1.default.task.findUnique({
            where: { id: taskId },
            select: { title: true },
        });
        await prisma_1.default.task.delete({
            where: { id: taskId },
        });
        await (0, activity_1.logActivity)(req, 'delete', '删除任务', 'task', taskId, `删除任务: ${task?.title}`);
        res.json({ message: '任务删除成功' });
    }
    catch (error) {
        console.error('删除任务错误:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});
exports.default = router;
//# sourceMappingURL=task.js.map