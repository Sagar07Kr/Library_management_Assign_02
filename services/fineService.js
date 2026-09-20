const Loan = require('../models/Loan');
const config = require('../config/config');
const { calculateFine } = require('../utils/fineCalculator');

/**
 * Fine Service — Manages fine-related operations.
 */

/**
 * Get outstanding fines for a member.
 */
const getMemberFines = async (memberId) => {
  // Get returned loans with unpaid fines
  const loansWithFines = await Loan.find({
    member: memberId,
    fineAmount: { $gt: 0 },
    fineStatus: config.fineStatuses.UNPAID,
  })
    .populate('book', 'title author')
    .lean();

  // Get active overdue loans (fine still accumulating)
  const overdueLoans = await Loan.find({
    member: memberId,
    status: { $in: [config.loanStatuses.ISSUED, config.loanStatuses.OVERDUE] },
    dueDate: { $lt: new Date() },
    returnedAt: null,
  })
    .populate('book', 'title author')
    .lean();

  const activeOverdueFines = overdueLoans.map((loan) => {
    const { daysOverdue, fineAmount } = calculateFine(loan.dueDate);
    return { ...loan, daysOverdue, calculatedFine: fineAmount };
  });

  const totalUnpaidFines = loansWithFines.reduce((sum, l) => sum + l.fineAmount, 0);
  const totalActiveFines = activeOverdueFines.reduce((sum, l) => sum + l.calculatedFine, 0);

  return {
    paidLoans: loansWithFines,
    activeOverdue: activeOverdueFines,
    totalUnpaidFines,
    totalActiveFines,
    totalFines: totalUnpaidFines + totalActiveFines,
  };
};

/**
 * Get total outstanding fines across all members (admin).
 */
const getTotalOutstandingFines = async () => {
  const result = await Loan.aggregate([
    {
      $match: {
        fineAmount: { $gt: 0 },
        fineStatus: config.fineStatuses.UNPAID,
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$fineAmount' },
      },
    },
  ]);

  return result.length > 0 ? result[0].total : 0;
};

module.exports = {
  getMemberFines,
  getTotalOutstandingFines,
};
