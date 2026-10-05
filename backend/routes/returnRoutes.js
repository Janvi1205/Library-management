import express from 'express';
import { returnBook } from '../controllers/borrowController.js';
import { authenticateJWT } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @route   POST /api/return/:borrowId
 * @desc    Return an issued book (Protected: Librarian JWT required)
 * @access  Private / Librarian
 */
router.post('/:borrowId', authenticateJWT, returnBook);

export default router;
