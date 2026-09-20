/**
 * Utility helpers used across the application.
 */

/**
 * Format a date to a readable string.
 */
const formatDate = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Format date with time.
 */
const formatDateTime = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Format currency in Indian Rupees.
 */
const formatCurrency = (amount) => {
  if (amount === 0 || amount === null || amount === undefined) return '₹0';
  return `₹${Number(amount).toLocaleString('en-IN')}`;
};

/**
 * Get a greeting based on the time of day.
 */
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

/**
 * Calculate days between two dates.
 */
const daysBetween = (date1, date2) => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffMs = d2 - d1;
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
};

/**
 * Truncate text to a specified length.
 */
const truncate = (text, length = 100) => {
  if (!text) return '';
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
};

/**
 * Generate a placeholder cover image URL based on book title.
 */
const getPlaceholderCover = (title) => {
  const colors = ['4f46e5', '7c3aed', '2563eb', '0891b2', '059669', 'd97706', 'dc2626'];
  const color = colors[Math.abs(hashCode(title || 'Book')) % colors.length];
  return `https://placehold.co/300x400/${color}/ffffff?text=${encodeURIComponent((title || 'Book').substring(0, 15))}`;
};

function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return hash;
}

/**
 * Build query string from filter object, preserving existing params.
 */
const buildQuery = (baseParams, overrides) => {
  const params = { ...baseParams, ...overrides };
  // Remove empty values
  Object.keys(params).forEach((key) => {
    if (!params[key] || params[key] === '') delete params[key];
  });
  return new URLSearchParams(params).toString();
};

module.exports = {
  formatDate,
  formatDateTime,
  formatCurrency,
  getGreeting,
  daysBetween,
  truncate,
  getPlaceholderCover,
  buildQuery,
};
