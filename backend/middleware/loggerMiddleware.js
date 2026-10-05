/**
 * Request Logging Middleware
 *
 * Lightweight custom middleware that logs incoming HTTP requests without
 * requiring third-party libraries (like Morgan or Winston).
 *
 * Captures:
 * - HTTP Method (GET, POST, etc.)
 * - Request URL
 * - Formatted ISO Timestamp
 * - Response Status Code & Latency (upon response finish)
 */
export const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();

  // Log response status and duration once the request cycle finishes
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    console.log(
      `[${timestamp}] ${req.method} ${req.originalUrl || req.url} -> Status: ${res.statusCode} (${duration}ms)`
    );
  });

  next();
};
