# ShelfLife — College/University Library Management System Backend

> **IA2 Full Stack Web Development Assessment (Backend Implementation)**  
> Built strictly using Node.js, Express.js, MongoDB, Mongoose, JWT, and Joi.

---

## 1. Project Title & Description

**ShelfLife** is a clean, robust, and concurrency-safe backend REST API designed for college and university libraries. It enables librarians to manage the book catalog, register library members, issue and return books, track borrowing history, and maintain real-time inventory integrity under concurrent requests.

---

## 2. Tech Stack

Strictly aligned with the assessment specification:

- **Runtime**: Node.js (v18+ / v20+)
- **Module System**: ES Modules (`import`/`export`)
- **Web Framework**: Express.js (v4)
- **Database**: MongoDB
- **ODM**: Mongoose (v8)
- **Authentication**: JSON Web Token (`jsonwebtoken`)
- **Input Validation**: Joi
- **Cross-Origin Support**: CORS (prepared for React + TypeScript frontend)
- **Environment Management**: `dotenv`

*No unapproved dependencies (No PostgreSQL, MySQL, Prisma, Sequelize, Redis, GraphQL, Docker, Kubernetes, etc.) have been introduced.*

---

## 3. Folder Structure

```
backend/
│
├── controllers/
│   ├── authController.js       # Librarian authentication and JWT issuance
│   ├── bookController.js       # Book creation and paginated/filtered listing
│   ├── borrowController.js     # Issue book (concurrency-safe) & return book
│   └── memberController.js     # Member registration and borrow history
│
├── routes/
│   ├── authRoutes.js           # /api/auth routes
│   ├── bookRoutes.js           # /api/books routes
│   ├── borrowRoutes.js         # /api/borrow route (Protected)
│   ├── memberRoutes.js         # /api/members routes
│   └── returnRoutes.js         # /api/return/:borrowId route (Protected)
│
├── models/
│   ├── Book.js                 # Book model with ISBN uniqueness and copy constraints
│   ├── Member.js               # Member model with email uniqueness
│   └── BorrowRecord.js         # BorrowRecord referencing Book and Member
│
├── middleware/
│   ├── authMiddleware.js       # JWT extraction and validation middleware
│   ├── errorMiddleware.js      # Centralized error handler and 404 handler
│   ├── loggerMiddleware.js     # Custom HTTP request logger (zero external libs)
│   └── validateMiddleware.js  # Joi schema validation middleware
│
├── utils/
│   ├── asyncHandler.js         # Async error forwarding wrapper
│   ├── db.js                   # Mongoose database connection setup
│   └── validationSchemas.js    # Joi request validation schemas
│
├── test/
│   └── api.test.js             # Automated 48-assertion end-to-end test suite
│
├── .env.example                # Template for environment variables
├── .env                        # Local environment configuration
├── app.js                      # Express app setup and middleware configuration
├── package.json                # Dependencies and npm scripts
├── server.js                   # Server entry point with DB connection & lifecycle
└── README.md                   # Comprehensive documentation and API guide
```

---

## 4. Setup Instructions

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18.x or 20.x+)
- [MongoDB](https://www.mongodb.com/try/download/community) installed and running locally on port 27017 (or a remote MongoDB connection string)

### Installation Steps

1. **Clone or navigate to the project directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

---

## 5. Environment Variables

The application relies on the following environment variables defined in `.env`:

| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `PORT` | Port for the Express server to listen on | `5000` |
| `NODE_ENV` | Runtime environment mode | `development` |
| `MONGODB_URI` | MongoDB connection URI string | `mongodb://127.0.0.1:27017/shelflife` |
| `JWT_SECRET` | Secret key used for signing & verifying JWTs | `your_jwt_secret_key_here` |
| `JWT_EXPIRES_IN`| Token lifespan | `24h` |
| `LIBRARIAN_USERNAME` | Username for librarian authentication | `librarian` |
| `LIBRARIAN_PASSWORD` | Password for librarian authentication | `librarian123` |

---

## 6. How to Start the Server

### Development Mode (with automatic restart)
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

### Run Automated Tests
```bash
npm test
```

The server will start listening at: `http://localhost:5000`  
Health check endpoint: `http://localhost:5000/api/health`

---

## 7. Authentication Instructions

ShelfLife implements lightweight, standards-compliant JWT librarian authentication suitable for the assessment without overcomplicating user management:

1. **Login Request**: Send a `POST` request to `/api/auth/login` with librarian credentials:
   - Default Username: `librarian`
   - Default Password: `librarian123`
2. **Receive Token**: The API responds with a signed JWT valid for 24 hours.
3. **Access Protected Endpoints**: Attach the received token in the HTTP `Authorization` header for protected routes:
   ```
   Authorization: Bearer <your_jwt_token_here>
   ```
4. **Protected Endpoints**:
   - `POST /api/borrow` (Issuing a book)
   - `POST /api/return/:borrowId` (Returning a book)

---

## 8. Race-Condition Prevention (Detailed Explanation)

### The Challenge
In a college library, when only **1 copy** of a popular book remains (`availableCopies = 1`), two librarians might attempt to issue that last copy to two different students at the exact same millisecond. In standard non-atomic code:
1. Request A reads `availableCopies = 1`.
2. Request B reads `availableCopies = 1`.
3. Request A decrements `availableCopies` to `0`.
4. Request B decrements `availableCopies` to `-1` (corrupted negative inventory).

### The Solution: Database-Level Atomic Conditional Decrement
ShelfLife prevents this race condition without introducing Redis, queues, or distributed locks by leveraging MongoDB's single-document atomic operations:

```javascript
const updatedBook = await Book.findOneAndUpdate(
  { _id: bookId, availableCopies: { $gt: 0 } },
  { $inc: { availableCopies: -1 } },
  { new: true }
);

if (!updatedBook) {
  return res.status(400).json({
    success: false,
    message: 'No copies available for borrowing. All copies are currently issued.',
  });
}
```

### 4–6 Line Summary
1. The update executes an atomic query filter `availableCopies: { $gt: 0 }` alongside `$inc: { availableCopies: -1 }`.
2. MongoDB's storage engine executes single-document write modifications atomically with document-level write locks.
3. When two concurrent requests arrive simultaneously, the database serializes the write operations.
4. The first request successfully decrements `availableCopies` from `1` to `0` and receives the updated book document.
5. The second request fails the `{ $gt: 0 }` filter because the count is now `0`, returning `null` and rejecting the request safely with HTTP `400`.
6. This strictly guarantees `availableCopies` can never drop below zero, even under heavy concurrency.

---

## 9. API Endpoints Reference

### Summary of Routes

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Librarian login & token generation | No |
| `POST` | `/api/books` | Add a new book to the catalog | No |
| `GET` | `/api/books` | Get paginated books with genre filtering | No |
| `POST` | `/api/members` | Register a new library member | No |
| `POST` | `/api/borrow` | Issue a book to a member | **Yes (Bearer JWT)** |
| `POST` | `/api/return/:borrowId`| Return a borrowed book | **Yes (Bearer JWT)** |
| `GET` | `/api/members/:id/history`| View complete borrowing history for a member | No |

---

### Detailed Endpoint Specifications

#### 1. Librarian Login
- **URL**: `POST /api/auth/login`
- **Purpose**: Authenticates librarian and returns a signed JWT.
- **Request Body**:
  ```json
  {
    "username": "librarian",
    "password": "librarian123"
  }
  ```
- **cURL Example**:
  ```bash
  curl -X POST http://localhost:5000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"librarian","password":"librarian123"}'
  ```
- **Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Login successful",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "librarian": {
      "librarianId": "librarian-admin-01",
      "username": "librarian",
      "role": "librarian"
    }
  }
  ```

---

#### 2. Create Book
- **URL**: `POST /api/books`
- **Purpose**: Adds a new book to the catalog. Validates that `availableCopies <= totalCopies` and `ISBN` is unique.
- **Request Body**:
  ```json
  {
    "title": "Clean Code",
    "author": "Robert C. Martin",
    "ISBN": "9780132350884",
    "genre": "Software Engineering",
    "totalCopies": 5,
    "availableCopies": 5
  }
  ```
- **cURL Example**:
  ```bash
  curl -X POST http://localhost:5000/api/books \
    -H "Content-Type: application/json" \
    -d '{
      "title": "Clean Code",
      "author": "Robert C. Martin",
      "ISBN": "9780132350884",
      "genre": "Software Engineering",
      "totalCopies": 5,
      "availableCopies": 5
    }'
  ```
- **Response (`201 Created`)**:
  ```json
  {
    "success": true,
    "message": "Book created successfully",
    "data": {
      "_id": "670119e83df4c1d763a8d101",
      "title": "Clean Code",
      "author": "Robert C. Martin",
      "ISBN": "9780132350884",
      "genre": "Software Engineering",
      "totalCopies": 5,
      "availableCopies": 5,
      "createdAt": "2026-10-05T05:20:00.000Z",
      "updatedAt": "2026-10-05T05:20:00.000Z"
    }
  }
  ```

---

#### 3. Get Books (Paginated & Filtered)
- **URL**: `GET /api/books?page=1&limit=10&genre=Software%20Engineering`
- **Purpose**: Retrieves a paginated list of books with optional case-insensitive genre filtering.
- **Query Parameters**:
  - `page` (optional, default `1`): Current page number
  - `limit` (optional, default `10`, max `100`): Items per page
  - `genre` (optional): Filter by exact genre name (case-insensitive)
- **cURL Example**:
  ```bash
  curl -X GET "http://localhost:5000/api/books?page=1&limit=10&genre=Software%20Engineering"
  ```
- **Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "currentPage": 1,
    "totalPages": 1,
    "totalBooks": 1,
    "limit": 10,
    "data": [
      {
        "_id": "670119e83df4c1d763a8d101",
        "title": "Clean Code",
        "author": "Robert C. Martin",
        "ISBN": "9780132350884",
        "genre": "Software Engineering",
        "totalCopies": 5,
        "availableCopies": 5
      }
    ]
  }
  ```

---

#### 4. Register Member
- **URL**: `POST /api/members`
- **Purpose**: Enrolls a new library member with a unique email address.
- **Request Body**:
  ```json
  {
    "name": "Jane Doe",
    "email": "jane.doe@university.edu",
    "membership": "Undergraduate",
    "joinedDate": "2026-09-01T00:00:00.000Z"
  }
  ```
- **cURL Example**:
  ```bash
  curl -X POST http://localhost:5000/api/members \
    -H "Content-Type: application/json" \
    -d '{
      "name": "Jane Doe",
      "email": "jane.doe@university.edu",
      "membership": "Undergraduate",
      "joinedDate": "2026-09-01T00:00:00.000Z"
    }'
  ```
- **Response (`201 Created`)**:
  ```json
  {
    "success": true,
    "message": "Member registered successfully",
    "data": {
      "_id": "670119e83df4c1d763a8d102",
      "name": "Jane Doe",
      "email": "jane.doe@university.edu",
      "membership": "Undergraduate",
      "joinedDate": "2026-09-01T00:00:00.000Z",
      "createdAt": "2026-10-05T05:21:00.000Z"
    }
  }
  ```

---

#### 5. Issue / Borrow Book
- **URL**: `POST /api/borrow`
- **Purpose**: Issues a book copy to a member, decrements `availableCopies` atomically, and records loan details.
- **Authentication**: **Required** (`Bearer <token>`)
- **Request Body**:
  ```json
  {
    "book": "670119e83df4c1d763a8d101",
    "member": "670119e83df4c1d763a8d102",
    "dueDate": "2026-10-25T00:00:00.000Z"
  }
  ```
- **cURL Example**:
  ```bash
  curl -X POST http://localhost:5000/api/borrow \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer YOUR_JWT_TOKEN" \
    -d '{
      "book": "670119e83df4c1d763a8d101",
      "member": "670119e83df4c1d763a8d102",
      "dueDate": "2026-10-25T00:00:00.000Z"
    }'
  ```
- **Response (`201 Created`)**:
  ```json
  {
    "success": true,
    "message": "Book issued successfully",
    "data": {
      "_id": "670119e83df4c1d763a8d103",
      "book": {
        "_id": "670119e83df4c1d763a8d101",
        "title": "Clean Code",
        "author": "Robert C. Martin",
        "ISBN": "9780132350884",
        "genre": "Software Engineering",
        "totalCopies": 5,
        "availableCopies": 4
      },
      "member": {
        "_id": "670119e83df4c1d763a8d102",
        "name": "Jane Doe",
        "email": "jane.doe@university.edu",
        "membership": "Undergraduate"
      },
      "issueDate": "2026-10-05T05:22:00.000Z",
      "dueDate": "2026-10-25T00:00:00.000Z",
      "returnDate": null,
      "status": "issued"
    }
  }
  ```

---

#### 6. Return Book
- **URL**: `POST /api/return/:borrowId`
- **Purpose**: Marks a loan record as `returned`, records the `returnDate`, and increments the book's `availableCopies`.
- **Authentication**: **Required** (`Bearer <token>`)
- **cURL Example**:
  ```bash
  curl -X POST http://localhost:5000/api/return/670119e83df4c1d763a8d103 \
    -H "Authorization: Bearer YOUR_JWT_TOKEN"
  ```
- **Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Book returned successfully",
    "data": {
      "_id": "670119e83df4c1d763a8d103",
      "book": {
        "_id": "670119e83df4c1d763a8d101",
        "title": "Clean Code",
        "author": "Robert C. Martin",
        "ISBN": "9780132350884",
        "genre": "Software Engineering",
        "totalCopies": 5,
        "availableCopies": 5
      },
      "member": {
        "_id": "670119e83df4c1d763a8d102",
        "name": "Jane Doe",
        "email": "jane.doe@university.edu",
        "membership": "Undergraduate"
      },
      "issueDate": "2026-10-05T05:22:00.000Z",
      "dueDate": "2026-10-25T00:00:00.000Z",
      "returnDate": "2026-10-05T05:25:00.000Z",
      "status": "returned"
    }
  }
  ```

---

#### 7. Member Borrow History
- **URL**: `GET /api/members/:id/history`
- **Purpose**: Returns the full borrowing history for a specific member with populated book details.
- **cURL Example**:
  ```bash
  curl -X GET http://localhost:5000/api/members/670119e83df4c1d763a8d102/history
  ```
- **Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "member": {
      "_id": "670119e83df4c1d763a8d102",
      "name": "Jane Doe",
      "email": "jane.doe@university.edu",
      "membership": "Undergraduate",
      "joinedDate": "2026-09-01T00:00:00.000Z"
    },
    "totalRecords": 1,
    "data": [
      {
        "_id": "670119e83df4c1d763a8d103",
        "book": {
          "_id": "670119e83df4c1d763a8d101",
          "title": "Clean Code",
          "author": "Robert C. Martin",
          "ISBN": "9780132350884",
          "genre": "Software Engineering",
          "totalCopies": 5,
          "availableCopies": 5
        },
        "member": "670119e83df4c1d763a8d102",
        "issueDate": "2026-10-05T05:22:00.000Z",
        "dueDate": "2026-10-25T00:00:00.000Z",
        "returnDate": "2026-10-05T05:25:00.000Z",
        "status": "returned"
      }
    ]
  }
  ```

---

## 10. Centralized Error Responses

All error responses strictly follow a uniform JSON schema:

```json
{
  "success": false,
  "message": "Descriptive error message",
  "errors": ["Optional list of detailed field validation errors"]
}
```

### Standard Status Codes Handled:
- **`200 OK`**: Request succeeded.
- **`201 Created`**: Resource created successfully.
- **`400 Bad Request`**: Validation failed, malformed ObjectId, or invalid operation (e.g. no copies available).
- **`401 Unauthorized`**: Missing, expired, or invalid JWT token.
- **`404 Not Found`**: Target book, member, borrow record, or route not found.
- **`409 Conflict`**: Duplicate ISBN or member email address.
- **`500 Internal Server Error`**: Unexpected database or server error.
