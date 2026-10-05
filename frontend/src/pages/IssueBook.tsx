import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { apiClient, ShelfLifeApiError } from '../api/api';
import type { Book, BorrowRecord } from '../types';
import { MOCK_MEMBERS } from '../mocks/members';

/**
 * Issue Book Page Component
 *
 * Implements Question Q2(c) requirements:
 * 1. Book selection: Populated from real GET /api/books API. Books with availableCopies = 0
 *    are disabled with a clear "Out of stock" indicator.
 * 2. Member selection: Uses typed mock members (src/mocks/members.ts) with educational notice
 *    since backend does not provide GET /api/members.
 * 3. Due date selector: Defaults to standard 14 days from today.
 * 4. Submit behavior:
 *    - Calls real POST /api/borrow with JWT header
 *    - Submit button disabled during request
 *    - Loading indicator ("Issuing Book...")
 *    - Clear success message with issued transaction details
 *    - Clear error feedback from backend
 */
export const IssueBook: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // If redirected from Books page with a preselected book ID
  const preselectedBookId = (location.state as { selectedBookId?: string })?.selectedBookId || '';

  // Form Fields State
  const [selectedBookId, setSelectedBookId] = useState<string>(preselectedBookId);
  const [selectedMemberId, setSelectedMemberId] = useState<string>(MOCK_MEMBERS[0]?._id || '');

  // Calculate default due date: 14 days from today in YYYY-MM-DD format
  const defaultDueDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];
  const [dueDate, setDueDate] = useState<string>(defaultDueDate);

  // Books list loaded from real backend
  const [availableBooks, setAvailableBooks] = useState<Book[]>([]);
  const [loadingBooks, setLoadingBooks] = useState<boolean>(true);

  // Submission feedback states
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [successRecord, setSuccessRecord] = useState<BorrowRecord | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  /**
   * Load real book catalog from backend API for selection
   */
  useEffect(() => {
    const fetchBooks = async () => {
      try {
        setLoadingBooks(true);
        const res = await apiClient.getBooks({ limit: 50 });
        setAvailableBooks(res.data);

        // If no book was pre-selected, select the first book that has available copies
        if (!selectedBookId) {
          const firstInStock = res.data.find((b) => b.availableCopies > 0);
          if (firstInStock) {
            setSelectedBookId(firstInStock._id);
          }
        }
      } catch {
        setErrorMessage('Failed to load books catalog from backend.');
      } finally {
        setLoadingBooks(false);
      }
    };

    fetchBooks();
  }, [selectedBookId]);

  /**
   * Handle Borrow Form Submission
   */
  const handleIssueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessRecord(null);

    // Client-side validation
    if (!selectedBookId) {
      setErrorMessage('Please select a book to issue.');
      return;
    }
    if (!selectedMemberId) {
      setErrorMessage('Please select a member.');
      return;
    }
    if (!dueDate) {
      setErrorMessage('Please select a valid due date.');
      return;
    }

    // Verify selected book is not out of stock
    const chosenBook = availableBooks.find((b) => b._id === selectedBookId);
    if (chosenBook && chosenBook.availableCopies <= 0) {
      setErrorMessage(`Cannot issue "${chosenBook.title}". All copies are currently checked out.`);
      return;
    }

    try {
      setSubmitting(true);

      // Call the real POST /api/borrow endpoint
      const response = await apiClient.issueBook({
        book: selectedBookId,
        member: selectedMemberId,
        dueDate: new Date(dueDate).toISOString(),
      });

      setSuccessRecord(response.data);

      // Decrement locally available copies to reflect real-time update in UI
      setAvailableBooks((prev) =>
        prev.map((b) =>
          b._id === selectedBookId
            ? { ...b, availableCopies: Math.max(0, b.availableCopies - 1) }
            : b
        )
      );
    } catch (err: unknown) {
      if (err instanceof ShelfLifeApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('An unexpected error occurred while issuing the book.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const selectedBook = availableBooks.find((b) => b._id === selectedBookId);
  const selectedMember = MOCK_MEMBERS.find((m) => m._id === selectedMemberId);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Issue Book to Member</h1>
          <p className="page-subtitle">Assign library copies to registered students, faculty, or staff</p>
        </div>
      </div>

      <div className="issue-layout-grid">
        {/* Issue Form */}
        <div className="card form-card">
          {/* Success Feedback Banner */}
          {successRecord && (
            <div className="alert alert-success" role="alert">
              <div className="alert-heading">
                <span>✅ Book Issued Successfully!</span>
              </div>
              <p className="text-sm">
                Borrow Record ID: <code>{successRecord._id}</code>
              </p>
              <p className="text-sm">
                Book: <strong>{successRecord.book?.title}</strong> | Due Date:{' '}
                <strong>{new Date(successRecord.dueDate).toLocaleDateString()}</strong>
              </p>
              <div className="alert-actions">
                <button
                  type="button"
                  onClick={() => navigate(`/members/${selectedMemberId}/history`)}
                  className="btn btn-outline-success btn-xs"
                >
                  View Member Loan History →
                </button>
              </div>
            </div>
          )}

          {/* Error Feedback Banner */}
          {errorMessage && (
            <div className="alert alert-danger" role="alert">
              <span>⚠️ {errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleIssueSubmit} className="issue-form">
            {/* 1. Book Selection */}
            <div className="form-group">
              <label htmlFor="book-select">Select Book (From Catalog)</label>
              {loadingBooks ? (
                <div className="text-muted text-sm">Loading books catalog...</div>
              ) : (
                <select
                  id="book-select"
                  className="form-control"
                  value={selectedBookId}
                  onChange={(e) => setSelectedBookId(e.target.value)}
                  disabled={submitting}
                  required
                >
                  <option value="">-- Choose a book from catalog --</option>
                  {availableBooks.map((b) => (
                    <option
                      key={b._id}
                      value={b._id}
                      disabled={b.availableCopies === 0}
                    >
                      {b.title} by {b.author} ({b.availableCopies > 0 ? `${b.availableCopies} available` : 'OUT OF STOCK'})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* 2. Member Selection */}
            <div className="form-group">
              <label htmlFor="member-select">Select Member</label>
              <select
                id="member-select"
                className="form-control"
                value={selectedMemberId}
                onChange={(e) => setSelectedMemberId(e.target.value)}
                disabled={submitting}
                required
              >
                {MOCK_MEMBERS.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.name} ({m.membership} - {m.email})
                  </option>
                ))}
              </select>
              <small className="form-text text-muted">
                ℹ️ Member list is populated via typed sample data (src/mocks/members.ts) because
                the assessment backend purposefully does not define a member-list endpoint.
              </small>
            </div>

            {/* 3. Due Date */}
            <div className="form-group">
              <label htmlFor="due-date">Due Date</label>
              <input
                id="due-date"
                type="date"
                className="form-control"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                disabled={submitting}
                required
              />
              <small className="form-text text-muted">
                Standard loan period is 14 days from today.
              </small>
            </div>

            {/* Submit Button (Disabled during submission) */}
            <button
              type="submit"
              className="btn btn-primary btn-block btn-lg"
              disabled={submitting || (selectedBook?.availableCopies ?? 0) <= 0}
            >
              {submitting ? 'Issuing Book to Member...' : 'Confirm & Issue Book'}
            </button>
          </form>
        </div>

        {/* Transaction Summary Panel */}
        <div className="card summary-card">
          <h3>Loan Summary Preview</h3>
          <hr />

          <div className="summary-item">
            <span className="summary-label">Selected Book:</span>
            <span className="summary-val">{selectedBook?.title || 'None selected'}</span>
          </div>

          <div className="summary-item">
            <span className="summary-label">Author:</span>
            <span className="summary-val">{selectedBook?.author || '-'}</span>
          </div>

          <div className="summary-item">
            <span className="summary-label">Available Inventory:</span>
            <span className="summary-val">
              {selectedBook ? (
                <span className={selectedBook.availableCopies > 0 ? 'text-success' : 'text-danger'}>
                  {selectedBook.availableCopies} of {selectedBook.totalCopies} copies
                </span>
              ) : (
                '-'
              )}
            </span>
          </div>

          <hr />

          <div className="summary-item">
            <span className="summary-label">Borrower:</span>
            <span className="summary-val">{selectedMember?.name || 'None selected'}</span>
          </div>

          <div className="summary-item">
            <span className="summary-label">Membership:</span>
            <span className="summary-val">{selectedMember?.membership || '-'}</span>
          </div>

          <div className="summary-item">
            <span className="summary-label">Due Date:</span>
            <span className="summary-val">
              {dueDate ? new Date(dueDate).toLocaleDateString() : '-'}
            </span>
          </div>

          <div className="info-box-note">
            <p className="text-xs text-muted">
              🔒 <strong>Protected Action:</strong> Issuing decrements inventory atomically on the
              backend database level. Authenticated librarian credentials are automatically sent via
              Bearer JWT.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
