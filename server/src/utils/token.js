import jwt from 'jsonwebtoken';

export function createToken(userId) {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET is required to create access tokens.');
  }

  return jwt.sign({ sub: userId.toString() }, secret, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d'
  });
}
