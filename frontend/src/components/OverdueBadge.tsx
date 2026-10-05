import React from 'react';
import type { BorrowStatus } from '../types';

interface OverdueBadgeProps {
  dueDate: string;
  returnDate: string | null;
  status: BorrowStatus;
}

/**
 * Overdue Badge Component
 *
 * Implements strict assessment requirement for visually distinct overdue items:
 * An item is overdue ONLY when:
 * 1. `dueDate < today` (due date has elapsed)
 * AND
 * 2. It has NOT been returned (`returnDate` is null AND `status !== 'returned'`).
 *
 * CRITICAL RULE: A returned book must NOT be displayed as overdue merely because
 * today's date is past its original due date.
 */
export const OverdueBadge: React.FC<OverdueBadgeProps> = ({ dueDate, returnDate, status }) => {
  const isReturned = status === 'returned' || Boolean(returnDate);
  const isDuePast = new Date(dueDate).getTime() < new Date().getTime();

  // Item is overdue only if unreturned and past due
  const isOverdue = !isReturned && (isDuePast || status === 'overdue');

  if (isReturned) {
    return <span className="badge badge-success">Returned</span>;
  }

  if (isOverdue) {
    return <span className="badge badge-danger">OVERDUE</span>;
  }

  return <span className="badge badge-info">Issued</span>;
};
