import AppError from '../utils/AppError.js';

export const authorize = (...roles) => (request, _response, next) => {
  if (!request.user || !roles.includes(request.user.role)) {
    return next(new AppError('You do not have permission to perform this action.', 403));
  }

  return next();
};
