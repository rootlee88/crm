"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
const auth_1 = __importDefault(require("./routes/auth"));
const customer_1 = __importDefault(require("./routes/customer"));
const lead_1 = __importDefault(require("./routes/lead"));
const opportunity_1 = __importDefault(require("./routes/opportunity"));
const contract_1 = __importDefault(require("./routes/contract"));
const task_1 = __importDefault(require("./routes/task"));
const activity_1 = __importDefault(require("./routes/activity"));
const dashboard_1 = __importDefault(require("./routes/dashboard"));
const department_1 = __importDefault(require("./routes/department"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
app.use((0, cors_1.default)());
app.use((0, morgan_1.default)('dev'));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use('/api/auth', auth_1.default);
app.use('/api/customers', customer_1.default);
app.use('/api/leads', lead_1.default);
app.use('/api/opportunities', opportunity_1.default);
app.use('/api/contracts', contract_1.default);
app.use('/api/tasks', task_1.default);
app.use('/api/activities', activity_1.default);
app.use('/api/dashboard', dashboard_1.default);
app.use('/api/departments', department_1.default);
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
app.use((err, req, res, next) => {
    console.error('服务器错误:', err);
    res.status(500).json({ message: '服务器内部错误' });
});
app.listen(PORT, () => {
    console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
});
exports.default = app;
//# sourceMappingURL=index.js.map