export interface JwtPayload {
    userId: number;
    username: string;
    role: string;
    departmentId?: number;
    dataScope: string;
}
export declare const generateToken: (payload: JwtPayload) => string;
export declare const verifyToken: (token: string) => JwtPayload | null;
//# sourceMappingURL=jwt.d.ts.map