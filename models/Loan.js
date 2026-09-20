const mongoose = require('mongoose');
const { loanStatuses, fineStatuses, dailyFineRate } = require('../config/config');

const loanSchema = new mongoose.Schema(
  {
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      required: [true, 'Book reference is required'],
    },
    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Member reference is required'],
    },
    status: {
      type: String,
      enum: Object.values(loanStatuses),
      default: loanStatuses.PENDING,
    },
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    issuedAt: {
      type: Date,
      default: null,
    },
    dueDate: {
      type: Date,
      default: null,
    },
    returnedAt: {
      type: Date,
      default: null,
    },
    daysOverdue: {
      type: Number,
      default: 0,
      min: 0,
    },
    fineAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    fineStatus: {
      type: String,
      enum: Object.values(fineStatuses),
      default: fineStatuses.NONE,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    issuedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    returnedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    rejectionReason: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
loanSchema.index({ member: 1, status: 1 });
loanSchema.index({ book: 1, status: 1 });
loanSchema.index({ status: 1 });
loanSchema.index({ dueDate: 1 });
loanSchema.index({ member: 1, book: 1, status: 1 });
loanSchema.index({ requestedAt: -1 });

// Virtual: check if loan is currently overdue (dynamic detection)
loanSchema.virtual('isOverdue').get(function () {
  if (!this.dueDate || this.status === loanStatuses.PENDING || this.status === loanStatuses.REJECTED || this.status === loanStatuses.RETURNED || this.status === loanStatuses.CANCELLED) {
    return false;
  }
  return new Date() > this.dueDate && !this.returnedAt;
});

// Virtual: calculate days overdue dynamically
loanSchema.virtual('calculatedDaysOverdue').get(function () {
  if (!this.dueDate || this.status === loanStatuses.PENDING || this.status === loanStatuses.REJECTED) return 0;
  const referenceDate = this.returnedAt || new Date();
  if (referenceDate <= this.dueDate) return 0;
  const diffMs = referenceDate - this.dueDate;
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
});

// Virtual: calculated fine based on current overdue status
loanSchema.virtual('calculatedFine').get(function () {
  if (this.fineAmount > 0) return this.fineAmount;
  const days = this.calculatedDaysOverdue || this.daysOverdue || 0;
  if (days <= 0) return 0;
  return days * dailyFineRate;
});

// Virtual: formatted fine in INR
loanSchema.virtual('formattedFine').get(function () {
  const fine = this.fineAmount || this.calculatedFine;
  return `₹${fine}`;
});

// Ensure virtuals are serialized
loanSchema.set('toJSON', { virtuals: true });
loanSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Loan', loanSchema);
