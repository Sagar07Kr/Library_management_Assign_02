const config = require('../config/config');

/**
 * Fine calculation utility.
 * Centralizes all fine-related logic.
 */

/**
 * Calculate fine amount based on overdue days.
 * @param {Date} dueDate - When the book was due
 * @param {Date} [returnDate] - When the book was returned (defaults to now)
 * @returns {{ daysOverdue: number, fineAmount: number }}
 */
const calculateFine = (dueDate, returnDate = new Date()) => {
  const due = new Date(dueDate);
  const returned = new Date(returnDate);

  if (returned <= due) {
    return { daysOverdue: 0, fineAmount: 0 };
  }

  const diffMs = returned - due;
  const daysOverdue = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const fineAmount = daysOverdue * config.dailyFineRate;

  return { daysOverdue, fineAmount };
};

/**
 * Check if a loan is currently overdue.
 * @param {Date} dueDate
 * @param {Date} [returnedAt] - If set, the loan is already returned
 * @returns {boolean}
 */
const isOverdue = (dueDate, returnedAt = null) => {
  if (returnedAt) return false;
  return new Date() > new Date(dueDate);
};

/**
 * Format fine for display.
 */
const formatFine = (amount) => {
  if (!amount || amount <= 0) return '₹0';
  return `₹${amount.toLocaleString('en-IN')}`;
};

module.exports = {
  calculateFine,
  isOverdue,
  formatFine,
};
