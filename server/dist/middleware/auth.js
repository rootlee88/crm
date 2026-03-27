"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = exports.authMiddleware = void 0;
const jwt_1 = require("../utils/jwt");
const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: '未授权访问' });
    }
    const token = authHeader.substring(7);
    const payload = (0, jwt_1.verifyToken)(token);
    if (!payload) {
        return res.status(401).json({ message: 'Token无效或已过期' });
    }
    req.user = payload;
    next();
};
exports.authMiddleware = authMiddleware;
const requireRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ message: '权限不足' });
        }
        next();
    };
};
exports.requireRole = requireRole;
//# sourceMappingURL=auth.js.map