require('dotenv').config();

/**
 * Centralized application configuration.
 * All configurable values are read from environment variables with sensible defaults.
 * Never hard-code these values elsewhere in the application.
 */
module.exports = {
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',

  // Database
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/library-management',

  // Session
  sessionSecret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',

  // Library business rules
  loanDurationDays: parseInt(process.env.LOAN_DURATION_DAYS, 10) || 14,
  maxActiveLoans: parseInt(process.env.MAX_ACTIVE_LOANS, 10) || 5,
  dailyFineRate: parseInt(process.env.DAILY_FINE_RATE, 10) || 5, // ₹ per day

  // Pagination
  defaultPageSize: 12,
  adminPageSize: 15,

  // Roles
  roles: {
    MEMBER: 'MEMBER',
    ADMIN: 'ADMIN',
  },

  // Loan statuses
  loanStatuses: {
    PENDING: 'PENDING',
    ISSUED: 'ISSUED',
    RETURNED: 'RETURNED',
    OVERDUE: 'OVERDUE',
    CANCELLED: 'CANCELLED',
    REJECTED: 'REJECTED',
  },

  // Fine statuses
  fineStatuses: {
    NONE: 'NONE',
    UNPAID: 'UNPAID',
    PAID: 'PAID',
    WAIVED: 'WAIVED',
  },

  // Book categories
  bookCategories: [
    'Programming',
    'Computer Science',
    'Fiction',
    'Non-Fiction',
    'Business',
    'Science',
    'Mathematics',
    'History',
    'Philosophy',
    'Self-Help',
    'Biography',
    'Other',
  ],
};
