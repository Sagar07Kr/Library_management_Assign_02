const User = require('../models/User');
const dashboardService = require('../services/dashboardService');
const loanService = require('../services/loanService');
const fineService = require('../services/fineService');
const { getGreeting } = require('../utils/helpers');
const { validationResult } = require('express-validator');

/**
 * GET /dashboard — Member dashboard.
 */
const getDashboard = async (req, res) => {
  try {
    const memberId = req.session.user._id;

    const [stats, activeLoans, popularBooks] = await Promise.all([
      dashboardService.getMemberStats(memberId),
      loanService.getActiveLoans(memberId),
      dashboardService.getPopularBooks(4),
    ]);

    // Get upcoming due dates (next 7 days)
    const upcomingDue = activeLoans.filter((loan) => {
      const daysUntilDue = Math.ceil((new Date(loan.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
      return daysUntilDue >= 0 && daysUntilDue <= 7;
    });

    res.render('member/dashboard', {
      title: 'Dashboard | Library Management System',
      greeting: getGreeting(),
      stats,
      activeLoans: activeLoans.slice(0, 5),
      upcomingDue,
      popularBooks,
      helpers: require('../utils/helpers'),
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    req.flash('error', 'Failed to load dashboard.');
    res.redirect('/books');
  }
};

/**
 * GET /profile — Member profile page.
 */
const getProfile = async (req, res) => {
  try {
    let user = await User.findById(req.session.user._id).lean();
    if (!user && req.session.user.email) {
      user = await User.findOne({ email: req.session.user.email }).lean();
      if (user) {
        req.session.user._id = user._id.toString();
        req.session.user.fullName = user.fullName;
        req.session.user.role = user.role;
      }
    }

    if (!user) {
      req.session.destroy(() => {
        res.redirect('/login');
      });
      return;
    }

    const fines = await fineService.getMemberFines(user._id);

    res.render('member/profile', {
      title: 'My Profile | Library Management System',
      user,
      fines,
      helpers: require('../utils/helpers'),
      errors: [],
    });
  } catch (error) {
    console.error('Profile error:', error);
    req.flash('error', 'Failed to load profile.');
    res.redirect('/dashboard');
  }
};

/**
 * POST /profile — Update member profile.
 */
const updateProfile = async (req, res) => {
  try {
    let user = await User.findById(req.session.user._id);
    if (!user && req.session.user.email) {
      user = await User.findOne({ email: req.session.user.email });
      if (user) {
        req.session.user._id = user._id.toString();
      }
    }

    if (!user) {
      req.session.destroy(() => {
        res.redirect('/login');
      });
      return;
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const fines = await fineService.getMemberFines(user._id);
      return res.render('member/profile', {
        title: 'My Profile | Library Management System',
        user: user.toObject ? user.toObject() : user,
        fines,
        helpers: require('../utils/helpers'),
        errors: errors.array(),
      });
    }

    const { fullName, phone, profileImage } = req.body;

    user.fullName = fullName;
    user.phone = phone || '';
    user.profileImage = profileImage || '';
    await user.save();

    // Update session
    req.session.user._id = user._id.toString();
    req.session.user.fullName = user.fullName;
    req.session.user.phone = user.phone;
    req.session.user.profileImage = user.profileImage;

    req.flash('success', 'Profile updated successfully.');
    res.redirect('/profile');
  } catch (error) {
    console.error('Profile update error:', error);
    req.flash('error', 'Failed to update profile.');
    res.redirect('/profile');
  }
};

module.exports = {
  getDashboard,
  getProfile,
  updateProfile,
};
