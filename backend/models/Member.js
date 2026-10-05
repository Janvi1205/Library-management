import mongoose from 'mongoose';

/**
 * Member Schema
 * Represents library members (students, faculty, researchers) enrolled in ShelfLife.
 * Enforces unique email constraint and required membership details.
 */
const memberSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    membership: {
      type: String,
      required: [true, 'Membership type is required'],
      trim: true,
    },
    joinedDate: {
      type: Date,
      required: [true, 'Joined date is required'],
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const Member = mongoose.model('Member', memberSchema);

export default Member;
