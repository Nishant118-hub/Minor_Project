import mongoose from 'mongoose';
import AppError from './AppError.js';

export function requireObjectId(value, field = 'Resource id') {
  if (!mongoose.isValidObjectId(value)) {
    throw new AppError(`${field} is invalid.`, 400);
  }
  return value;
}
