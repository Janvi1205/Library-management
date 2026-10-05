import mongoose from 'mongoose';
import Member from '../models/Member.js';
import BorrowRecord from '../models/BorrowRecord.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * @desc    Register a new library member
 * @route   POST /api/members
 * @access  Public (or Librarian)
 *
 * Validates member info, checks for unique email address, and saves member.
 */
export const registerMember = asyncHandler(async (req, res) => {
  const { name, email, membership, joinedDate } = req.body;

  // Check for duplicate email
  const existingMember = await Member.findOne({ email });
  if (existingMember) {
    return res.status(409).json({
      success: false,
      message: `A member with email '${email}' is already registered.`,
    });
  }

  const member = await Member.create({
    name,
    email,
    membership,
    joinedDate: joinedDate || new Date(),
  });

  return res.status(201).json({
    success: true,
    message: 'Member registered successfully',
    data: member,
  });
});

/**
 * @desc    Get member borrow history with populated book details
 * @route   GET /api/members/:id/history
 * @access  Public (or Librarian)
 *
 * Populates book information (title, author, ISBN, genre) so the frontend
 * can display comprehensive loan records without secondary queries.
 */
export const getMemberBorrowHistory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Validate ObjectId format before querying
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: `Invalid member ID format: '${id}'. Must be a 24-character hexadecimal ObjectId.`,
    });
  }

  // Verify member exists
  const member = await Member.findById(id).select('-__v');
  if (!member) {
    return res.status(404).json({
      success: false,
      message: 'Member not found',
    });
  }

  // Find all borrow records associated with this member
  // Using Mongoose populate to embed book details directly into the response
  const history = await BorrowRecord.find({ member: id })
    .populate('book', 'title author ISBN genre totalCopies availableCopies')
    .sort({ issueDate: -1 })
    .lean();

  return res.status(200).json({
    success: true,
    member: {
      _id: member._id,
      name: member.name,
      email: member.email,
      membership: member.membership,
      joinedDate: member.joinedDate,
    },
    totalRecords: history.length,
    data: history,
  });
});
