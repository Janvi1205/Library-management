import mongoose from 'mongoose';

/**
 * Book Schema
 * Represents books managed in the ShelfLife library system.
 * Enforces field validations and guarantees availableCopies <= totalCopies.
 */
const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    author: {
      type: String,
      required: [true, 'Author is required'],
      trim: true,
    },
    ISBN: {
      type: String,
      required: [true, 'ISBN is required'],
      unique: true,
      trim: true,
    },
    genre: {
      type: String,
      required: [true, 'Genre is required'],
      trim: true,
    },
    totalCopies: {
      type: Number,
      required: [true, 'Total copies is required'],
      min: [0, 'Total copies cannot be negative'],
    },
    availableCopies: {
      type: Number,
      required: [true, 'Available copies is required'],
      min: [0, 'Available copies cannot be negative'],
      validate: {
        validator: function (value) {
          // Custom validator: Ensure available copies does not exceed total inventory
          if (this.totalCopies !== undefined) {
            return value <= this.totalCopies;
          }
          return true;
        },
        message: 'availableCopies ({VALUE}) cannot logically exceed totalCopies.',
      },
    },
  },
  {
    timestamps: true,
  }
);

// Index for fast genre filtering
bookSchema.index({ genre: 1 });

const Book = mongoose.model('Book', bookSchema);

export default Book;
