# ShelfLife — College/University Library Management System

> **IA2 Full Stack Web Development Assessment**  
> Complete implementation of:
> - **Section A (Q1)**: Backend API (Node.js, Express.js, MongoDB, Mongoose, JWT, Joi) — 20 Marks
> - **Section B (Q2)**: Frontend SPA (React, TypeScript, React Router) — 20 Marks
> - **Section C (Q3)**: System Design & Scalability Analysis ([`SYSTEM_DESIGN.md`](./SYSTEM_DESIGN.md)) — 10 Marks

---

## 1. Project Overview

**ShelfLife** is a full-stack library management system engineered for college and university libraries. It enables librarians to manage the book catalog, register library members, issue and return book copies, track borrowing history, and maintain inventory integrity under concurrent requests.

---

## 2. Project Structure

```
ShelfLife/
│
├── backend/                  ← Q1 BACKEND (Express, Mongoose, JWT, Joi)
│   ├── controllers/          # Business logic (books, members, borrow, auth)
│   ├── models/               # Mongoose models (Book, Member, BorrowRecord)
│   ├── routes/               # Express REST route handlers
│   ├── middleware/           # JWT auth, Joi validation, request logger, error handler
│   ├── utils/                # DB connection, asyncHandler, validation schemas
│   ├── test/                 # 48-assertion end-to-end automated test suite
│   ├── .env.example          # Backend environment variable template
│   ├── app.js                # Express app setup & middleware
│   ├── server.js             # Server startup & DB connection
│   └── package.json          # Backend dependencies
│
├── frontend/                 ← Q2 FRONTEND (React + TypeScript)
│   ├── src/
│   │   ├── api/              # Typed API client service with JWT handling
│   │   ├── components/       # Reusable components (<DataTable<T>>, OverdueBadge, Navbar, ProtectedRoute)
│   │   ├── pages/            # Views (Login, Books, IssueBook, MemberHistory)
│   │   ├── types/            # TypeScript interfaces (Book, Member, BorrowRecord, API envelopes)
│   │   ├── mocks/            # Typed mock members (src/mocks/members.ts)
│   │   ├── App.tsx           # React Router route definitions
│   │   ├── main.tsx          # Application root mount
│   │   └── index.css         # Modern, responsive plain CSS design system
│   ├── package.json          # Frontend dependencies
│   └── vite.config.ts        # Vite configuration
│
├── SYSTEM_DESIGN.md          ← Q3 SYSTEM DESIGN (1-2 Page Complete Answer)
└── README.md                 ← Comprehensive Project Documentation
```

---

## 3. Technology Stack

- **Backend**: Node.js, Express.js, MongoDB, Mongoose, JWT (`jsonwebtoken`), Joi, `dotenv`, CORS
- **Frontend**: React 19, TypeScript, React Router v7, Vite, Native `fetch`
- **Architecture**: Separated REST API + Single-Page Application (SPA) with JWT Bearer Authentication

---

## 4. Setup & Running Instructions

### Prerequisites
- Node.js (v18.x or v20.x+)
- MongoDB running locally on `mongodb://127.0.0.1:27017`

### 4.1 Running the Backend

```bash
cd backend
npm install
npm test       # Runs the automated 48-assertion test suite
npm run dev    # Starts backend server on http://localhost:5000
```

The backend health check is available at: `http://localhost:5000/api/health`

### 4.2 Running the Frontend

In a separate terminal:

```bash
cd frontend
npm install
npm run build   # Validates TypeScript compilation and builds assets
npm run dev     # Starts Vite development server (typically on http://localhost:5173)
```

Open `http://localhost:5173` in your browser.

---

## 5. Environment Variables

### Backend (`backend/.env`)
```ini
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/shelflife
JWT_SECRET=shelflife_super_secret_jwt_key_2026
JWT_EXPIRES_IN=24h
LIBRARIAN_USERNAME=librarian
LIBRARIAN_PASSWORD=librarian123
```

---

## 6. How Frontend Connects to Backend & Authentication

1. **Authentication Flow**:
   - The user visits `/login` and enters librarian credentials (pre-filled demo credentials: `librarian` / `librarian123`).
   - The frontend calls `POST http://localhost:5000/api/auth/login`.
   - On success, the backend returns a signed JWT valid for 24 hours.
   - The token is stored securely in `localStorage` under `shelflife_jwt_token`.
2. **Protected API Requests**:
   - All protected requests (`POST /api/borrow`, `POST /api/return/:borrowId`) automatically attach the header:
     ```
     Authorization: Bearer <token>
     ```
3. **Route Protection**:
   - Unauthenticated visits to `/books`, `/issue`, or `/members/:id/history` are intercepted by [`<ProtectedRoute>`](./frontend/src/components/ProtectedRoute.tsx) and redirected to `/login`.
4. **Logout**:
   - The top navigation bar provides a Logout button that clears the token and redirects to `/login`.

---

## 7. State Management Explanation (Assessment Note)

### Approach Chosen: Local Component State (`useState` + `useEffect`)

**Why this approach was chosen:**
- The ShelfLife application consists of four focused, decoupled views (Catalog, Issue Form, Member History, and Login).
- Data dependencies are localized to each specific view: the Book List owns search, filter, and pagination states; the Issue Form owns form validation and selection states; Member History owns member-specific loan records.
- Cross-cutting session state (the librarian's JWT token) is persisted via a lightweight service module in `src/api/api.ts` backed by `localStorage`.

**Why it is sufficient:**
- Introducing Redux, MobX, or complex external state containers would introduce unnecessary boilerplate, overhead, and architectural complexity without providing tangible benefits for this scale of application.
- Standard React hooks (`useState`, `useEffect`, `useCallback`, `useMemo`) provide clear data flow, zero external dependencies, rapid rendering, and straightforward maintainability for an assessment submission.

---

## 8. API Overview

| Method | Endpoint | Purpose | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Authenticate librarian & issue JWT | Public |
| `POST` | `/api/books` | Add new book to catalog | Public |
| `GET` | `/api/books` | Paginated books with genre filter (`?page=1&limit=10&genre=fiction`) | Public |
| `POST` | `/api/members` | Register new library member | Public |
| `POST` | `/api/borrow` | Issue book copy to member (concurrency-safe) | **Protected (JWT)** |
| `POST` | `/api/return/:borrowId` | Return a borrowed book copy | **Protected (JWT)** |
| `GET` | `/api/members/:id/history` | View member borrowing history with populated book data | Public |

---

## 9. Generic Reusable Component `<DataTable<T>>`

To satisfy **Question Q2(e)**, a generic TypeScript table component is implemented in [`frontend/src/components/DataTable.tsx`](./frontend/src/components/DataTable.tsx):
- Generic type parameter `<T>` enables type-safe column accessors and custom cell render functions.
- Used in [`frontend/src/pages/Books.tsx`](./frontend/src/pages/Books.tsx) for `<DataTable<Book>>` (Catalog view) and `<DataTable<Member>>` (Member Directory view).

---

## 10. System Design (Section C)

The complete, separate written system design answer required by **Section C (10 Marks)**—including the labeled architecture diagram, MongoDB sharding strategy with shard keys, Redis caching plan, atomic concurrency guarantee, and 10× semester auto-scaling lifecycle—is documented in:

👉 **[`SYSTEM_DESIGN.md`](./SYSTEM_DESIGN.md)**
