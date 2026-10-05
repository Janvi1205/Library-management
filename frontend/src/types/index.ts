/**
 * ShelfLife Library Management System - TypeScript Type Definitions
 * Strictly mirrors the MongoDB / Mongoose schemas implemented in the backend.
 */

/**
 * Represents a Book in the library catalog.
 * Corresponds to backend/models/Book.js.
 */
export interface Book {
  _id: string;
  title: string;
  author: string;
  ISBN: string;
  genre: string;
  totalCopies: number;
  availableCopies: number;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Represents a registered library member.
 * Corresponds to backend/models/Member.js.
 */
export interface Member {
  _id: string;
  name: string;
  email: string;
  membership: string;
  joinedDate: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Allowed loan statuses for BorrowRecord.
 */
export type BorrowStatus = 'issued' | 'returned' | 'overdue';

/**
 * Minimal Member reference populated in BorrowRecord.
 */
export interface PopulatedMemberSummary {
  _id: string;
  name: string;
  email: string;
  membership: string;
}

/**
 * Represents a borrowing transaction.
 * Corresponds to backend/models/BorrowRecord.js.
 * The backend populates 'book' and 'member' with full or partial document details.
 */
export interface BorrowRecord {
  _id: string;
  book: Book;
  member: PopulatedMemberSummary | string;
  issueDate: string;
  dueDate: string;
  returnDate: string | null;
  status: BorrowStatus;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Request payload for librarian login (POST /api/auth/login).
 */
export interface LoginPayload {
  username: string;
  password: string;
}

/**
 * Authenticated librarian session profile.
 */
export interface LibrarianUser {
  librarianId: string;
  username: string;
  role: string;
}

/**
 * API response for successful librarian login.
 */
export interface LoginResponse {
  success: boolean;
  message: string;
  token: string;
  librarian: LibrarianUser;
}

/**
 * Request payload for issuing a book (POST /api/borrow).
 */
export interface IssueBookPayload {
  book: string; // Book ObjectId
  member: string; // Member ObjectId
  dueDate: string; // ISO 8601 Date String
}

/**
 * Request payload for creating a new book (POST /api/books).
 */
export interface CreateBookPayload {
  title: string;
  author: string;
  ISBN: string;
  genre: string;
  totalCopies: number;
  availableCopies: number;
}

/**
 * Request payload for registering a new member (POST /api/members).
 */
export interface CreateMemberPayload {
  name: string;
  email: string;
  membership: string;
  joinedDate?: string;
}

/**
 * Generic API success response envelope.
 */
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

/**
 * API response for paginated book queries (GET /api/books).
 */
export interface PaginatedBooksResponse {
  success: boolean;
  currentPage: number;
  totalPages: number;
  totalBooks: number;
  limit: number;
  data: Book[];
}

/**
 * API response for member borrow history (GET /api/members/:id/history).
 */
export interface MemberHistoryResponse {
  success: boolean;
  member: Member;
  totalRecords: number;
  data: BorrowRecord[];
}

/**
 * Standardized API error response format returned by backend error middleware.
 */
export interface ApiError {
  success: false;
  message: string;
  errors?: string[];
}
