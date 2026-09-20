const User = require('../models/User');
const Loan = require('../models/Loan');
const dashboardService = require('../services/dashboardService');
const loanService = require('../services/loanService');
const config = require('../config/config');
const { sanitizeSearch } = require('../utils/validators');

/**
 * GET /admin — Admin dashboard.
 */
const getDashboard = async (req, res) => {
  try {
    const [stats, mostBorrowed, categoryDist, monthlyActivity, mostActive] = await Promise.all([
      dashboardService.getAdminStats(),
      dashboardService.getMostBorrowedBooks(5),
      dashboardService.getCategoryDistribution(),
      dashboardService.getMonthlyActivity(),
      dashboardService.getMostActiveMembers(5),
    ]);

    res.render('admin/dashboard', {
      title: 'Admin Dashboard | Library Management System',
      stats,
      mostBorrowed,
      categoryDist,
      monthlyActivity,
      mostActive,
      helpers: require('../utils/helpers'),
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    req.flash('error', 'Failed to load dashboard.');
    res.redirect('/');
  }
};

/**
 * GET /admin/members — Member management.
 */
const getMembers = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = config.adminPageSize;
    const skip = (page - 1) * limit;

    const query = { role: config.roles.MEMBER };
    const { search, status } = req.query;

    if (search) {
      const sanitized = sanitizeSearch(search);
      query.$or = [
        { fullName: { $regex: sanitized, $options: 'i' } },
        { email: { $regex: sanitized, $options: 'i' } },
      ];
    }

    if (status === 'active') query.isActive = true;
    if (status === 'inactive') query.isActive = false;

    const [members, total] = await Promise.all([
      User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      User.countDocuments(query),
    ]);

    // Get active loan counts for each member
    for (const member of members) {
      member.activeLoans = await Loan.countDocuments({
        member: member._id,
        status: { $in: [config.loanStatuses.ISSUED, config.loanStatuses.OVERDUE] },
      });
    }

    res.render('admin/members', {
      title: 'Member Management | Library Management System',
      members,
      filters: { search, status },
      pagination: { page, totalPages: Math.ceil(total / limit), total },
      helpers: require('../utils/helpers'),
    });
  } catch (error) {
    console.error('Error fetching members:', error);
    req.flash('error', 'Failed to load members.');
    res.redirect('/admin');
  }
};

/**
 * GET /admin/members/:id — Member detail view.
 */
const getMemberDetail = async (req, res) => {
  try {
    const member = await User.findById(req.params.id).lean();
    if (!member) {
      req.flash('error', 'Member not found.');
      return res.redirect('/admin/members');
    }

    const [activeLoans, history] = await Promise.all([
      loanService.getActiveLoans(member._id),
      loanService.getLoanHistory(member._id, 1, 20),
    ]);

    res.render('admin/memberDetail', {
      title: `${member.fullName} | Library Management System`,
      member,
      activeLoans,
      history: history.loans,
      helpers: require('../utils/helpers'),
    });
  } catch (error) {
    console.error('Error fetching member detail:', error);
    req.flash('error', 'Failed to load member details.');
    res.redirect('/admin/members');
  }
};

module.exports = {
  getDashboard,
  getMembers,
  getMemberDetail,
};
