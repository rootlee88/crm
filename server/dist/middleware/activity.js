"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logActivity = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const logActivity = async (req, type, action, targetType, targetId, content) => {
    if (!req.user)
        return;
    await prisma_1.default.activity.create({
        data: {
            userId: req.user.userId,
            type,
            action,
            targetType,
            targetId,
            content,
        },
    });
};
exports.logActivity = logActivity;
//# sourceMappingURL=activity.js.map