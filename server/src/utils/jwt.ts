import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'crm-secret-key-2024';

export interface JwtPayload {
  userId: number;
  username: string;
  role: string;
  departmentId?: number;
  dataScope: string;
}

export const generateToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
};

export const verifyToken = (token: string): JwtPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
};