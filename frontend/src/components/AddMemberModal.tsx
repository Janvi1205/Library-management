import React, { useState } from 'react';
import { apiClient, ShelfLifeApiError } from '../api/api';
import type { Member } from '../types';
import { saveRegisteredMember } from '../mocks/members';

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMemberCreated: (member: Member) => void;
}

const MEMBERSHIP_OPTIONS = [
  'Undergraduate Student',
  'Postgraduate Researcher',
  'Faculty / Professor',
  'Staff Member',
];

/**
 * Add New Member Modal
 *
 * Implements "Add New Member" feature:
 * - Submits { name, email, membership, joinedDate } to POST /api/members
 * - Uses exact membership values expected by backend
 * - Automatically generates joinedDate
 * - Disables submit button during request
 * - Displays clear validation and backend errors (e.g. duplicate email)
 * - Updates local registered member list and invokes onMemberCreated
 */
export const AddMemberModal: React.FC<AddMemberModalProps> = ({
  isOpen,
  onClose,
  onMemberCreated,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [membership, setMembership] = useState(MEMBERSHIP_OPTIONS[0]);

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    // Client-side validation
    if (!trimmedName) {
      setErrorMessage('Please enter the member\'s full name.');
      return;
    }
    if (!trimmedEmail || !/^\S+@\S+\.\S+$/.test(trimmedEmail)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (!membership) {
      setErrorMessage('Please select a membership tier.');
      return;
    }

    try {
      setSubmitting(true);

      const response = await apiClient.createMember({
        name: trimmedName,
        email: trimmedEmail,
        membership,
        joinedDate: new Date().toISOString(),
      });

      // Save to local session registry so member is immediately available in dropdowns
      saveRegisteredMember(response.data);

      // Reset form
      setName('');
      setEmail('');
      setMembership(MEMBERSHIP_OPTIONS[0]);

      onMemberCreated(response.data);
      onClose();
    } catch (err: unknown) {
      if (err instanceof ShelfLifeApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Failed to register member. Please check backend connection.');
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
            <span className="modal-icon">👤</span>
            <h3>Register New Library Member</h3>
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
            <label htmlFor="member-name">
              Full Name <span className="text-danger">*</span>
            </label>
            <input
              id="member-name"
              type="text"
              className="form-control"
              placeholder="e.g. Sarah Connor"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={submitting}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="member-email">
              Institutional Email <span className="text-danger">*</span>
            </label>
            <input
              id="member-email"
              type="email"
              className="form-control"
              placeholder="e.g. sarah.connor@university.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitting}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="member-tier">
              Membership Tier <span className="text-danger">*</span>
            </label>
            <select
              id="member-tier"
              className="form-control"
              value={membership}
              onChange={(e) => setMembership(e.target.value)}
              disabled={submitting}
              required
            >
              {MEMBERSHIP_OPTIONS.map((tier) => (
                <option key={tier} value={tier}>
                  {tier}
                </option>
              ))}
            </select>
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
              {submitting ? 'Registering...' : 'Register Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
