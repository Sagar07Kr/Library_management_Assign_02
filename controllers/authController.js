const { validationResult } = require('express-validator');
const User = require('../models/User');
const { roles } = require('../config/config');

/**
 * GET /login — Render login page.
 */
const getLogin = (req, res) => {
  res.render('auth/login', {
    title: 'Login | Library Management System',
    values: {},
    errors: [],
  });
};

/**
 * POST /login — Authenticate user.
 */
const postLogin = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.render('auth/login', {
        title: 'Login | Library Management System',
        values: req.body,
        errors: errors.array(),
      });
    }

    const { email, password } = req.body;

    // Find user by email (include password for comparison)
    const user = await User.findOne({ email, isActive: true }).select('+password');
    if (!user) {
      return res.render('auth/login', {
        title: 'Login | Library Management System',
        values: req.body,
        errors: [{ msg: 'Invalid email or password' }],
      });
    }

    // Compare password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.render('auth/login', {
        title: 'Login | Library Management System',
        values: req.body,
        errors: [{ msg: 'Invalid email or password' }],
      });
    }

    // Set session
    req.session.user = {
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      phone: user.phone,
      profileImage: user.profileImage,
    };

    req.flash('success', `Welcome back, ${user.fullName}!`);

    // Redirect based on role
    if (user.role === roles.ADMIN) {
      return res.redirect('/admin');
    }
    return res.redirect('/dashboard');
  } catch (error) {
    console.error('Login error:', error);
    req.flash('error', 'An error occurred during login. Please try again.');
    return res.redirect('/login');
  }
};

/**
 * GET /register — Render registration page.
 */
const getRegister = (req, res) => {
  res.render('auth/register', {
    title: 'Register | Library Management System',
    values: {},
    errors: [],
  });
};

/**
 * POST /register — Create new member account.
 */
const postRegister = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.render('auth/register', {
        title: 'Register | Library Management System',
        values: req.body,
        errors: errors.array(),
      });
    }

    const { fullName, email, password, phone } = req.body;

    // Check for existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.render('auth/register', {
        title: 'Register | Library Management System',
        values: req.body,
        errors: [{ msg: 'An account with this email already exists' }],
      });
    }

    // Create member account
    const user = await User.create({
      fullName,
      email,
      password,
      phone: phone || '',
      role: roles.MEMBER,
    });

    // Auto-login after registration
    req.session.user = {
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      phone: user.phone,
      profileImage: user.profileImage,
    };

    req.flash('success', 'Registration successful! Welcome to the library.');
    return res.redirect('/dashboard');
  } catch (error) {
    console.error('Registration error:', error);

    // Handle duplicate key error
    if (error.code === 11000) {
      return res.render('auth/register', {
        title: 'Register | Library Management System',
        values: req.body,
        errors: [{ msg: 'An account with this email already exists' }],
      });
    }

    req.flash('error', 'An error occurred during registration. Please try again.');
    return res.redirect('/register');
  }
};

const crypto = require('crypto');

/**
 * POST /logout — Destroy session and redirect.
 */
const logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
    }
    res.clearCookie('connect.sid');
    res.redirect('/');
  });
};

/**
 * GET /forgot-password — Render forgot password form
 */
const getForgotPassword = (req, res) => {
  res.render('auth/forgot-password', {
    title: 'Forgot Password | Library Management System',
    values: {},
    errors: [],
  });
};

/**
 * POST /forgot-password — Process forgot password request & generate reset token
 */
const postForgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.render('auth/forgot-password', {
        title: 'Forgot Password | Library Management System',
        values: { email },
        errors: [{ msg: 'Please enter your registered email address' }],
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim(), isActive: true });
    if (!user) {
      return res.render('auth/forgot-password', {
        title: 'Forgot Password | Library Management System',
        values: { email },
        errors: [{ msg: 'No active account found with that email address.' }],
      });
    }

    // Generate token valid for 1 hour
    const token = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save({ validateBeforeSave: false });

    req.flash('success', 'Password reset session initiated. Please choose your new password.');
    return res.redirect(`/reset-password/${token}`);
  } catch (error) {
    console.error('Forgot password error:', error);
    req.flash('error', 'An error occurred while processing your request. Please try again.');
    return res.redirect('/forgot-password');
  }
};

/**
 * GET /reset-password/:token — Render reset password form
 */
const getResetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      req.flash('error', 'Password reset link is invalid or has expired. Please request a new one.');
      return res.redirect('/forgot-password');
    }

    res.render('auth/reset-password', {
      title: 'Reset Password | Library Management System',
      token,
      errors: [],
    });
  } catch (error) {
    console.error('Get reset password error:', error);
    req.flash('error', 'An error occurred. Please try again.');
    res.redirect('/forgot-password');
  }
};

/**
 * POST /reset-password/:token — Save new password
 */
const postResetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;

    const errors = [];
    if (!password || password.length < 6) {
      errors.push({ msg: 'Password must be at least 6 characters long.' });
    }
    if (password !== confirmPassword) {
      errors.push({ msg: 'Passwords do not match.' });
    }

    if (errors.length > 0) {
      return res.render('auth/reset-password', {
        title: 'Reset Password | Library Management System',
        token,
        errors,
      });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      req.flash('error', 'Password reset link is invalid or has expired. Please request a new one.');
      return res.redirect('/forgot-password');
    }

    // Set new password (will be hashed by user pre-save hook)
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    req.flash('success', 'Your password has been successfully reset! Please sign in with your new password.');
    return res.redirect('/login');
  } catch (error) {
    console.error('Post reset password error:', error);
    req.flash('error', 'An error occurred while resetting your password. Please try again.');
    return res.redirect('/forgot-password');
  }
};

module.exports = {
  getLogin,
  postLogin,
  getRegister,
  postRegister,
  logout,
  getForgotPassword,
  postForgotPassword,
  getResetPassword,
  postResetPassword,
};
