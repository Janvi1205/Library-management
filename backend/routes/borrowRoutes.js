import express from 'express';
import { issueBook } from '../controllers/borrowController.js';
import { authenticateJWT } from '../middleware/authMiddleware.js';
import { validateBody } from '../middleware/validateMiddleware.js';
import { issueBookSchema } from '../utils/validationSchemas.js';

const router = express.Router();

/**
 * @route   POST /api/borrow
 * @desc    Issue a book to a member (Protected: Librarian JWT required)
 * @access  Private / Librarian
 */
router.post('/', authenticateJWT, validateBody(issueBookSchema), issueBook);

export default router;
