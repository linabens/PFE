import jwt from 'jsonwebtoken';
import { AppError } from './errors';

const getSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new AppError('JWT_SECRET is not defined', 500);
  return secret;
};

export const generateToken = (userId: string): string => {
  return jwt.sign({ id: userId }, getSecret(), { expiresIn: '7d' });
};

export const verifyToken = (token: string): any => {
  try {
    return jwt.verify(token, getSecret());
  } catch (error) {
    throw new AppError('Invalid or expired token', 401);
  }
};
