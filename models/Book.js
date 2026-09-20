const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Book title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    author: {
      type: String,
      required: [true, 'Author is required'],
      trim: true,
      maxlength: [150, 'Author name cannot exceed 150 characters'],
    },
    isbn: {
      type: String,
      required: [true, 'ISBN is required'],
      unique: true,
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
      default: '',
    },
    publisher: {
      type: String,
      trim: true,
      default: '',
    },
    publicationYear: {
      type: Number,
      min: [1000, 'Invalid publication year'],
      max: [new Date().getFullYear() + 1, 'Publication year cannot be in the future'],
    },
    coverImage: {
      type: String,
      default: '',
    },
    totalCopies: {
      type: Number,
      required: [true, 'Total copies is required'],
      min: [1, 'Total copies must be at least 1'],
    },
    availableCopies: {
      type: Number,
      required: true,
      min: [0, 'Available copies cannot be negative'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient search and filtering
bookSchema.index({ title: 'text', author: 'text' });
bookSchema.index({ category: 1 });
bookSchema.index({ isActive: 1 });
bookSchema.index({ availableCopies: 1 });

// Validate that availableCopies does not exceed totalCopies
bookSchema.pre('validate', function (next) {
  if (this.availableCopies > this.totalCopies) {
    this.invalidate('availableCopies', 'Available copies cannot exceed total copies');
  }
  next();
});

// Virtual: availability status label
bookSchema.virtual('availabilityStatus').get(function () {
  if (this.availableCopies === 0) return 'OUT_OF_STOCK';
  if (this.availableCopies <= 2) return 'LIMITED';
  return 'AVAILABLE';
});

// Virtual: issued copies count
bookSchema.virtual('issuedCopies').get(function () {
  return this.totalCopies - this.availableCopies;
});

// Ensure virtuals are included in JSON/Object output
bookSchema.set('toJSON', { virtuals: true });
bookSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Book', bookSchema);
