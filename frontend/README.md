# ShelfLife Frontend (React + TypeScript)

> **IA2 Section B — Frontend Implementation (20 Marks)**  
> Developed using React, TypeScript, React Router, Vite, and plain CSS.

---

## 1. Features Implemented

1. **Strict TypeScript Types**:
   - `Book`, `Member`, `BorrowRecord`, `LoginPayload`, `LoginResponse`, `IssueBookPayload`, and API envelopes in `src/types/index.ts`.
2. **Typed API Client**:
   - Centralized `src/api/api.ts` module with native `fetch`, automatic JWT `Authorization: Bearer <token>` attachment, and structured error handling.
3. **Librarian Login & Route Protection**:
   - Login page (`src/pages/Login.tsx`) calling `POST /api/auth/login`.
   - `<ProtectedRoute>` guarding `/books`, `/issue`, and `/members/:id/history`.
   - Logout button in navigation bar clearing stored session.
4. **Book Catalog Page (`src/pages/Books.tsx`)**:
   - Fetches books via `GET /api/books`.
   - Real-time search/filter by book title.
   - Genre filter dropdown synced with API.
   - Loading indicator & error states with retry button.
   - Pagination controls.
5. **Issue Book Form (`src/pages/IssueBook.tsx`)**:
   - Book selection from real backend catalog (out-of-stock books disabled).
   - Member selection via typed mock members (`src/mocks/members.ts`) with clear educational explanation.
   - Due date picker with standard 14-day default.
   - Submit button disabled while request is in flight.
   - Success and error feedback messages.
6. **Member Loan History (`src/pages/MemberHistory.tsx`)**:
   - Calls real `GET /api/members/:id/history`.
   - Displays populated book details (title, author, ISBN).
   - **Mandatory Visually Distinct Overdue Badge**: Displays `OVERDUE` if and only if `dueDate < today` AND `status !== 'returned'`. Returned books are never marked overdue.
   - Book return action directly from the history table (`POST /api/return/:borrowId`).
7. **Generic Reusable Component (`src/components/DataTable.tsx`)**:
   - True TypeScript generic component `<DataTable<T>>`.
   - Actively used for `<DataTable<Book>>` and `<DataTable<Member>>`.

---

## 2. State Management Justification

- **Chosen Approach**: Local component state via React standard hooks (`useState`, `useEffect`, `useCallback`, `useMemo`).
- **Rationale**:
  - The application comprises four distinct pages with independent data lifecycles.
  - Authentication state is cleanly encapsulated in `src/api/api.ts` and synced with browser `localStorage`.
  - Avoids the boilerplate and complexity of Redux/Zustand while remaining performant, clean, and easily maintainable.

---

## 3. Running Locally

```bash
npm install
npm run dev
```
Server runs by default at `http://localhost:5173`.
