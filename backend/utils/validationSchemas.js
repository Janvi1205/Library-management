import Joi from 'joi';

/**
 * MongoDB ObjectId validator helper
 * Verifies that a string is a 24-character hexadecimal representation.
 */
const objectIdValidator = (value, helpers) => {
  if (!value.match(/^[0-9a-fA-F]{24}$/)) {
    return helpers.message(`"${helpers.state.path.join('.')}" must be a valid 24-character MongoDB ObjectId`);
  }
  return value;
};

/**
 * Joi Schema: Book Creation (POST /api/books)
 * Enforces title, author, ISBN, genre, totalCopies, and availableCopies.
 * Guarantees that availableCopies cannot logically exceed totalCopies.
 */
export const createBookSchema = Joi.object({
  title: Joi.string().trim().min(1).max(255).required().messages({
    'string.empty': 'Title cannot be empty',
    'any.required': 'Title is required',
  }),
  author: Joi.string().trim().min(1).max(255).required().messages({
    'string.empty': 'Author cannot be empty',
    'any.required': 'Author is required',
  }),
  ISBN: Joi.string().trim().min(3).max(50).required().messages({
    'string.empty': 'ISBN cannot be empty',
    'any.required': 'ISBN is required',
  }),
  genre: Joi.string().trim().min(1).max(100).required().messages({
    'string.empty': 'Genre cannot be empty',
    'any.required': 'Genre is required',
  }),
  totalCopies: Joi.number().integer().min(0).required().messages({
    'number.base': 'Total copies must be a number',
    'number.min': 'Total copies cannot be negative',
    'any.required': 'Total copies is required',
  }),
  availableCopies: Joi.number()
    .integer()
    .min(0)
    .max(Joi.ref('totalCopies'))
    .required()
    .messages({
      'number.base': 'Available copies must be a number',
      'number.min': 'Available copies cannot be negative',
      'number.max': 'availableCopies cannot exceed totalCopies',
      'any.required': 'Available copies is required',
    }),
});

/**
 * Joi Schema: Member Registration (POST /api/members)
 * Enforces name, email format, membership tier, and optional joinedDate.
 */
export const createMemberSchema = Joi.object({
  name: Joi.string().trim().min(1).max(150).required().messages({
    'string.empty': 'Name cannot be empty',
    'any.required': 'Name is required',
  }),
  email: Joi.string().email().trim().lowercase().required().messages({
    'string.email': 'Email must be a valid email address',
    'any.required': 'Email is required',
  }),
  membership: Joi.string().trim().min(1).max(100).required().messages({
    'string.empty': 'Membership cannot be empty',
    'any.required': 'Membership is required',
  }),
  joinedDate: Joi.date().iso().optional().messages({
    'date.format': 'Joined date must be a valid ISO date',
  }),
});

/**
 * Joi Schema: Issue / Borrow Book (POST /api/borrow)
 * Requires valid ObjectId for book and member, and a valid due date.
 */
export const issueBookSchema = Joi.object({
  book: Joi.string().custom(objectIdValidator, 'ObjectId validation').required().messages({
    'any.required': 'Book ID is required',
  }),
  member: Joi.string().custom(objectIdValidator, 'ObjectId validation').required().messages({
    'any.required': 'Member ID is required',
  }),
  dueDate: Joi.date().iso().required().messages({
    'date.base': 'Due date must be a valid date',
    'any.required': 'Due date is required',
  }),
});

/**
 * Joi Schema: Librarian Login (POST /api/auth/login)
 * Requires username and password.
 */
export const loginSchema = Joi.object({
  username: Joi.string().trim().required().messages({
    'string.empty': 'Username cannot be empty',
    'any.required': 'Username is required',
  }),
  password: Joi.string().required().messages({
    'string.empty': 'Password cannot be empty',
    'any.required': 'Password is required',
  }),
});
