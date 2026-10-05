import mongoose from 'mongoose';

/**
 * BorrowRecord Schema
 * Tracks issuing and returning of books by library members.
 * Uses Mongoose references (ObjectId) to establish relationships with Book and Member collections.
 */
const borrowRecordSchema = new mongoose.Schema(
  {
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      required: [true, 'Book reference is required'],
    },
    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member',
      required: [true, 'Member reference is required'],
    },
    issueDate: {
      type: Date,
      required: [true, 'Issue date is required'],
      default: Date.now,
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
    },
    returnDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      required: [true, 'Status is required'],
      enum: {
        values: ['issued', 'returned', 'overdue'],
        message: 'Status must be one of: issued, returned, overdue',
      },
      default: 'issued',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes on references and status for rapid member history queries and status filters
borrowRecordSchema.index({ member: 1 });
borrowRecordSchema.index({ book: 1 });
borrowRecordSchema.index({ status: 1 });

const BorrowRecord = mongoose.model('BorrowRecord', borrowRecordSchema);

export default BorrowRecord;
