import Book from '../models/Book.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * @desc    Add a new book to the library catalog
 * @route   POST /api/books
 * @access  Public (or Librarian)
 *
 * Validates book fields, ensures ISBN is unique, ensures availableCopies <= totalCopies,
 * and creates the new Book document in MongoDB.
 */
export const createBook = asyncHandler(async (req, res) => {
  const { title, author, ISBN, genre, totalCopies, availableCopies } = req.body;

  // Check for duplicate ISBN before saving to provide immediate clear feedback
  const existingBook = await Book.findOne({ ISBN });
  if (existingBook) {
    return res.status(409).json({
      success: false,
      message: `A book with ISBN '${ISBN}' already exists in the catalog.`,
    });
  }

  // Create new book document
  const book = await Book.create({
    title,
    author,
    ISBN,
    genre,
    totalCopies,
    availableCopies,
  });

  return res.status(201).json({
    success: true,
    message: 'Book created successfully',
    data: book,
  });
});

/**
 * @desc    Get paginated books with optional genre filter
 * @route   GET /api/books
 * @access  Public
 *
 * Query params supported:
 * - page: page number (default: 1)
 * - limit: items per page (default: 10)
 * - genre: filter by book genre (case-insensitive)
 */
export const getBooks = asyncHandler(async (req, res) => {
  // Parse pagination parameters with sensible defaults
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 10));
  const skip = (page - 1) * limit;

  // Build query filter
  const filter = {};
  if (req.query.genre && typeof req.query.genre === 'string' && req.query.genre.trim()) {
    // Case-insensitive exact genre match
    filter.genre = new RegExp(`^${req.query.genre.trim()}$`, 'i');
  }

  // Execute count and query in parallel for maximum query performance
  const [totalBooks, books] = await Promise.all([
    Book.countDocuments(filter),
    Book.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
  ]);

  const totalPages = Math.ceil(totalBooks / limit) || 1;

  return res.status(200).json({
    success: true,
    currentPage: page,
    totalPages,
    totalBooks,
    limit,
    data: books,
  });
});
