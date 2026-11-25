export function errorHandler(error, _request, response, _next) {
  let statusCode = error.statusCode || 500;
  let message = error.message || 'An unexpected server error occurred.';

  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(error.errors).map((item) => item.message).join(' ');
  }

  if (error.code === 11000) {
    statusCode = 409;
    message = 'A record with this value already exists.';
  }

  if (error.name === 'CastError') {
    statusCode = 400;
    message = 'An invalid resource identifier was provided.';
  }

  if (statusCode >= 500) {
    console.error(error);
    message = 'An unexpected server error occurred.';
  }

  response.status(statusCode).json({
    success: false,
    message
  });
}
