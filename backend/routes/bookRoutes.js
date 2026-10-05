import express from 'express';
import { createBook, getBooks } from '../controllers/bookController.js';
import { validateBody } from '../middleware/validateMiddleware.js';
import { createBookSchema } from '../utils/validationSchemas.js';

const router = express.Router();

/**
 * @route   POST /api/books
 * @desc    Add a new book to the library catalog
 * @access  Public (or Librarian)
 */
router.post('/', validateBody(createBookSchema), createBook);

/**
 * @route   GET /api/books
 * @desc    Get paginated books with optional genre filtering (?page=1&limit=10&genre=fiction)
 * @access  Public
 */
router.get('/', getBooks);

export default router;
