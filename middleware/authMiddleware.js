const User = require('../models/User');
const { roles } = require('../config/config');

/**
 * Middleware: Require authentication.
 * Redirects unauthenticated users to login page.
 * Validates that session user actually exists in the database.
 */
const isAuthenticated = async (req, res, next) => {
  if (!req.session || !req.session.user) {
    req.flash('error', 'Please log in to access this page.');
    return res.redirect('/login');
  }

  try {
    let user = await User.findById(req.session.user._id).select('_id fullName email role isActive phone profileImage').lean();
    if (!user && req.session.user.email) {
      user = await User.findOne({ email: req.session.user.email, isActive: true }).select('_id fullName email role isActive phone profileImage').lean();
      if (user) {
        req.session.user._id = user._id.toString();
        req.session.user.role = user.role;
        req.session.user.fullName = user.fullName;
        req.session.user.email = user.email;
        req.session.user.phone = user.phone;
        req.session.user.profileImage = user.profileImage;
      }
    }

    if (!user || !user.isActive) {
      req.session.destroy(() => {
        res.redirect('/login');
      });
      return;
    }

    // Keep session refreshed
    req.session.user._id = user._id.toString();
    req.session.user.role = user.role;
    res.locals.currentUser = req.session.user;
    return next();
  } catch (err) {
    console.error('Session validation error in authMiddleware:', err);
    return next();
  }
};

/**
 * Middleware: Require ADMIN role.
 * Must be used AFTER isAuthenticated.
 */
const isAdmin = (req, res, next) => {
  if (req.session.user && req.session.user.role === roles.ADMIN) {
    return next();
  }
  req.flash('error', 'Access denied. Admin privileges required.');
  return res.redirect('/dashboard');
};

/**
 * Middleware: Require MEMBER role.
 * Must be used AFTER isAuthenticated.
 */
const isMember = (req, res, next) => {
  if (req.session.user && req.session.user.role === roles.MEMBER) {
    return next();
  }
  req.flash('error', 'Access denied.');
  return res.redirect('/admin');
};

/**
 * Middleware: Redirect already-authenticated users away from login/register.
 */
const redirectIfAuthenticated = (req, res, next) => {
  if (req.session && req.session.user) {
    return req.session.user.role === roles.ADMIN
      ? res.redirect('/admin')
      : res.redirect('/dashboard');
  }
  next();
};

module.exports = {
  isAuthenticated,
  isAdmin,
  isMember,
  redirectIfAuthenticated,
};
