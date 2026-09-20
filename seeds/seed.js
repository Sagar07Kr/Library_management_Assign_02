/**
 * Database Seed Script
 *
 * Populates the database with demo data for development/testing.
 * Run with: npm run seed
 *
 * WARNING: This will clear existing data!
 *
 * Demo credentials:
 *   Admin: admin@example.com / Admin@123
 *   Member: john@example.com / Member@123
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('../config/config');
const User = require('../models/User');
const Book = require('../models/Book');
const Loan = require('../models/Loan');

const seedDB = async () => {
  try {
    console.log('🌱 Connecting to MongoDB...');
    await mongoose.connect(config.mongoUri);
    console.log('✓ Connected.\n');

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await User.deleteMany({});
    await Book.deleteMany({});
    await Loan.deleteMany({});
    try {
      await mongoose.connection.collection('sessions').deleteMany({});
      console.log('✓ Cleared sessions.');
    } catch (e) {
      // ignore if collection doesn't exist
    }
    console.log('✓ Cleared.\n');

    // ---- Create Users ----
    console.log('👤 Creating users...');
    const admin = await User.create({
      fullName: 'Library Admin',
      email: 'admin@example.com',
      password: 'Admin@123',
      role: 'ADMIN',
      phone: '+91 98765 00001',
    });

    const members = await User.create([
      { fullName: 'John Doe', email: 'john@example.com', password: 'Member@123', role: 'MEMBER', phone: '+91 98765 10001' },
      { fullName: 'Priya Sharma', email: 'priya@example.com', password: 'Member@123', role: 'MEMBER', phone: '+91 98765 10002' },
      { fullName: 'Rahul Kumar', email: 'rahul@example.com', password: 'Member@123', role: 'MEMBER', phone: '+91 98765 10003' },
      { fullName: 'Ananya Patel', email: 'ananya@example.com', password: 'Member@123', role: 'MEMBER', phone: '+91 98765 10004' },
      { fullName: 'Arjun Singh', email: 'arjun@example.com', password: 'Member@123', role: 'MEMBER', phone: '+91 98765 10005' },
    ]);

    console.log(`✓ Created 1 admin and ${members.length} members.\n`);

    // ---- Create Books ----
    console.log('📚 Creating books...');
    const books = await Book.create([
      {
        title: 'Clean Code',
        author: 'Robert C. Martin',
        isbn: '978-0132350884',
        category: 'Programming',
        description: 'A handbook of agile software craftsmanship. Noted software expert Robert C. Martin presents a revolutionary paradigm with Clean Code: A Handbook of Agile Software Craftsmanship.',
        publisher: 'Prentice Hall',
        publicationYear: 2008,
        coverImage: 'https://placehold.co/300x400/4f46e5/ffffff?text=Clean+Code',
        totalCopies: 5,
        availableCopies: 5,
      },
      {
        title: 'Introduction to Algorithms',
        author: 'Thomas H. Cormen',
        isbn: '978-0262033848',
        category: 'Computer Science',
        description: 'The latest edition of the essential text and professional reference on algorithms. Comprehensive coverage of a broad range of algorithms.',
        publisher: 'MIT Press',
        publicationYear: 2009,
        coverImage: 'https://placehold.co/300x400/2563eb/ffffff?text=Algorithms',
        totalCopies: 4,
        availableCopies: 4,
      },
      {
        title: 'Design Patterns',
        author: 'Erich Gamma',
        isbn: '978-0201633610',
        category: 'Programming',
        description: 'Elements of Reusable Object-Oriented Software. Capturing a wealth of experience about the design of object-oriented software.',
        publisher: 'Addison-Wesley',
        publicationYear: 1994,
        coverImage: 'https://placehold.co/300x400/7c3aed/ffffff?text=Design+Patterns',
        totalCopies: 3,
        availableCopies: 3,
      },
      {
        title: 'The Pragmatic Programmer',
        author: 'David Thomas & Andrew Hunt',
        isbn: '978-0135957059',
        category: 'Programming',
        description: 'Your journey to mastery. Updated for modern programming practices.',
        publisher: 'Addison-Wesley',
        publicationYear: 2019,
        coverImage: 'https://placehold.co/300x400/059669/ffffff?text=Pragmatic+Programmer',
        totalCopies: 4,
        availableCopies: 4,
      },
      {
        title: 'Atomic Habits',
        author: 'James Clear',
        isbn: '978-0735211292',
        category: 'Self-Help',
        description: 'An easy and proven way to build good habits and break bad ones. Tiny changes, remarkable results.',
        publisher: 'Avery',
        publicationYear: 2018,
        coverImage: 'https://placehold.co/300x400/d97706/ffffff?text=Atomic+Habits',
        totalCopies: 6,
        availableCopies: 6,
      },
      {
        title: 'To Kill a Mockingbird',
        author: 'Harper Lee',
        isbn: '978-0061120084',
        category: 'Fiction',
        description: "The unforgettable novel of a childhood in a sleepy Southern town and the crisis of conscience that rocked it.",
        publisher: 'Harper Perennial',
        publicationYear: 1960,
        coverImage: 'https://placehold.co/300x400/dc2626/ffffff?text=Mockingbird',
        totalCopies: 3,
        availableCopies: 3,
      },
      {
        title: 'Sapiens: A Brief History of Humankind',
        author: 'Yuval Noah Harari',
        isbn: '978-0062316097',
        category: 'Non-Fiction',
        description: 'A groundbreaking narrative of humanity\'s creation and evolution.',
        publisher: 'Harper',
        publicationYear: 2015,
        coverImage: 'https://placehold.co/300x400/0891b2/ffffff?text=Sapiens',
        totalCopies: 4,
        availableCopies: 4,
      },
      {
        title: 'The Art of War',
        author: 'Sun Tzu',
        isbn: '978-1599869773',
        category: 'Philosophy',
        description: 'An ancient Chinese military treatise dating from the 5th century BC.',
        publisher: 'Filiquarian',
        publicationYear: 2007,
        coverImage: 'https://placehold.co/300x400/1e293b/ffffff?text=Art+of+War',
        totalCopies: 2,
        availableCopies: 2,
      },
      {
        title: 'Thinking, Fast and Slow',
        author: 'Daniel Kahneman',
        isbn: '978-0374533557',
        category: 'Science',
        description: 'The acclaimed exploration of the two systems that drive the way we think.',
        publisher: 'Farrar, Straus and Giroux',
        publicationYear: 2011,
        coverImage: 'https://placehold.co/300x400/6366f1/ffffff?text=Fast+%26+Slow',
        totalCopies: 3,
        availableCopies: 3,
      },
      {
        title: 'Zero to One',
        author: 'Peter Thiel',
        isbn: '978-0804139298',
        category: 'Business',
        description: 'Notes on startups, or how to build the future.',
        publisher: 'Crown Business',
        publicationYear: 2014,
        coverImage: 'https://placehold.co/300x400/db2777/ffffff?text=Zero+to+One',
        totalCopies: 4,
        availableCopies: 4,
      },
      {
        title: 'A Brief History of Time',
        author: 'Stephen Hawking',
        isbn: '978-0553380163',
        category: 'Science',
        description: 'A landmark volume in science writing by one of the great minds of our time.',
        publisher: 'Bantam',
        publicationYear: 1998,
        coverImage: 'https://placehold.co/300x400/0284c7/ffffff?text=Brief+History',
        totalCopies: 3,
        availableCopies: 3,
      },
      {
        title: 'The Great Gatsby',
        author: 'F. Scott Fitzgerald',
        isbn: '978-0743273565',
        category: 'Fiction',
        description: 'The quintessential novel of the Jazz Age, set on Long Island.',
        publisher: 'Scribner',
        publicationYear: 1925,
        coverImage: 'https://placehold.co/300x400/84cc16/ffffff?text=Great+Gatsby',
        totalCopies: 3,
        availableCopies: 3,
      },
      {
        title: 'Structure and Interpretation of Computer Programs',
        author: 'Harold Abelson',
        isbn: '978-0262510875',
        category: 'Computer Science',
        description: 'A fundamental text in computer science, exploring the nature of computation.',
        publisher: 'MIT Press',
        publicationYear: 1996,
        coverImage: 'https://placehold.co/300x400/3730a3/ffffff?text=SICP',
        totalCopies: 2,
        availableCopies: 2,
      },
      {
        title: 'Steve Jobs',
        author: 'Walter Isaacson',
        isbn: '978-1451648539',
        category: 'Biography',
        description: 'The exclusive biography of Steve Jobs, based on extensive interviews.',
        publisher: 'Simon & Schuster',
        publicationYear: 2011,
        coverImage: 'https://placehold.co/300x400/475569/ffffff?text=Steve+Jobs',
        totalCopies: 3,
        availableCopies: 3,
      },
      {
        title: 'Calculus',
        author: 'James Stewart',
        isbn: '978-1285740621',
        category: 'Mathematics',
        description: 'A comprehensive guide to single-variable and multivariable calculus.',
        publisher: 'Cengage Learning',
        publicationYear: 2015,
        coverImage: 'https://placehold.co/300x400/f97316/ffffff?text=Calculus',
        totalCopies: 5,
        availableCopies: 5,
      },
      {
        title: 'Eloquent JavaScript',
        author: 'Marijn Haverbeke',
        isbn: '978-1593279509',
        category: 'Programming',
        description: 'A modern introduction to programming and JavaScript.',
        publisher: 'No Starch Press',
        publicationYear: 2018,
        coverImage: 'https://placehold.co/300x400/eab308/333333?text=Eloquent+JS',
        totalCopies: 4,
        availableCopies: 4,
      },
      {
        title: '1984',
        author: 'George Orwell',
        isbn: '978-0451524935',
        category: 'Fiction',
        description: "Orwell's chilling dystopian masterpiece about a totalitarian regime.",
        publisher: 'Signet Classic',
        publicationYear: 1949,
        coverImage: 'https://placehold.co/300x400/991b1b/ffffff?text=1984',
        totalCopies: 3,
        availableCopies: 3,
      },
      {
        title: 'The Lean Startup',
        author: 'Eric Ries',
        isbn: '978-0307887894',
        category: 'Business',
        description: 'How constant innovation creates radically successful businesses.',
        publisher: 'Crown Business',
        publicationYear: 2011,
        coverImage: 'https://placehold.co/300x400/0d9488/ffffff?text=Lean+Startup',
        totalCopies: 3,
        availableCopies: 3,
      },
      {
        title: 'A Short History of Nearly Everything',
        author: 'Bill Bryson',
        isbn: '978-0767908184',
        category: 'Science',
        description: 'An engaging exploration of science, from the Big Bang to the rise of civilization.',
        publisher: 'Broadway Books',
        publicationYear: 2003,
        coverImage: 'https://placehold.co/300x400/4338ca/ffffff?text=Short+History',
        totalCopies: 2,
        availableCopies: 2,
      },
      {
        title: 'Gödel, Escher, Bach',
        author: 'Douglas Hofstadter',
        isbn: '978-0465026562',
        category: 'Mathematics',
        description: 'An eternal golden braid exploring consciousness, intelligence, and the nature of meaning.',
        publisher: 'Basic Books',
        publicationYear: 1979,
        coverImage: 'https://placehold.co/300x400/7e22ce/ffffff?text=GEB',
        totalCopies: 2,
        availableCopies: 2,
      },
    ]);

    console.log(`✓ Created ${books.length} books.\n`);

    // ---- Create Sample Loans ----
    console.log('📋 Creating sample loans...');

    const now = new Date();

    // Active loans
    const loan1 = await Loan.create({
      book: books[0]._id, // Clean Code
      member: members[0]._id, // John
      issuedAt: new Date(now - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      dueDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      status: 'ISSUED',
    });
    await Book.findByIdAndUpdate(books[0]._id, { $inc: { availableCopies: -1 } });

    const loan2 = await Loan.create({
      book: books[4]._id, // Atomic Habits
      member: members[1]._id, // Priya
      issuedAt: new Date(now - 10 * 24 * 60 * 60 * 1000),
      dueDate: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000),
      status: 'ISSUED',
    });
    await Book.findByIdAndUpdate(books[4]._id, { $inc: { availableCopies: -1 } });

    // Overdue loan
    const loan3 = await Loan.create({
      book: books[1]._id, // Intro to Algorithms
      member: members[2]._id, // Rahul
      issuedAt: new Date(now - 20 * 24 * 60 * 60 * 1000),
      dueDate: new Date(now - 6 * 24 * 60 * 60 * 1000), // 6 days overdue
      status: 'OVERDUE',
    });
    await Book.findByIdAndUpdate(books[1]._id, { $inc: { availableCopies: -1 } });

    // Returned loans
    const loan4 = await Loan.create({
      book: books[5]._id, // To Kill a Mockingbird
      member: members[0]._id,
      issuedAt: new Date(now - 30 * 24 * 60 * 60 * 1000),
      dueDate: new Date(now - 16 * 24 * 60 * 60 * 1000),
      returnedAt: new Date(now - 17 * 24 * 60 * 60 * 1000),
      status: 'RETURNED',
      fineAmount: 0,
      fineStatus: 'NONE',
    });

    const loan5 = await Loan.create({
      book: books[9]._id, // Zero to One
      member: members[1]._id,
      issuedAt: new Date(now - 45 * 24 * 60 * 60 * 1000),
      dueDate: new Date(now - 31 * 24 * 60 * 60 * 1000),
      returnedAt: new Date(now - 28 * 24 * 60 * 60 * 1000),
      status: 'RETURNED',
      fineAmount: 15,
      fineStatus: 'UNPAID',
    });

    const loan6 = await Loan.create({
      book: books[6]._id, // Sapiens
      member: members[3]._id,
      issuedAt: new Date(now - 25 * 24 * 60 * 60 * 1000),
      dueDate: new Date(now - 11 * 24 * 60 * 60 * 1000),
      returnedAt: new Date(now - 12 * 24 * 60 * 60 * 1000),
      status: 'RETURNED',
      fineAmount: 0,
      fineStatus: 'NONE',
    });

    // More active loans for richer dashboard data
    const loan7 = await Loan.create({
      book: books[3]._id, // Pragmatic Programmer
      member: members[3]._id,
      issuedAt: new Date(now - 5 * 24 * 60 * 60 * 1000),
      dueDate: new Date(now.getTime() + 9 * 24 * 60 * 60 * 1000),
      status: 'ISSUED',
    });
    await Book.findByIdAndUpdate(books[3]._id, { $inc: { availableCopies: -1 } });

    const loan8 = await Loan.create({
      book: books[10]._id, // Brief History of Time
      member: members[4]._id,
      issuedAt: new Date(now - 3 * 24 * 60 * 60 * 1000),
      dueDate: new Date(now.getTime() + 11 * 24 * 60 * 60 * 1000),
      status: 'ISSUED',
    });
    await Book.findByIdAndUpdate(books[10]._id, { $inc: { availableCopies: -1 } });

    console.log('✓ Created 8 sample loans.\n');

    // ---- Summary ----
    console.log('═══════════════════════════════════════');
    console.log('  ✅ Database seeded successfully!');
    console.log('═══════════════════════════════════════');
    console.log('');
    console.log('  Demo Accounts:');
    console.log('  ─────────────');
    console.log('  Admin:   admin@example.com / Admin@123');
    console.log('  Member:  john@example.com  / Member@123');
    console.log('  Member:  priya@example.com / Member@123');
    console.log('  Member:  rahul@example.com / Member@123');
    console.log('  Member:  ananya@example.com / Member@123');
    console.log('  Member:  arjun@example.com / Member@123');
    console.log('');
    console.log('  ⚠ This is demo data. Change passwords');
    console.log('    before any real deployment.');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
};

seedDB();
