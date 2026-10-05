/**
 * Async Handler Wrapper
 *
 * Wraps asynchronous Express controller functions to automatically catch
 * unhandled promise rejections and forward them to the next(err) error-handling middleware.
 * Eliminates repetitive try/catch blocks across controllers.
 *
 * @param {Function} fn - Asynchronous route handler
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
