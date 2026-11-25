import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import AppError from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const authenticate = asyncHandler(async (request, _response, next) => {
  const authorization = request.headers.authorization;

  if (!authorization?.startsWith('Bearer ')) {
    throw new AppError('Authentication is required.', 401);
  }

  const token = authorization.slice(7);
  let payload;

  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw new AppError('Your session is invalid or has expired.', 401);
  }

  const user = await User.findById(payload.sub);
  if (!user || !user.isActive) {
    throw new AppError('Your account is unavailable.', 401);
  }

  request.user = user;
  next();
});
