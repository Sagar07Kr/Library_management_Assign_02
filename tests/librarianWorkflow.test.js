const mongoose = require('mongoose');
const User = require('../models/User');
const Book = require('../models/Book');
const Loan = require('../models/Loan');
const loanService = require('../services/loanService');
const config = require('../config/config');

describe('Librarian-Controlled Book Lending & Return System', () => {
  let adminUser;
  let memberUser;
  let testBook;

  let mongod;
  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      try {
        await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 2500 });
      } catch (err) {
        try {
          await mongoose.connect('mongodb://localhost:27017/library-management', { serverSelectionTimeoutMS: 2500 });
        } catch (err2) {
          const { MongoMemoryServer } = require('mongodb-memory-server');
          mongod = await MongoMemoryServer.create();
          await mongoose.connect(mongod.getUri());
        }
      }
    }

    // Create test admin
    adminUser = await User.create({
      fullName: 'Head Librarian',
      email: `librarian_${Date.now()}@libraryms.com`,
      password: 'AdminPassword123!',
      role: config.roles.ADMIN,
      isActive: true,
    });

    // Create test member
    memberUser = await User.create({
      fullName: 'Alice Member',
      email: `alice_${Date.now()}@libraryms.com`,
      password: 'MemberPassword123!',
      role: config.roles.MEMBER,
      isActive: true,
    });

    // Create test book with 3 copies
    testBook = await Book.create({
      title: 'Design Patterns',
      author: 'Erich Gamma et al.',
      isbn: `978020163361${Date.now().toString().slice(-1)}`,
      category: 'Computer Science',
      totalCopies: 3,
      availableCopies: 3,
      isActive: true,
    });
  });

  afterAll(async () => {
    if (adminUser) await User.findByIdAndDelete(adminUser._id);
    if (memberUser) await User.findByIdAndDelete(memberUser._id);
    if (testBook) await Book.findByIdAndDelete(testBook._id);
    await Loan.deleteMany({ member: memberUser?._id });
    await mongoose.disconnect();
    if (mongod) await mongod.stop();
  });

  test('STEP 1 & 2: Member submits request -> creates PENDING request without decreasing copies', async () => {
    const initialCopies = testBook.availableCopies;

    const reqLoan = await loanService.requestBook(memberUser._id, testBook._id);

    expect(reqLoan).toBeDefined();
    expect(reqLoan.status).toBe(config.loanStatuses.PENDING);
    expect(reqLoan.issuedAt).toBeNull();
    expect(reqLoan.dueDate).toBeNull();

    // Check that available copies DID NOT change
    const bookAfterRequest = await Book.findById(testBook._id);
    expect(bookAfterRequest.availableCopies).toBe(initialCopies);

    // Check that book does NOT appear under active loans
    const activeLoans = await loanService.getActiveLoans(memberUser._id);
    expect(activeLoans.some((l) => l._id.toString() === reqLoan._id.toString())).toBe(false);

    // Check that it DOES appear under member pending requests
    const pending = await loanService.getMemberRequests(memberUser._id);
    expect(pending.some((p) => p._id.toString() === reqLoan._id.toString())).toBe(true);
  });

  test('STEP 3: Prevent duplicate request for same book', async () => {
    await expect(
      loanService.requestBook(memberUser._id, testBook._id)
    ).rejects.toThrow('You already have a pending request for this book');
  });

  test('STEP 4: Librarian sees request in pending requests queue', async () => {
    const queue = await loanService.getPendingRequests(1, 20);
    const found = queue.requests.find((r) => r.member?._id?.toString() === memberUser._id.toString());
    expect(found).toBeDefined();
    expect(found.status).toBe(config.loanStatuses.PENDING);
    expect(found.memberActiveLoans).toBe(0);
  });

  test('STEP 5: Librarian approves and issues book -> status ISSUED, copies decrement by 1', async () => {
    const pendingList = await loanService.getMemberRequests(memberUser._id);
    const pendingReq = pendingList[0];

    const initialCopies = (await Book.findById(testBook._id)).availableCopies;

    const issuedLoan = await loanService.approveAndIssueRequest(pendingReq._id, adminUser._id);

    expect(issuedLoan.status).toBe(config.loanStatuses.ISSUED);
    expect(issuedLoan.issuedAt).toBeDefined();
    expect(issuedLoan.dueDate).toBeDefined();
    expect(issuedLoan.approvedBy.toString()).toBe(adminUser._id.toString());

    // Check copies decremented by 1
    const bookAfterIssue = await Book.findById(testBook._id);
    expect(bookAfterIssue.availableCopies).toBe(initialCopies - 1);

    // Now book MUST appear in member active loans
    const activeLoans = await loanService.getActiveLoans(memberUser._id);
    expect(activeLoans.some((l) => l._id.toString() === issuedLoan._id.toString())).toBe(true);

    // And must NO LONGER appear in pending requests
    const pendingAfter = await loanService.getMemberRequests(memberUser._id);
    expect(pendingAfter.some((p) => p._id.toString() === issuedLoan._id.toString())).toBe(false);
  });

  test('STEP 6: Librarian confirms physical return -> status RETURNED, copies increment by 1, preserved in history', async () => {
    const activeLoans = await loanService.getActiveLoans(memberUser._id);
    const loanToReturn = activeLoans[0];
    const copiesBeforeReturn = (await Book.findById(testBook._id)).availableCopies;

    const { loan: returnedLoan, daysOverdue, fineAmount } = await loanService.returnBook(
      loanToReturn._id,
      adminUser._id
    );

    expect(returnedLoan.status).toBe(config.loanStatuses.RETURNED);
    expect(returnedLoan.returnedAt).toBeDefined();
    expect(returnedLoan.returnedBy.toString()).toBe(adminUser._id.toString());
    expect(daysOverdue).toBe(0);
    expect(fineAmount).toBe(0);

    // Inventory copy restored
    const bookAfterReturn = await Book.findById(testBook._id);
    expect(bookAfterReturn.availableCopies).toBe(copiesBeforeReturn + 1);

    // Removed from active borrowed books
    const activeLoansAfter = await loanService.getActiveLoans(memberUser._id);
    expect(activeLoansAfter.some((l) => l._id.toString() === loanToReturn._id.toString())).toBe(false);

    // Permanently available in borrowing history (NOT deleted)
    const history = await loanService.getLoanHistory(memberUser._id);
    expect(history.loans.some((l) => l._id.toString() === loanToReturn._id.toString())).toBe(true);

    // Record still exists in database
    const dbCheck = await Loan.findById(loanToReturn._id);
    expect(dbCheck).not.toBeNull();
    expect(dbCheck.status).toBe(config.loanStatuses.RETURNED);
  });

  test('STEP 7: Overdue return fine calculation by librarian', async () => {
    // Issue a new request
    const req = await loanService.requestBook(memberUser._id, testBook._id);
    const issued = await loanService.approveAndIssueRequest(req._id, adminUser._id);

    // Simulate overdue due date (5 days ago, offset slightly to account for test execution time)
    const fiveDaysAgo = new Date(Date.now() - (5 * 24 * 60 * 60 * 1000 - 60000));
    await Loan.findByIdAndUpdate(issued._id, { dueDate: fiveDaysAgo });

    // Process return by librarian
    const result = await loanService.returnBook(issued._id, adminUser._id);

    expect(result.daysOverdue).toBe(5);
    expect(result.fineAmount).toBe(5 * config.dailyFineRate);
    expect(result.loan.status).toBe(config.loanStatuses.RETURNED);
    expect(result.loan.fineStatus).toBe(config.fineStatuses.UNPAID);
  });

  test('STEP 8: Librarian rejects request flow', async () => {
    // Create another book for reject test
    const anotherBook = await Book.create({
      title: 'Refactoring',
      author: 'Martin Fowler',
      isbn: `978020148567${Date.now().toString().slice(-1)}`,
      category: 'Computer Science',
      totalCopies: 2,
      availableCopies: 2,
      isActive: true,
    });

    const req = await loanService.requestBook(memberUser._id, anotherBook._id);
    const rejected = await loanService.rejectRequest(req._id, adminUser._id, 'Physical copy reserved for course work');

    expect(rejected.status).toBe(config.loanStatuses.REJECTED);
    expect(rejected.rejectionReason).toBe('Physical copy reserved for course work');

    // Available copies MUST NOT change
    const bookCheck = await Book.findById(anotherBook._id);
    expect(bookCheck.availableCopies).toBe(2);

    // Clean up
    await Book.findByIdAndDelete(anotherBook._id);
  });
});
