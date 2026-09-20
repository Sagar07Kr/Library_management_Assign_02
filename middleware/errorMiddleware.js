const config = require('../config/config');

/**
 * 404 Not Found handler.
 */
const notFound = (req, res, next) => {
  res.status(404).render('errors/404', {
    title: 'Page Not Found | Library Management System',
    layout: 'layouts/main',
  });
};

/**
 * Centralized error handler.
 * In development: shows stack trace.
 * In production: shows sanitized message.
 */
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  const statusCode = err.statusCode || 500;
  const message = config.isProduction
    ? 'Something went wrong. Please try again later.'
    : err.message || 'Internal Server Error';

  // Handle specific Mongoose errors
  if (err.name === 'CastError') {
    return res.status(400).render('errors/404', {
      title: 'Invalid Request | Library Management System',
      layout: 'layouts/main',
    });
  }

  if (err.name === 'ValidationError') {
    req.flash('error', Object.values(err.errors).map(e => e.message).join(', '));
    return res.redirect('back');
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    req.flash('error', `A record with this ${field} already exists.`);
    return res.redirect('back');
  }

  res.status(statusCode).render('errors/500', {
    title: 'Server Error | Library Management System',
    message,
    stack: config.isProduction ? null : err.stack,
    layout: 'layouts/main',
  });
};

module.exports = { notFound, errorHandler };
