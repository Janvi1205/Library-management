import type { Member } from '../types';

/**
 * Mock Members Data
 *
 * NOTE ON ASSESSMENT ARCHITECTURE:
 * The IA2 assessment backend explicitly defines only:
 *   - POST /api/members (register single member)
 *   - GET /api/members/:id/history (get specific member history)
 *
 * It does NOT specify or provide a generic `GET /api/members` endpoint to list all members.
 * Per the assessment instructions ("If the existing backend does NOT provide a member-list
 * endpoint, do NOT unnecessarily modify the backend. Instead create a clearly isolated typed
 * sample/mock member list for the frontend"), this file provides typed mock member records
 * for the UI selection dropdowns in the "Issue Book" and "Member History" views.
 *
 * Each member uses a valid 24-hexadecimal character MongoDB ObjectId.
 * The actual borrow operation (POST /api/borrow) and history query (GET /api/members/:id/history)
 * remain 100% real calls to the backend server.
 */
export const MOCK_MEMBERS: Member[] = [
  {
    _id: '670119e83df4c1d763a8d102',
    name: 'Alice Johnson',
    email: 'alice.johnson@university.edu',
    membership: 'Undergraduate Student',
    joinedDate: '2026-09-01T00:00:00.000Z',
  },
  {
    _id: '670119e83df4c1d763a8d104',
    name: 'Bob Smith',
    email: 'bob.smith@university.edu',
    membership: 'Faculty / Professor',
    joinedDate: '2026-08-15T00:00:00.000Z',
  },
  {
    _id: '670119e83df4c1d763a8d105',
    name: 'Clara Oswald',
    email: 'clara.oswald@university.edu',
    membership: 'Postgraduate Researcher',
    joinedDate: '2026-07-20T00:00:00.000Z',
  },
  {
    _id: '670119e83df4c1d763a8d106',
    name: 'David Tennant',
    email: 'david.tennant@university.edu',
    membership: 'Staff Member',
    joinedDate: '2026-09-10T00:00:00.000Z',
  },
];

const STORAGE_KEY = 'shelflife_registered_members';

/**
 * Retrieves members including dynamically registered members from the session
 */
export const getActiveMembers = (): Member[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return MOCK_MEMBERS;
    const customMembers: Member[] = JSON.parse(stored);
    const existingIds = new Set(customMembers.map((m) => m._id));
    return [...customMembers, ...MOCK_MEMBERS.filter((m) => !existingIds.has(m._id))];
  } catch {
    return MOCK_MEMBERS;
  }
};

/**
 * Stores newly registered member locally so they are accessible across Member Directory and Issue Book
 */
export const saveRegisteredMember = (newMember: Member): void => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const customMembers: Member[] = stored ? JSON.parse(stored) : [];
    const updated = [newMember, ...customMembers.filter((m) => m._id !== newMember._id)];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Ignore local storage quota errors
  }
};
