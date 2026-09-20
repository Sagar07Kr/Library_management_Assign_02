const mongoose = require('mongoose');

/**
 * Check if a string is a valid MongoDB ObjectId.
 */
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

/**
 * Sanitize a search query — remove special regex chars.
 */
const sanitizeSearch = (query) => {
  if (!query) return '';
  return query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').trim();
};

/**
 * Validate email format.
 */
const isValidEmail = (email) => /^\S+@\S+\.\S+$/.test(email);

/**
 * Validate password strength (min 6 chars).
 */
const isValidPassword = (password) => !!password && password.length >= 6;

module.exports = {
  isValidObjectId,
  sanitizeSearch,
  isValidEmail,
  isValidPassword,
};
