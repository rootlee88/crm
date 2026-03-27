import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare const dataScopeMiddleware: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
declare global {
    namespace Express {
        interface Request {
            dataScopeUserIds?: number[];
        }
    }
}
//# sourceMappingURL=dataScope.d.ts.map