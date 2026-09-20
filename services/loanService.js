const mongoose = require('mongoose');
const Loan = require('../models/Loan');
const Book = require('../models/Book');
const User = require('../models/User');
const config = require('../config/config');
const { calculateFine } = require('../utils/fineCalculator');

/**
 * Loan Service — Centralizes all lending business logic.
 * Enforces librarian-controlled issue and return lifecycle.
 */

let transactionsSupported = null;

/**
 * Helper to run operations in a MongoDB transaction when available (e.g. replica set/Atlas),
 * or fall back seamlessly on standalone MongoDB instances.
 */
const runWithOptionalTransaction = async (workFn) => {
  if (transactionsSupported === false) {
    return await workFn(null);
  }

  let session = null;
  try {
    session = await mongoose.startSession();
    session.startTransaction();
    const result = await workFn(session);
    await session.commitTransaction();
    transactionsSupported = true;
    return result;
  } catch (error) {
    if (session) {
      await session.abortTransaction().catch(() => {});
      session.endSession();
      session = null;
    }

    if (error && error.message && (
      error.message.includes('replica set member') ||
      error.message.includes('Transaction numbers')
    )) {
      transactionsSupported = false;
      return await workFn(null);
    }

    throw error;
  } finally {
    if (session) {
      session.endSession();
    }
  }
};

/**
 * Request a book (Member action).
 * Creates a PENDING loan request.
 * Does NOT decrement available copies.
 * Does NOT start loan duration or fines.
 */
const requestBook = async (memberId, bookId) => {
  // 1. Verify book exists and is active
  const book = await Book.findOne({ _id: bookId, isActive: true });
  if (!book) {
    throw new Error('Book not found or is no longer available in the catalogue.');
  }

  // 2. Check available copies
  if (book.availableCopies <= 0) {
    throw new Error('No copies of this book are currently available to request.');
  }

  // 3. Verify member exists and is active
  const member = await User.findById(memberId);
  if (!member || !member.isActive) {
    throw new Error('Your member account is inactive or not found.');
  }

  // 4. Check member total active loans and pending requests against borrowing quota
  const [activeLoansCount, pendingRequestsCount] = await Promise.all([
    Loan.countDocuments({
      member: memberId,
      status: { $in: [config.loanStatuses.ISSUED, config.loanStatuses.OVERDUE] },
    }),
    Loan.countDocuments({
      member: memberId,
      status: config.loanStatuses.PENDING,
    }),
  ]);

  if (activeLoansCount + pendingRequestsCount >= config.maxActiveLoans) {
    throw new Error(`You have reached your borrowing limit of ${config.maxActiveLoans} books (including pending requests).`);
  }

  // 5. Check if member already has this book active or pending
  const existingLoanOrRequest = await Loan.findOne({
    member: memberId,
    book: bookId,
    status: { $in: [config.loanStatuses.PENDING, config.loanStatuses.ISSUED, config.loanStatuses.OVERDUE] },
  });

  if (existingLoanOrRequest) {
    if (existingLoanOrRequest.status === config.loanStatuses.PENDING) {
      throw new Error('You already have a pending request for this book awaiting librarian approval.');
    }
    throw new Error('You currently have an active borrowed copy of this book.');
  }

  // 6. Create PENDING loan record
  const loan = await Loan.create({
    book: bookId,
    member: memberId,
    status: config.loanStatuses.PENDING,
    requestedAt: new Date(),
    issuedAt: null,
    dueDate: null,
    returnedAt: null,
    daysOverdue: 0,
    fineAmount: 0,
    fineStatus: config.fineStatuses.NONE,
  });

  return loan;
};

/**
 * Approve & Issue Book (Librarian/Admin action).
 * Transitions request from PENDING -> ISSUED.
 * Decrements available copies atomically.
 * Calculates and sets official due date.
 */
const approveAndIssueRequest = async (loanId, adminId) => {
  return runWithOptionalTransaction(async (session) => {
    // 1. Fetch loan with member and book
    const loanQuery = Loan.findById(loanId).populate('member').populate('book');
    if (session) loanQuery.session(session);
    const loan = await loanQuery;

    if (!loan) {
      throw new Error('Borrow request record not found.');
    }

    if (loan.status !== config.loanStatuses.PENDING) {
      throw new Error(`This request cannot be approved as its status is ${loan.status}.`);
    }

    // 2. Validate member
    if (!loan.member || !loan.member.isActive) {
      throw new Error('The requesting member account is inactive or no longer exists.');
    }

    // 3. Validate book
    if (!loan.book || !loan.book.isActive) {
      throw new Error('The requested book is inactive or has been removed from the catalogue.');
    }

    if (loan.book.availableCopies <= 0) {
      throw new Error('Book is out of stock. Cannot issue when available copies is 0.');
    }

    // 4. Validate member active borrowing quota (only count officially ISSUED/OVERDUE)
    const activeCountQuery = Loan.countDocuments({
      member: loan.member._id,
      status: { $in: [config.loanStatuses.ISSUED, config.loanStatuses.OVERDUE] },
    });
    if (session) activeCountQuery.session(session);
    const activeLoansCount = await activeCountQuery;

    if (activeLoansCount >= config.maxActiveLoans) {
      throw new Error(`Member has reached their active borrowing limit (${config.maxActiveLoans} books).`);
    }

    // 5. Ensure member does not already hold another issued copy of the same book
    const duplicateQuery = Loan.findOne({
      _id: { $ne: loan._id },
      member: loan.member._id,
      book: loan.book._id,
      status: { $in: [config.loanStatuses.ISSUED, config.loanStatuses.OVERDUE] },
    });
    if (session) duplicateQuery.session(session);
    const duplicate = await duplicateQuery;

    if (duplicate) {
      throw new Error('Member already has an active loan for this book.');
    }

    // 6. Atomically decrement book available copies
    const updateOptions = { new: true };
    if (session) updateOptions.session = session;
    const updatedBook = await Book.findOneAndUpdate(
      { _id: loan.book._id, availableCopies: { $gt: 0 } },
      { $inc: { availableCopies: -1 } },
      updateOptions
    );

    if (!updatedBook) {
      throw new Error('Failed to update book availability. The last copy may have just been issued.');
    }

    // 7. Update loan status to ISSUED
    const issuedAt = new Date();
    const dueDate = new Date(issuedAt.getTime() + config.loanDurationDays * 24 * 60 * 60 * 1000);

    loan.status = config.loanStatuses.ISSUED;
    loan.issuedAt = issuedAt;
    loan.dueDate = dueDate;
    loan.approvedBy = adminId;
    loan.issuedBy = adminId;
    await loan.save(session ? { session } : undefined);

    return loan;
  });
};

/**
 * Reject Request (Librarian/Admin action).
 * Transitions request from PENDING -> REJECTED.
 * Does NOT decrement or increment copies.
 */
const rejectRequest = async (loanId, adminId, reason = '') => {
  const loan = await Loan.findById(loanId);
  if (!loan) {
    throw new Error('Loan request not found.');
  }

  if (loan.status !== config.loanStatuses.PENDING) {
    throw new Error(`Only pending requests can be rejected (current status: ${loan.status}).`);
  }

  loan.status = config.loanStatuses.REJECTED;
  loan.approvedBy = adminId;
  loan.rejectionReason = reason || 'Declined by library administration.';
  await loan.save();

  return loan;
};

/**
 * Return a book (Librarian/Admin action).
 * Calculates fines server-side, updates loan status to RETURNED,
 * increments available copies, and records audit trail.
 */
const returnBook = async (loanId, adminId) => {
  return runWithOptionalTransaction(async (session) => {
    const loanQuery = Loan.findById(loanId).populate('book').populate('member');
    if (session) loanQuery.session(session);
    const loan = await loanQuery;

    if (!loan) {
      throw new Error('Loan record not found.');
    }

    // Check loan is in a returnable state
    if (loan.status === config.loanStatuses.RETURNED) {
      throw new Error('This book has already been marked as returned.');
    }

    if (loan.status === config.loanStatuses.CANCELLED) {
      throw new Error('This loan has been cancelled.');
    }

    if (loan.status === config.loanStatuses.PENDING || loan.status === config.loanStatuses.REJECTED) {
      throw new Error('This book was never officially issued.');
    }

    // Calculate fine server-side
    const returnedAt = new Date();
    const { daysOverdue, fineAmount } = calculateFine(loan.dueDate, returnedAt);

    // Update loan
    loan.returnedAt = returnedAt;
    loan.status = config.loanStatuses.RETURNED;
    loan.daysOverdue = daysOverdue;
    loan.fineAmount = fineAmount;
    loan.fineStatus = fineAmount > 0 ? config.fineStatuses.UNPAID : config.fineStatuses.NONE;
    loan.returnedBy = adminId;
    await loan.save(session ? { session } : undefined);

    // Restore available copies
    const updateOptions = {};
    if (session) updateOptions.session = session;
    await Book.findOneAndUpdate(
      { _id: loan.book._id || loan.book },
      { $inc: { availableCopies: 1 } },
      updateOptions
    );

    return { loan, daysOverdue, fineAmount };
  });
};

/**
 * Direct issue book by librarian (fallback/direct issue).
 */
const issueBook = async (memberId, bookId, adminId) => {
  const reqLoan = await requestBook(memberId, bookId);
  return await approveAndIssueRequest(reqLoan._id, adminId);
};

/**
 * Get all pending requests for the librarian queue.
 */
const getPendingRequests = async (page = 1, limit = 15) => {
  const skip = (page - 1) * limit;

  const [requests, total] = await Promise.all([
    Loan.find({ status: config.loanStatuses.PENDING })
      .populate('book')
      .populate('member', 'fullName email phone isActive')
      .sort({ requestedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Loan.countDocuments({ status: config.loanStatuses.PENDING }),
  ]);

  // Attach member active loans count for each request
  const memberIds = [...new Set(requests.map((r) => r.member?._id?.toString()).filter(Boolean))];
  const activeLoansCounts = await Loan.aggregate([
    {
      $match: {
        member: { $in: memberIds.map((id) => new mongoose.Types.ObjectId(id)) },
        status: { $in: [config.loanStatuses.ISSUED, config.loanStatuses.OVERDUE] },
      },
    },
    { $group: { _id: '$member', count: { $sum: 1 } } },
  ]);

  const activeCountMap = {};
  activeLoansCounts.forEach((item) => {
    activeCountMap[item._id.toString()] = item.count;
  });

  const enrichedRequests = requests.map((req) => ({
    ...req,
    memberActiveLoans: activeCountMap[req.member?._id?.toString()] || 0,
    maxActiveLoans: config.maxActiveLoans,
  }));

  return {
    requests: enrichedRequests,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
};

/**
 * Get pending requests for a specific member.
 */
const getMemberRequests = async (memberId) => {
  return await Loan.find({
    member: memberId,
    status: config.loanStatuses.PENDING,
  })
    .populate('book')
    .sort({ requestedAt: -1 })
    .lean();
};

/**
 * Get active loans for a member (ISSUED and OVERDUE only).
 * Read-only view for the member.
 */
const getActiveLoans = async (memberId) => {
  const loans = await Loan.find({
    member: memberId,
    status: { $in: [config.loanStatuses.ISSUED, config.loanStatuses.OVERDUE] },
  })
    .populate('book')
    .sort({ dueDate: 1 })
    .lean();

  // Dynamically update overdue status and calculate current fine
  return loans.map((loan) => {
    if (loan.status === config.loanStatuses.ISSUED && new Date() > new Date(loan.dueDate)) {
      loan.status = config.loanStatuses.OVERDUE;
    }
    const { daysOverdue, fineAmount } = calculateFine(loan.dueDate);
    loan.daysOverdue = daysOverdue;
    loan.calculatedFine = fineAmount;
    return loan;
  });
};

/**
 * Get borrowing history for a member (RETURNED, REJECTED, and CANCELLED).
 */
const getLoanHistory = async (memberId, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;

  const [loans, total] = await Promise.all([
    Loan.find({
      member: memberId,
      status: { $in: [config.loanStatuses.RETURNED, config.loanStatuses.CANCELLED, config.loanStatuses.REJECTED] },
    })
      .populate('book')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Loan.countDocuments({
      member: memberId,
      status: { $in: [config.loanStatuses.RETURNED, config.loanStatuses.CANCELLED, config.loanStatuses.REJECTED] },
    }),
  ]);

  return {
    loans,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
};

/**
 * Get all overdue loans (for admin).
 */
const getOverdueLoans = async () => {
  const loans = await Loan.find({
    status: { $in: [config.loanStatuses.ISSUED, config.loanStatuses.OVERDUE] },
    dueDate: { $lt: new Date() },
    returnedAt: null,
  })
    .populate('book')
    .populate('member', 'fullName email')
    .sort({ dueDate: 1 })
    .lean();

  return loans.map((loan) => {
    const { daysOverdue, fineAmount } = calculateFine(loan.dueDate);
    loan.daysOverdue = daysOverdue;
    loan.calculatedFine = fineAmount;
    return loan;
  });
};

/**
 * Get all loans with filtering and pagination (for admin).
 */
const getAllLoans = async (filters = {}, page = 1, limit = 15) => {
  const skip = (page - 1) * limit;
  const query = {};

  if (filters.status && filters.status !== 'ALL') {
    if (filters.status === 'OVERDUE') {
      query.status = { $in: [config.loanStatuses.ISSUED, config.loanStatuses.OVERDUE] };
      query.dueDate = { $lt: new Date() };
      query.returnedAt = null;
    } else {
      query.status = filters.status;
    }
  }

  if (filters.member) {
    query.member = filters.member;
  }

  const [loans, total] = await Promise.all([
    Loan.find(query)
      .populate('book')
      .populate('member', 'fullName email phone')
      .populate('approvedBy', 'fullName email')
      .populate('returnedBy', 'fullName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Loan.countDocuments(query),
  ]);

  // Dynamically detect overdue
  const processedLoans = loans.map((loan) => {
    if (
      loan.status === config.loanStatuses.ISSUED &&
      loan.dueDate &&
      new Date() > new Date(loan.dueDate) &&
      !loan.returnedAt
    ) {
      loan.status = config.loanStatuses.OVERDUE;
    }
    if (loan.dueDate && (loan.status === config.loanStatuses.OVERDUE || new Date() > new Date(loan.dueDate))) {
      const { daysOverdue, fineAmount } = calculateFine(loan.dueDate, loan.returnedAt || new Date());
      loan.daysOverdue = daysOverdue;
      loan.calculatedFine = fineAmount;
    }
    return loan;
  });

  return {
    loans: processedLoans,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
};

/**
 * Check borrowing eligibility for a member.
 */
const checkBorrowingEligibility = async (memberId, bookId) => {
  const result = { eligible: true, reason: '', status: 'AVAILABLE' };

  // Check active loans & pending requests
  const [activeCount, pendingCount] = await Promise.all([
    Loan.countDocuments({
      member: memberId,
      status: { $in: [config.loanStatuses.ISSUED, config.loanStatuses.OVERDUE] },
    }),
    Loan.countDocuments({
      member: memberId,
      status: config.loanStatuses.PENDING,
    }),
  ]);

  if (activeCount + pendingCount >= config.maxActiveLoans) {
    result.eligible = false;
    result.reason = `You have reached your maximum borrowing limit of ${config.maxActiveLoans} books.`;
    return result;
  }

  // Check if member already has this book active or pending
  const existing = await Loan.findOne({
    member: memberId,
    book: bookId,
    status: { $in: [config.loanStatuses.PENDING, config.loanStatuses.ISSUED, config.loanStatuses.OVERDUE] },
  });

  if (existing) {
    result.eligible = false;
    if (existing.status === config.loanStatuses.PENDING) {
      result.status = 'PENDING';
      result.reason = 'You have a pending request for this book awaiting librarian approval.';
    } else {
      result.status = 'ISSUED';
      result.reason = 'You currently have an active borrowed copy of this book.';
    }
    return result;
  }

  return result;
};

module.exports = {
  requestBook,
  approveAndIssueRequest,
  rejectRequest,
  returnBook,
  issueBook,
  getPendingRequests,
  getMemberRequests,
  getActiveLoans,
  getLoanHistory,
  getOverdueLoans,
  getAllLoans,
  checkBorrowingEligibility,
};
