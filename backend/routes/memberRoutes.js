import express from 'express';
import { registerMember, getMemberBorrowHistory } from '../controllers/memberController.js';
import { validateBody } from '../middleware/validateMiddleware.js';
import { createMemberSchema } from '../utils/validationSchemas.js';

const router = express.Router();

/**
 * @route   POST /api/members
 * @desc    Register a new library member
 * @access  Public (or Librarian)
 */
router.post('/', validateBody(createMemberSchema), registerMember);

/**
 * @route   GET /api/members/:id/history
 * @desc    Retrieve complete borrow history for a specific member with populated book details
 * @access  Public (or Librarian)
 */
router.get('/:id/history', getMemberBorrowHistory);

export default router;
