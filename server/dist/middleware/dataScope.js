"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dataScopeMiddleware = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const dataScopeMiddleware = async (req, res, next) => {
    const user = req.user;
    if (!user) {
        return res.status(401).json({ message: '未授权访问' });
    }
    if (user.role === 'admin' || user.dataScope === 'all') {
        return next();
    }
    if (user.dataScope === 'department' && user.departmentId) {
        const departmentUserIds = await prisma_1.default.user.findMany({
            where: { departmentId: user.departmentId },
            select: { id: true },
        });
        req.dataScopeUserIds = departmentUserIds.map(u => u.id);
    }
    else {
        req.dataScopeUserIds = [user.userId];
    }
    next();
};
exports.dataScopeMiddleware = dataScopeMiddleware;
//# sourceMappingURL=dataScope.js.map