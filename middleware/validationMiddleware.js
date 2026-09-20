const { body, param, query } = require('express-validator');
const { bookCategories } = require('../config/config');

/**
 * Validation chains for registration.
 */
const validateRegistration = [
  body('fullName')
    .trim()
    .notEmpty().withMessage('Full name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2–100 characters'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please enter a valid email address')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),

  body('confirmPassword')
    .notEmpty().withMessage('Please confirm your password')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),

  body('phone')
    .optional({ checkFalsy: true })
    .trim()
    .isMobilePhone().withMessage('Please enter a valid phone number'),
];

/**
 * Validation chains for login.
 */
const validateLogin = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please enter a valid email address')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required'),
];

/**
 * Validation chains for book creation/update.
 */
const validateBook = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ max: 200 }).withMessage('Title cannot exceed 200 characters'),

  body('author')
    .trim()
    .notEmpty().withMessage('Author is required')
    .isLength({ max: 150 }).withMessage('Author name cannot exceed 150 characters'),

  body('isbn')
    .trim()
    .notEmpty().withMessage('ISBN is required'),

  body('category')
    .trim()
    .notEmpty().withMessage('Category is required')
    .isIn(bookCategories).withMessage('Invalid category'),

  body('description')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 2000 }).withMessage('Description cannot exceed 2000 characters'),

  body('publisher')
    .optional({ checkFalsy: true })
    .trim(),

  body('publicationYear')
    .optional({ checkFalsy: true })
    .isInt({ min: 1000, max: new Date().getFullYear() + 1 })
    .withMessage('Invalid publication year'),

  body('coverImage')
    .optional({ checkFalsy: true })
    .trim(),

  body('totalCopies')
    .notEmpty().withMessage('Total copies is required')
    .isInt({ min: 1 }).withMessage('Total copies must be at least 1'),
];

/**
 * Validation chains for profile update.
 */
const validateProfile = [
  body('fullName')
    .trim()
    .notEmpty().withMessage('Full name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2–100 characters'),

  body('phone')
    .optional({ checkFalsy: true })
    .trim(),

  body('profileImage')
    .optional({ checkFalsy: true })
    .trim(),
];

/**
 * Validate MongoDB ObjectId parameter.
 */
const validateObjectId = [
  param('id')
    .isMongoId().withMessage('Invalid ID format'),
];

module.exports = {
  validateRegistration,
  validateLogin,
  validateBook,
  validateProfile,
  validateObjectId,
};
