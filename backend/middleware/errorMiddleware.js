/**
 * Centralized Error Handling Middleware
 *
 * Catches all runtime errors propagated via next(err) from controllers and middleware.
 * Maps specific error types (Mongoose CastError, ValidationError, Mongo duplicate key, JWT errors)
 * to standard HTTP status codes and uniform JSON responses.
 *
 * Response format:
 * {
 *   "success": false,
 *   "message": "Human readable error description",
 *   "errors": [ ...optional details... ]
 * }
 */

// Route not found (404) handler
export const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Resource not found: ${req.method} ${req.originalUrl}`,
  });
};

// Global error handler
export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let details = err.errors || undefined;

  // 1. Mongoose Bad ObjectId (CastError) -> 400 Bad Request
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 400;
    message = `Invalid ID format for field '${err.path}': '${err.value}'`;
  }

  // 2. Mongoose Schema Validation Errors -> 400 Bad Request
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Database validation failed';
    details = Object.values(err.errors).map((val) => val.message);
  }

  // 3. MongoDB Duplicate Key Error (E11000) -> 409 Conflict
  if (err.code === 11000) {
    statusCode = 409;
    const duplicatedField = Object.keys(err.keyValue || {})[0] || 'field';
    const duplicatedValue = err.keyValue ? err.keyValue[duplicatedField] : '';

    if (duplicatedField === 'ISBN') {
      message = `A book with ISBN '${duplicatedValue}' already exists.`;
    } else if (duplicatedField === 'email') {
      message = `A member with email '${duplicatedValue}' already exists.`;
    } else {
      message = `Duplicate value '${duplicatedValue}' for unique field '${duplicatedField}'.`;
    }
  }

  // 4. JWT Authentication Errors -> 401 Unauthorized
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token. Authorization failed.';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired. Please log in again.';
  }

  // If in development and server error, log error stack for debugging
  if (statusCode === 500) {
    console.error(`[Unhandled Error] ${err.stack || err}`);
  }

  const response = {
    success: false,
    message,
  };

  if (details && details.length > 0) {
    response.errors = details;
  }

  return res.status(statusCode).json(response);
};
