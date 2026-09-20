const Book = require('../models/Book');
const Loan = require('../models/Loan');
const User = require('../models/User');
const config = require('../config/config');
const { calculateFine } = require('../utils/fineCalculator');

/**
 * Dashboard Service — Aggregation queries for dashboards and analytics.
 */

/**
 * Get member dashboard statistics.
 */
const getMemberStats = async (memberId) => {
  const [activeLoans, pendingRequests, overdueLoans, booksRead, fines] = await Promise.all([
    // Active loans count (ISSUED + OVERDUE)
    Loan.countDocuments({
      member: memberId,
      status: { $in: [config.loanStatuses.ISSUED, config.loanStatuses.OVERDUE] },
    }),
    // Pending requests count
    Loan.countDocuments({
      member: memberId,
      status: config.loanStatuses.PENDING,
    }),
    // Overdue loans
    Loan.find({
      member: memberId,
      status: { $in: [config.loanStatuses.ISSUED, config.loanStatuses.OVERDUE] },
      dueDate: { $lt: new Date() },
      returnedAt: null,
    }).lean(),
    // Total books read
    Loan.countDocuments({
      member: memberId,
      status: config.loanStatuses.RETURNED,
    }),
    // Outstanding fines
    Loan.aggregate([
      {
        $match: {
          member: memberId,
          fineAmount: { $gt: 0 },
          fineStatus: config.fineStatuses.UNPAID,
        },
      },
      { $group: { _id: null, total: { $sum: '$fineAmount' } } },
    ]),
  ]);

  // Calculate active overdue fines
  let activeOverdueFine = 0;
  overdueLoans.forEach((loan) => {
    const { fineAmount } = calculateFine(loan.dueDate);
    activeOverdueFine += fineAmount;
  });

  return {
    activeLoans,
    pendingRequests,
    overdueCount: overdueLoans.length,
    booksRead,
    outstandingFine: (fines.length > 0 ? fines[0].total : 0) + activeOverdueFine,
  };
};

/**
 * Get admin dashboard statistics.
 */
const getAdminStats = async () => {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [
    totalBooks,
    totalCopiesAgg,
    pendingRequests,
    issuedBooks,
    overdueBooks,
    returnedToday,
    totalMembers,
    outstandingFinesAgg,
  ] = await Promise.all([
    Book.countDocuments({ isActive: true }),
    Book.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: null, total: { $sum: '$totalCopies' }, available: { $sum: '$availableCopies' } } },
    ]),
    Loan.countDocuments({
      status: config.loanStatuses.PENDING,
    }),
    Loan.countDocuments({
      status: { $in: [config.loanStatuses.ISSUED, config.loanStatuses.OVERDUE] },
    }),
    Loan.countDocuments({
      status: { $in: [config.loanStatuses.ISSUED, config.loanStatuses.OVERDUE] },
      dueDate: { $lt: now },
      returnedAt: null,
    }),
    Loan.countDocuments({
      status: config.loanStatuses.RETURNED,
      returnedAt: { $gte: startOfToday },
    }),
    User.countDocuments({ role: config.roles.MEMBER, isActive: true }),
    Loan.aggregate([
      { $match: { fineAmount: { $gt: 0 }, fineStatus: config.fineStatuses.UNPAID } },
      { $group: { _id: null, total: { $sum: '$fineAmount' } } },
    ]),
  ]);

  const copiesData = totalCopiesAgg[0] || { total: 0, available: 0 };

  return {
    totalBooks,
    totalCopies: copiesData.total,
    availableCopies: copiesData.available,
    pendingRequests,
    issuedBooks,
    overdueBooks,
    returnedToday,
    totalMembers,
    outstandingFines: outstandingFinesAgg.length > 0 ? outstandingFinesAgg[0].total : 0,
  };
};

/**
 * Get most borrowed books using aggregation pipeline.
 */
const getMostBorrowedBooks = async (limit = 10) => {
  return Loan.aggregate([
    {
      $group: {
        _id: '$book',
        totalLoans: { $sum: 1 },
      },
    },
    { $sort: { totalLoans: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'books',
        localField: '_id',
        foreignField: '_id',
        as: 'bookDetails',
      },
    },
    { $unwind: '$bookDetails' },
    {
      $project: {
        _id: 1,
        totalLoans: 1,
        title: '$bookDetails.title',
        author: '$bookDetails.author',
        coverImage: '$bookDetails.coverImage',
        category: '$bookDetails.category',
      },
    },
  ]);
};

/**
 * Get most active members.
 */
const getMostActiveMembers = async (limit = 10) => {
  return Loan.aggregate([
    {
      $group: {
        _id: '$member',
        totalLoans: { $sum: 1 },
      },
    },
    { $sort: { totalLoans: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'memberDetails',
      },
    },
    { $unwind: '$memberDetails' },
    {
      $project: {
        _id: 1,
        totalLoans: 1,
        fullName: '$memberDetails.fullName',
        email: '$memberDetails.email',
      },
    },
  ]);
};

/**
 * Get category distribution.
 */
const getCategoryDistribution = async () => {
  return Book.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
  ]);
};

/**
 * Get monthly borrowing activity for the last 12 months.
 */
const getMonthlyActivity = async () => {
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

  return Loan.aggregate([
    {
      $match: {
        issuedAt: { $gte: twelveMonthsAgo },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: '$issuedAt' },
          month: { $month: '$issuedAt' },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);
};

/**
 * Get popular/recommended books (most borrowed recently).
 */
const getPopularBooks = async (limit = 6) => {
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  const popularIds = await Loan.aggregate([
    { $match: { issuedAt: { $gte: threeMonthsAgo } } },
    { $group: { _id: '$book', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: limit },
  ]);

  const bookIds = popularIds.map((p) => p._id);
  if (bookIds.length === 0) {
    // Fallback: newest books
    return Book.find({ isActive: true }).sort({ createdAt: -1 }).limit(limit).lean();
  }

  return Book.find({ _id: { $in: bookIds }, isActive: true }).lean();
};

module.exports = {
  getMemberStats,
  getAdminStats,
  getMostBorrowedBooks,
  getMostActiveMembers,
  getCategoryDistribution,
  getMonthlyActivity,
  getPopularBooks,
};
