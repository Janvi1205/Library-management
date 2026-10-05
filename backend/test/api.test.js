import mongoose from 'mongoose';
import app from '../app.js';
import Book from '../models/Book.js';
import Member from '../models/Member.js';
import BorrowRecord from '../models/BorrowRecord.js';

const TEST_PORT = 5099;
const BASE_URL = `http://127.0.0.1:${TEST_PORT}`;

// Test report state
let passed = 0;
let failed = 0;

const assert = (condition, message) => {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
};

async function runTests() {
  console.log('====================================================');
  console.log('STARTING SHELFLIFE BACKEND TEST SUITE');
  console.log('====================================================\n');

  // Connect to DB
  await mongoose.connect('mongodb://127.0.0.1:27017/shelflife_test');
  console.log('[Test Setup] Connected to test database: shelflife_test');

  // Clean test database collections
  await Book.deleteMany({});
  await Member.deleteMany({});
  await BorrowRecord.deleteMany({});
  console.log('[Test Setup] Cleaned collections');

  // Start HTTP server on test port
  const server = app.listen(TEST_PORT);
  console.log(`[Test Setup] Express app listening on ${BASE_URL}\n`);

  try {
    // ----------------------------------------------------
    // TEST 1: Health Check Endpoint
    // ----------------------------------------------------
    console.log('--- TEST 1: Health Check Endpoint ---');
    const healthRes = await fetch(`${BASE_URL}/api/health`);
    const healthData = await healthRes.json();
    assert(healthRes.status === 200, 'Health endpoint returns HTTP 200');
    assert(healthData.status === 'healthy', 'Health status is "healthy"');

    // ----------------------------------------------------
    // TEST 2: Librarian Authentication & JWT Issuance
    // ----------------------------------------------------
    console.log('\n--- TEST 2: Librarian Login & JWT ---');
    // Invalid credentials
    const badLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'librarian', password: 'wrongpassword' }),
    });
    const badLoginData = await badLoginRes.json();
    assert(badLoginRes.status === 401, 'Bad credentials return 401');
    assert(badLoginData.success === false, 'Bad credentials returns success: false');

    // Valid credentials
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'librarian', password: 'librarian123' }),
    });
    const loginData = await loginRes.json();
    assert(loginRes.status === 200, 'Valid login returns 200 OK');
    assert(loginData.success === true, 'Valid login returns success: true');
    assert(typeof loginData.token === 'string', 'JWT token is issued');
    const token = loginData.token;

    // ----------------------------------------------------
    // TEST 3: Create Books (POST /api/books)
    // ----------------------------------------------------
    console.log('\n--- TEST 3: Create Book & Validations ---');
    // Book 1
    const createBookRes1 = await fetch(`${BASE_URL}/api/books`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Introduction to Algorithms',
        author: 'Thomas H. Cormen',
        ISBN: '9780262033848',
        genre: 'Computer Science',
        totalCopies: 5,
        availableCopies: 5,
      }),
    });
    const book1Data = await createBookRes1.json();
    assert(createBookRes1.status === 201, 'Book 1 created with status 201');
    assert(book1Data.data.title === 'Introduction to Algorithms', 'Book title matches');
    assert(book1Data.data.availableCopies === 5, 'Available copies is 5');
    const book1Id = book1Data.data._id;

    // Book 2 (Fiction)
    const createBookRes2 = await fetch(`${BASE_URL}/api/books`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'To Kill a Mockingbird',
        author: 'Harper Lee',
        ISBN: '9780061120084',
        genre: 'Fiction',
        totalCopies: 1,
        availableCopies: 1,
      }),
    });
    const book2Data = await createBookRes2.json();
    assert(createBookRes2.status === 201, 'Book 2 (1 copy) created');
    const book2Id = book2Data.data._id;

    // Duplicate ISBN validation
    const dupBookRes = await fetch(`${BASE_URL}/api/books`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Algorithms Clone',
        author: 'Another Author',
        ISBN: '9780262033848', // Same ISBN
        genre: 'Computer Science',
        totalCopies: 2,
        availableCopies: 2,
      }),
    });
    assert(dupBookRes.status === 409, 'Duplicate ISBN returns 409 Conflict');

    // availableCopies cannot exceed totalCopies validation
    const invalidCopiesRes = await fetch(`${BASE_URL}/api/books`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Invalid Book Copies',
        author: 'Test Author',
        ISBN: '9781234567890',
        genre: 'Testing',
        totalCopies: 2,
        availableCopies: 5, // Invalid: exceeds totalCopies
      }),
    });
    assert(invalidCopiesRes.status === 400, 'availableCopies > totalCopies returns 400 Bad Request');

    // ----------------------------------------------------
    // TEST 4: Get Books with Pagination & Genre Filter
    // ----------------------------------------------------
    console.log('\n--- TEST 4: Get Books (Pagination & Genre Filtering) ---');
    // Fetch all books
    const getBooksRes = await fetch(`${BASE_URL}/api/books?page=1&limit=10`);
    const getBooksData = await getBooksRes.json();
    assert(getBooksRes.status === 200, 'GET /api/books returns 200 OK');
    assert(getBooksData.totalBooks === 2, 'totalBooks is 2');
    assert(getBooksData.currentPage === 1, 'currentPage is 1');
    assert(getBooksData.data.length === 2, 'data length is 2');

    // Filter by genre 'Fiction'
    const filterFictionRes = await fetch(`${BASE_URL}/api/books?genre=fiction`);
    const filterFictionData = await filterFictionRes.json();
    assert(filterFictionRes.status === 200, 'Genre filter returns 200 OK');
    assert(filterFictionData.totalBooks === 1, 'Fiction filter finds 1 book');
    assert(filterFictionData.data[0].title === 'To Kill a Mockingbird', 'Correct book filtered');

    // ----------------------------------------------------
    // TEST 5: Member Registration (POST /api/members)
    // ----------------------------------------------------
    console.log('\n--- TEST 5: Member Registration & Validations ---');
    const memberRes = await fetch(`${BASE_URL}/api/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Alice Johnson',
        email: 'alice.johnson@university.edu',
        membership: 'Undergraduate Student',
        joinedDate: '2026-09-01T00:00:00.000Z',
      }),
    });
    const memberData = await memberRes.json();
    assert(memberRes.status === 201, 'Member registered with 201 Created');
    assert(memberData.data.email === 'alice.johnson@university.edu', 'Member email saved');
    const memberId = memberData.data._id;

    // Member 2
    const member2Res = await fetch(`${BASE_URL}/api/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Bob Smith',
        email: 'bob.smith@university.edu',
        membership: 'Faculty',
      }),
    });
    const member2Data = await member2Res.json();
    const member2Id = member2Data.data._id;

    // Duplicate email
    const dupMemberRes = await fetch(`${BASE_URL}/api/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Alice Clone',
        email: 'alice.johnson@university.edu',
        membership: 'Staff',
      }),
    });
    assert(dupMemberRes.status === 409, 'Duplicate member email returns 409 Conflict');

    // ----------------------------------------------------
    // TEST 6: Protected Routes & Issue Book (POST /api/borrow)
    // ----------------------------------------------------
    console.log('\n--- TEST 6: Issue Book & Concurrency ---');
    // Missing JWT Token
    const unauthBorrow = await fetch(`${BASE_URL}/api/borrow`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        book: book1Id,
        member: memberId,
        dueDate: '2026-11-01T00:00:00.000Z',
      }),
    });
    assert(unauthBorrow.status === 401, 'Borrow without JWT returns 401 Unauthorized');

    // Valid authenticated borrow
    const borrowRes = await fetch(`${BASE_URL}/api/borrow`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        book: book1Id,
        member: memberId,
        dueDate: '2026-11-01T00:00:00.000Z',
      }),
    });
    const borrowData = await borrowRes.json();
    assert(borrowRes.status === 201, 'Borrow with valid JWT returns 201 Created');
    assert(borrowData.data.status === 'issued', 'BorrowRecord status is "issued"');
    assert(borrowData.data.book._id === book1Id, 'BorrowRecord contains populated book');
    assert(borrowData.data.member._id === memberId, 'BorrowRecord contains populated member');
    const borrow1Id = borrowData.data._id;

    // Verify book1 availableCopies decreased from 5 to 4
    const updatedBook1 = await Book.findById(book1Id);
    assert(updatedBook1.availableCopies === 4, 'availableCopies decremented from 5 to 4');

    // ----------------------------------------------------
    // TEST 7: Race Condition / Last Copy Concurrency Safety
    // ----------------------------------------------------
    console.log('\n--- TEST 7: Race Condition Prevention on Last Copy ---');
    // Book 2 has exactly 1 available copy.
    // Simulate 2 librarians simultaneously requesting the last copy!
    const req1 = fetch(`${BASE_URL}/api/borrow`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        book: book2Id,
        member: memberId,
        dueDate: '2026-11-01T00:00:00.000Z',
      }),
    });

    const req2 = fetch(`${BASE_URL}/api/borrow`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        book: book2Id,
        member: member2Id,
        dueDate: '2026-11-01T00:00:00.000Z',
      }),
    });

    const [resA, resB] = await Promise.all([req1, req2]);
    const statuses = [resA.status, resB.status];
    const successes = statuses.filter((s) => s === 201).length;
    const failures = statuses.filter((s) => s === 400).length;

    assert(successes === 1, 'Exactly one concurrent request succeeds (201)');
    assert(failures === 1, 'The other concurrent request fails cleanly (400)');

    const updatedBook2 = await Book.findById(book2Id);
    assert(updatedBook2.availableCopies === 0, 'availableCopies is exactly 0 (never negative)');

    // Additional borrow attempt when copies = 0
    const req3 = await fetch(`${BASE_URL}/api/borrow`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        book: book2Id,
        member: memberId,
        dueDate: '2026-11-01T00:00:00.000Z',
      }),
    });
    const req3Data = await req3.json();
    assert(req3.status === 400, 'Borrowing with 0 copies returns 400');
    assert(req3Data.message.includes('No copies available'), 'Returns clear no copies message');

    // ----------------------------------------------------
    // TEST 8: Return Book (POST /api/return/:borrowId)
    // ----------------------------------------------------
    console.log('\n--- TEST 8: Return Book & Validations ---');
    // Unauthenticated return
    const unauthReturn = await fetch(`${BASE_URL}/api/return/${borrow1Id}`, {
      method: 'POST',
    });
    assert(unauthReturn.status === 401, 'Return without JWT returns 401');

    // Valid authenticated return
    const returnRes = await fetch(`${BASE_URL}/api/return/${borrow1Id}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    const returnData = await returnRes.json();
    assert(returnRes.status === 200, 'Return book returns 200 OK');
    assert(returnData.data.status === 'returned', 'Status updated to "returned"');
    assert(returnData.data.returnDate !== null, 'returnDate is recorded');

    // Verify book inventory incremented back
    const restoredBook1 = await Book.findById(book1Id);
    assert(restoredBook1.availableCopies === 5, 'availableCopies incremented back from 4 to 5');

    // Returning already returned book
    const doubleReturnRes = await fetch(`${BASE_URL}/api/return/${borrow1Id}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    assert(doubleReturnRes.status === 400, 'Duplicate return returns 400 Bad Request');

    // Non-existent borrowId
    const fakeId = new mongoose.Types.ObjectId();
    const notFoundReturn = await fetch(`${BASE_URL}/api/return/${fakeId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    assert(notFoundReturn.status === 404, 'Non-existent borrow ID returns 404 Not Found');

    // ----------------------------------------------------
    // TEST 9: Member Borrow History (GET /api/members/:id/history)
    // ----------------------------------------------------
    console.log('\n--- TEST 9: Member Borrow History ---');
    const historyRes = await fetch(`${BASE_URL}/api/members/${memberId}/history`);
    const historyData = await historyRes.json();
    assert(historyRes.status === 200, 'Member history returns 200 OK');
    assert(historyData.member.name === 'Alice Johnson', 'Returns member info');
    assert(historyData.totalRecords >= 1, 'History contains records');
    assert(historyData.data[0].book.title !== undefined, 'Book details populated in history');

    // Invalid member ID format
    const badIdHistory = await fetch(`${BASE_URL}/api/members/123invalidId/history`);
    assert(badIdHistory.status === 400, 'Malformed member ID returns 400');

    // Non-existent member
    const notFoundMember = await fetch(`${BASE_URL}/api/members/${fakeId}/history`);
    assert(notFoundMember.status === 404, 'Non-existent member returns 404');

    // ----------------------------------------------------
    // TEST 10: Centralized 404 Handler
    // ----------------------------------------------------
    console.log('\n--- TEST 10: 404 Undefined Route Handler ---');
    const unknownRoute = await fetch(`${BASE_URL}/api/nonexistent`);
    assert(unknownRoute.status === 404, 'Undefined route returns 404 Not Found');

    console.log('\n====================================================');
    console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================');
  } catch (error) {
    console.error('Unexpected error during test execution:', error);
    failed++;
  } finally {
    // Cleanup
    server.close();
    await mongoose.connection.close();
    process.exit(failed === 0 ? 0 : 1);
  }
}

runTests();
