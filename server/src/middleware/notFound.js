import AppError from '../utils/AppError.js';

export function notFound(request, _response, next) {
  next(new AppError(`Route not found: ${request.method} ${request.originalUrl}`, 404));
}
