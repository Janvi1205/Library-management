import React, { useState } from 'react';
import { apiClient, ShelfLifeApiError } from '../api/api';
import type { Book } from '../types';

interface AddBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBookCreated: (book: Book) => void;
}

const COMMON_GENRES = [
  'Computer Science',
  'Software Engineering',
  'Fiction',
  'Mathematics',
  'History',
  'Science',
  'Economics',
  'Philosophy',
];

/**
 * Add New Book Modal
 *
 * Implements "Add New Book" feature:
 * - Submits { title, author, ISBN, genre, totalCopies, availableCopies } to POST /api/books
 * - Automatically sets availableCopies = totalCopies
 * - Validates positive integer copies and non-empty fields
 * - Disables submit button during network request to prevent duplicate submissions
 * - Retains form values on error and displays backend error message
 */
export const AddBookModal: React.FC<AddBookModalProps> = ({
  isOpen,
  onClose,
  onBookCreated,
}) => {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [ISBN, setISBN] = useState('');
  const [genre, setGenre] = useState(COMMON_GENRES[0]);
  const [totalCopies, setTotalCopies] = useState<string>('5');

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Client-side validation
    const trimmedTitle = title.trim();
    const trimmedAuthor = author.trim();
    const trimmedISBN = ISBN.trim();
    const trimmedGenre = genre.trim();
    const copiesNum = parseInt(totalCopies, 10);

    if (!trimmedTitle) {
      setErrorMessage('Please enter a book title.');
      return;
    }
    if (!trimmedAuthor) {
      setErrorMessage('Please enter an author name.');
      return;
    }
    if (!trimmedISBN) {
      setErrorMessage('Please enter an ISBN.');
      return;
    }
    if (!trimmedGenre) {
      setErrorMessage('Please select or enter a genre.');
      return;
    }
    if (isNaN(copiesNum) || copiesNum <= 0) {
      setErrorMessage('Total Copies must be a positive integer greater than 0.');
      return;
    }

    try {
      setSubmitting(true);

      // Backend requires availableCopies alongside totalCopies
      const response = await apiClient.createBook({
        title: trimmedTitle,
        author: trimmedAuthor,
        ISBN: trimmedISBN,
        genre: trimmedGenre,
        totalCopies: copiesNum,
        availableCopies: copiesNum, // Automatically matched per requirement
      });

      // Reset form
      setTitle('');
      setAuthor('');
      setISBN('');
      setGenre(COMMON_GENRES[0]);
      setTotalCopies('5');

      onBookCreated(response.data);
      onClose();
    } catch (err: unknown) {
      if (err instanceof ShelfLifeApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Failed to add book. Please check your connection to the backend.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <span className="modal-icon">📖</span>
            <h3>Add New Book to Catalog</h3>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            disabled={submitting}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {errorMessage && (
          <div className="alert alert-danger" role="alert">
            <span>⚠️ {errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="book-title">
              Book Title <span className="text-danger">*</span>
            </label>
            <input
              id="book-title"
              type="text"
              className="form-control"
              placeholder="e.g. Designing Data-Intensive Applications"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={submitting}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="book-author">
              Author <span className="text-danger">*</span>
            </label>
            <input
              id="book-author"
              type="text"
              className="form-control"
              placeholder="e.g. Martin Kleppmann"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              disabled={submitting}
              required
            />
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label htmlFor="book-isbn">
                ISBN <span className="text-danger">*</span>
              </label>
              <input
                id="book-isbn"
                type="text"
                className="form-control"
                placeholder="e.g. 9781449373320"
                value={ISBN}
                onChange={(e) => setISBN(e.target.value)}
                disabled={submitting}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="book-genre">
                Genre <span className="text-danger">*</span>
              </label>
              <select
                id="book-genre"
                className="form-control"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                disabled={submitting}
                required
              >
                {COMMON_GENRES.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="book-total-copies">
              Total Copies <span className="text-danger">*</span>
            </label>
            <input
              id="book-total-copies"
              type="number"
              min="1"
              step="1"
              className="form-control"
              placeholder="e.g. 5"
              value={totalCopies}
              onChange={(e) => setTotalCopies(e.target.value)}
              disabled={submitting}
              required
            />
            <small className="form-text text-muted">
              ℹ️ Available copies will be automatically initialized to match Total Copies ({totalCopies || 0}).
            </small>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Adding Book...' : 'Save Book to Catalog'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
