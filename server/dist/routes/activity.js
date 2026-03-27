"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const prisma_1 = __importDefault(require("../utils/prisma"));
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// 获取活动日志列表
router.get('/', auth_1.authMiddleware, async (req, res) => {
    try {
        const page = Number(req.query.page) || 1;
        const pageSize = Number(req.query.pageSize) || 20;
        const type = req.query.type;
        const targetType = req.query.targetType;
        const userId = req.query.userId ? Number(req.query.userId) : undefined;
        const skip = (page - 1) * pageSize;
        const where = {};
        if (type)
            where.type = type;
        if (targetType)
            where.targetType = targetType;
        if (userId)
            where.userId = userId;
        const [activities, total] = await Promise.all([
            prisma_1.default.activity.findMany({
                where,
                include: {
                    user: {
                        select: { id: true, username: true, realName: true },
                    },
                },
                skip,
                take: pageSize,
                orderBy: { createdAt: 'desc' },
            }),
            prisma_1.default.activity.count({ where }),
        ]);
        res.json({
            data: activities,
            total,
            page,
            pageSize,
        });
    }
    catch (error) {
        console.error('获取活动日志错误:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});
// 获取今日活动统计
router.get('/today', auth_1.authMiddleware, async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const activities = await prisma_1.default.activity.findMany({
            where: {
                createdAt: {
                    gte: today,
                    lt: tomorrow,
                },
            },
            include: {
                user: {
                    select: { id: true, username: true, realName: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json(activities);
    }
    catch (error) {
        console.error('获取今日活动错误:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});
exports.default = router;
//# sourceMappingURL=activity.js.map