import mongoose from 'mongoose';
import Book from '../models/Book.js';
import Member from '../models/Member.js';
import BorrowRecord from '../models/BorrowRecord.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * @desc    Issue / Borrow a book to a member
 * @route   POST /api/borrow
 * @access  Protected (Librarian JWT required)
 *
 * RACE CONDITION PREVENTION EXPLANATION:
 * 1. Under high concurrency, two librarians issuing the last copy at the exact same moment
 *    could both read availableCopies = 1 and both issue the book, resulting in -1 copies.
 * 2. To prevent this, we execute an atomic conditional update:
 *    Book.findOneAndUpdate({ _id: book, availableCopies: { $gt: 0 } }, { $inc: { availableCopies: -1 } })
 * 3. MongoDB executes single-document write operations atomically at the database engine level.
 * 4. Only the first incoming request satisfies the `{ $gt: 0 }` condition and decrements the counter.
 * 5. The second concurrent request fails the condition, returns null, and is safely rejected with a 400 status.
 * 6. If creating the BorrowRecord encounters an unexpected error, inventory is safely compensated.
 */
export const issueBook = asyncHandler(async (req, res) => {
  const { book: bookId, member: memberId, dueDate } = req.body;

  // 1. Verify Member exists
  const member = await Member.findById(memberId);
  if (!member) {
    return res.status(404).json({
      success: false,
      message: 'Member not found',
    });
  }

  // 2. Check if the book exists in the catalog
  const bookExists = await Book.findById(bookId);
  if (!bookExists) {
    return res.status(404).json({
      success: false,
      message: 'Book not found in library catalog',
    });
  }

  // 3. Atomically check availability and decrement availableCopies in a single operation
  // This atomic conditional update guarantees concurrency safety without Redis or distributed locks
  const updatedBook = await Book.findOneAndUpdate(
    { _id: bookId, availableCopies: { $gt: 0 } },
    { $inc: { availableCopies: -1 } },
    { new: true }
  );

  // If null is returned, availableCopies was 0 at the instant of execution
  if (!updatedBook) {
    return res.status(400).json({
      success: false,
      message: 'No copies available for borrowing. All copies are currently issued.',
    });
  }

  // 4. Create BorrowRecord with issueDate, dueDate, and status: 'issued'
  let borrowRecord;
  try {
    borrowRecord = await BorrowRecord.create({
      book: bookId,
      member: memberId,
      issueDate: new Date(),
      dueDate: new Date(dueDate),
      status: 'issued',
    });

    // Populate book and member references for rich, predictable frontend response
    await borrowRecord.populate([
      { path: 'book', select: 'title author ISBN genre totalCopies availableCopies' },
      { path: 'member', select: 'name email membership' },
    ]);
  } catch (error) {
    // Compensation rollback: if BorrowRecord creation fails, restore the decremented copy
    await Book.findByIdAndUpdate(bookId, { $inc: { availableCopies: 1 } });
    throw error;
  }

  return res.status(201).json({
    success: true,
    message: 'Book issued successfully',
    data: borrowRecord,
  });
});

/**
 * @desc    Return a borrowed book
 * @route   POST /api/return/:borrowId
 * @access  Protected (Librarian JWT required)
 *
 * Steps:
 * 1. Validates borrowId format.
 * 2. Verifies borrow record exists.
 * 3. Atomically updates status to 'returned' and sets returnDate only if status is NOT already 'returned'.
 *    This prevents double-return race conditions.
 * 4. Atomically increments Book.availableCopies by +1.
 * 5. Returns updated record populated with book and member details.
 */
export const returnBook = asyncHandler(async (req, res) => {
  const { borrowId } = req.params;

  // Validate ObjectId format
  if (!mongoose.Types.ObjectId.isValid(borrowId)) {
    return res.status(400).json({
      success: false,
      message: `Invalid borrow ID format: '${borrowId}'. Must be a 24-character hexadecimal ObjectId.`,
    });
  }

  // Find borrow record
  const existingRecord = await BorrowRecord.findById(borrowId);
  if (!existingRecord) {
    return res.status(404).json({
      success: false,
      message: 'Borrow record not found',
    });
  }

  // Check if book has already been returned
  if (existingRecord.status === 'returned') {
    return res.status(400).json({
      success: false,
      message: 'Book has already been returned',
    });
  }

  const returnDate = new Date();

  // Atomically update BorrowRecord status and returnDate
  // Conditional query `{ status: { $ne: 'returned' } }` prevents double-returns under concurrent requests
  const updatedRecord = await BorrowRecord.findOneAndUpdate(
    { _id: borrowId, status: { $ne: 'returned' } },
    { $set: { status: 'returned', returnDate } },
    { new: true }
  );

  if (!updatedRecord) {
    return res.status(400).json({
      success: false,
      message: 'Book has already been returned',
    });
  }

  // Atomically increment the book's available copies back by 1
  await Book.findByIdAndUpdate(updatedRecord.book, {
    $inc: { availableCopies: 1 },
  });

  // Populate book and member references for rich frontend response
  await updatedRecord.populate([
    { path: 'book', select: 'title author ISBN genre totalCopies availableCopies' },
    { path: 'member', select: 'name email membership' },
  ]);

  return res.status(200).json({
    success: true,
    message: 'Book returned successfully',
    data: updatedRecord,
  });
});
