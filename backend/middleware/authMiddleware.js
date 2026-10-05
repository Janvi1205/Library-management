import jwt from 'jsonwebtoken';

/**
 * JWT Authentication Middleware
 *
 * Enforces role-based or authenticated access for protected librarian routes.
 *
 * Steps:
 * 1. Checks if the `Authorization` header is present and starts with `Bearer `.
 * 2. Extracts and verifies the JSON Web Token using the server's JWT_SECRET.
 * 3. Decodes librarian identity and attaches it to `req.user`.
 * 4. Rejects requests with 401 Unauthorized if the token is missing, malformed, or expired.
 */
export const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // Check if Authorization header exists and follows the Bearer schema
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. Missing or malformed authorization token.',
    });
  }

  // Extract token string after 'Bearer '
  const token = authHeader.split(' ')[1];

  try {
    const secret = process.env.JWT_SECRET || 'shelflife_super_secret_jwt_key_2026';
    const decoded = jwt.verify(token, secret);

    // Attach authenticated librarian details to request object for downstream use
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Authorization token has expired. Please log in again.',
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid authorization token. Access denied.',
    });
  }
};
