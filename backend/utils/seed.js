import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import Book from '../models/Book.js';
import Member from '../models/Member.js';
import BorrowRecord from '../models/BorrowRecord.js';

const seedData = async () => {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/shelflife';
  await mongoose.connect(mongoURI);
  console.log('[Seed] Connected to MongoDB:', mongoURI);

  // Clear existing items in main db to ensure clean consistent state
  await Book.deleteMany({});
  await Member.deleteMany({});
  await BorrowRecord.deleteMany({});

  // Seed Members with exact ObjectIds matching frontend/src/mocks/members.ts
  const members = await Member.insertMany([
    {
      _id: new mongoose.Types.ObjectId('670119e83df4c1d763a8d102'),
      name: 'Alice Johnson',
      email: 'alice.johnson@university.edu',
      membership: 'Undergraduate Student',
      joinedDate: new Date('2026-09-01'),
    },
    {
      _id: new mongoose.Types.ObjectId('670119e83df4c1d763a8d104'),
      name: 'Bob Smith',
      email: 'bob.smith@university.edu',
      membership: 'Faculty / Professor',
      joinedDate: new Date('2026-08-15'),
    },
    {
      _id: new mongoose.Types.ObjectId('670119e83df4c1d763a8d105'),
      name: 'Clara Oswald',
      email: 'clara.oswald@university.edu',
      membership: 'Postgraduate Researcher',
      joinedDate: new Date('2026-07-20'),
    },
    {
      _id: new mongoose.Types.ObjectId('670119e83df4c1d763a8d106'),
      name: 'David Tennant',
      email: 'david.tennant@university.edu',
      membership: 'Staff Member',
      joinedDate: new Date('2026-09-10'),
    },
  ]);
  console.log(`[Seed] Seeded ${members.length} members`);

  // Seed Books
  const books = await Book.insertMany([
    {
      title: 'Introduction to Algorithms (4th Edition)',
      author: 'Thomas H. Cormen, Charles E. Leiserson',
      ISBN: '9780262046305',
      genre: 'Computer Science',
      totalCopies: 5,
      availableCopies: 4,
    },
    {
      title: 'Clean Code: A Handbook of Agile Software Craftsmanship',
      author: 'Robert C. Martin',
      ISBN: '9780132350884',
      genre: 'Software Engineering',
      totalCopies: 4,
      availableCopies: 3,
    },
    {
      title: 'Design Patterns: Elements of Reusable Object-Oriented Software',
      author: 'Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides',
      ISBN: '9780201633610',
      genre: 'Software Engineering',
      totalCopies: 3,
      availableCopies: 3,
    },
    {
      title: 'To Kill a Mockingbird',
      author: 'Harper Lee',
      ISBN: '9780061120084',
      genre: 'Fiction',
      totalCopies: 2,
      availableCopies: 1,
    },
    {
      title: 'The Great Gatsby',
      author: 'F. Scott Fitzgerald',
      ISBN: '9780743273565',
      genre: 'Fiction',
      totalCopies: 2,
      availableCopies: 0, // Out of stock to demonstrate UI badge
    },
    {
      title: 'Linear Algebra and Its Applications',
      author: 'Gilbert Strang',
      ISBN: '9780030105678',
      genre: 'Mathematics',
      totalCopies: 6,
      availableCopies: 6,
    },
  ]);
  console.log(`[Seed] Seeded ${books.length} books`);

  // Seed a sample borrow record for Alice Johnson (one overdue, one returned)
  await BorrowRecord.create({
    book: books[0]._id,
    member: members[0]._id,
    issueDate: new Date('2026-09-05'),
    dueDate: new Date('2026-09-20'), // In the past -> Overdue!
    returnDate: null,
    status: 'overdue',
  });

  await BorrowRecord.create({
    book: books[1]._id,
    member: members[0]._id,
    issueDate: new Date('2026-09-10'),
    dueDate: new Date('2026-09-25'),
    returnDate: new Date('2026-09-24'), // Returned before or on due date
    status: 'returned',
  });
  console.log('[Seed] Seeded sample loan records');

  await mongoose.disconnect();
  console.log('[Seed] Seeding completed successfully!');
  process.exit(0);
};

seedData().catch((err) => {
  console.error('[Seed Error]:', err);
  process.exit(1);
});
