import express from 'express';
import { loginLibrarian } from '../controllers/authController.js';
import { validateBody } from '../middleware/validateMiddleware.js';
import { loginSchema } from '../utils/validationSchemas.js';

const router = express.Router();

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate librarian credentials & return JWT token
 * @access  Public
 */
router.post('/login', validateBody(loginSchema), loginLibrarian);

export default router;
