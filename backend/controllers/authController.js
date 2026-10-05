import jwt from 'jsonwebtoken';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * @desc    Authenticate librarian & issue JWT
 * @route   POST /api/auth/login
 * @access  Public
 *
 * Implements simplified librarian authentication for the college library assessment.
 * Compares incoming credentials against configured librarian credentials and issues
 * a signed JSON Web Token (JWT) encoding the librarian's identity and role.
 */
export const loginLibrarian = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  const validUsername = process.env.LIBRARIAN_USERNAME || 'librarian';
  const validPassword = process.env.LIBRARIAN_PASSWORD || 'librarian123';

  // Verify librarian credentials
  if (username !== validUsername || password !== validPassword) {
    return res.status(401).json({
      success: false,
      message: 'Invalid librarian credentials.',
    });
  }

  // Token payload identifying the authenticated librarian
  const payload = {
    librarianId: 'librarian-admin-01',
    username: validUsername,
    role: 'librarian',
  };

  const secret = process.env.JWT_SECRET || 'shelflife_super_secret_jwt_key_2026';
  const expiresIn = process.env.JWT_EXPIRES_IN || '24h';

  // Sign JWT
  const token = jwt.sign(payload, secret, { expiresIn });

  return res.status(200).json({
    success: true,
    message: 'Login successful',
    token,
    librarian: payload,
  });
});
