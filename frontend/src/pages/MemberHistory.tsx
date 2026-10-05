import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient, ShelfLifeApiError } from '../api/api';
import type { BorrowRecord, Member } from '../types';
import { OverdueBadge } from '../components/OverdueBadge';
import { MOCK_MEMBERS } from '../mocks/members';

/**
 * Member History Page Component
 *
 * Implements Question Q2(d) requirements:
 * 1. Uses real GET /api/members/:id/history endpoint
 * 2. Displays member borrow records:
 *    - Populated book information (title, author, ISBN)
 *    - Issue date
 *    - Due date
 *    - Return date
 *    - Loan status
 * 3. Mandatorily calculates and displays visually distinct Overdue badges:
 *    - IF dueDate < today AND returnDate is null / not returned => OVERDUE badge
 *    - A returned book is NEVER marked as overdue, even if returned after due date.
 * 4. Enables returning active books directly via POST /api/return/:borrowId.
 */
export const MemberHistory: React.FC = () => {
  const { id: paramMemberId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Selected member ID (defaults to first mock member if invalid or empty)
  const currentMemberId = paramMemberId || MOCK_MEMBERS[0]._id;

  const [member, setMember] = useState<Member | null>(null);
  const [history, setHistory] = useState<BorrowRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Returning state for individual record actions
  const [returningId, setReturningId] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  /**
   * Fetch loan history from backend API
   */
  const loadHistory = useCallback(async (memberId: string) => {
    try {
      setLoading(true);
      setError(null);
      setActionSuccess(null);

      const response = await apiClient.getMemberHistory(memberId);
      setMember(response.member);
      setHistory(response.data);
    } catch (err: unknown) {
      if (err instanceof ShelfLifeApiError) {
        setError(err.message);
      } else {
        setError('Failed to fetch borrowing history. Ensure member ID is valid.');
      }
      setHistory([]);
      setMember(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (currentMemberId) {
      loadHistory(currentMemberId);
    }
  }, [currentMemberId, loadHistory]);

  /**
   * Return Book Action
   * Calls POST /api/return/:borrowId
   */
  const handleReturnBook = async (borrowId: string, bookTitle: string) => {
    try {
      setReturningId(borrowId);
      setError(null);
      setActionSuccess(null);

      const res = await apiClient.returnBook(borrowId);

      setActionSuccess(`"${bookTitle}" was successfully returned to inventory!`);

      // Update the record in local state
      setHistory((prev) =>
        prev.map((rec) => (rec._id === borrowId ? res.data : rec))
      );
    } catch (err: unknown) {
      if (err instanceof ShelfLifeApiError) {
        setError(err.message);
      } else {
        setError('Failed to process book return.');
      }
    } finally {
      setReturningId(null);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Member Borrowing History</h1>
          <p className="page-subtitle">Detailed circulation history, loan dates, and return management</p>
        </div>

        {/* Member Switcher Dropdown */}
        <div className="member-picker-wrap">
          <label htmlFor="member-picker" className="filter-label">Switch Member:</label>
          <select
            id="member-picker"
            className="form-control"
            value={currentMemberId}
            onChange={(e) => navigate(`/members/${e.target.value}/history`)}
          >
            {MOCK_MEMBERS.map((m) => (
              <option key={m._id} value={m._id}>
                {m.name} ({m.membership})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Action feedback */}
      {actionSuccess && (
        <div className="alert alert-success" role="alert">
          <span>✅ {actionSuccess}</span>
        </div>
      )}

      {error && !loading && (
        <div className="alert alert-danger" role="alert">
          <span>⚠️ {error}</span>
        </div>
      )}

      {/* Member Details Card */}
      {member && (
        <div className="card member-profile-card">
          <div className="profile-badge">👤</div>
          <div className="profile-details">
            <h2 className="profile-name">{member.name}</h2>
            <div className="profile-meta">
              <span>📧 {member.email}</span>
              <span>🎓 Tier: <strong>{member.membership}</strong></span>
              <span>📅 Enrolled: {new Date(member.joinedDate).toLocaleDateString()}</span>
            </div>
          </div>
          <div className="profile-stats">
            <div className="stat-box">
              <span className="stat-number">{history.length}</span>
              <span className="stat-label">Total Loans</span>
            </div>
            <div className="stat-box">
              <span className="stat-number">
                {history.filter((h) => h.status === 'issued' && !h.returnDate).length}
              </span>
              <span className="stat-label">Active Loans</span>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="state-panel loading-panel">
          <div className="spinner"></div>
          <p>Retrieving borrow records from library database...</p>
        </div>
      )}

      {/* History Table */}
      {!loading && (
        <div className="card">
          <h3>Loan Records</h3>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Book Information</th>
                  <th>Issue Date</th>
                  <th>Due Date</th>
                  <th>Return Date</th>
                  <th>Status & Badges</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {history.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="table-empty-cell">
                      No borrowing history recorded for this member yet.
                    </td>
                  </tr>
                ) : (
                  history.map((record) => {
                    const isIssued = record.status === 'issued' && !record.returnDate;

                    return (
                      <tr key={record._id}>
                        <td>
                          <strong>{record.book?.title || 'Unknown Title'}</strong>
                          <div className="text-muted text-xs">
                            Author: {record.book?.author || 'N/A'} | ISBN: {record.book?.ISBN || 'N/A'}
                          </div>
                        </td>
                        <td>{new Date(record.issueDate).toLocaleDateString()}</td>
                        <td>{new Date(record.dueDate).toLocaleDateString()}</td>
                        <td>
                          {record.returnDate
                            ? new Date(record.returnDate).toLocaleDateString()
                            : <span className="text-muted">Not returned</span>}
                        </td>
                        <td>
                          {/* Visually distinct OverdueBadge implementing strict conditions */}
                          <OverdueBadge
                            dueDate={record.dueDate}
                            returnDate={record.returnDate}
                            status={record.status}
                          />
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          {isIssued ? (
                            <button
                              type="button"
                              onClick={() => handleReturnBook(record._id, record.book?.title || 'Book')}
                              disabled={returningId === record._id}
                              className="btn btn-outline-primary btn-sm"
                            >
                              {returningId === record._id ? 'Returning...' : 'Return Book'}
                            </button>
                          ) : (
                            <span className="text-muted text-xs">Completed</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
