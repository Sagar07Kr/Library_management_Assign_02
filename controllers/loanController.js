const loanService = require('../services/loanService');
const { calculateFine } = require('../utils/fineCalculator');
const config = require('../config/config');

/**
 * POST /books/:id/request — Member requests a book.
 * Creates a PENDING request waiting for librarian approval.
 */
const requestBook = async (req, res) => {
  try {
    await loanService.requestBook(req.session.user._id, req.params.id);
    req.flash('success', 'Book requested successfully! The librarian will review your request at the circulation desk.');
    res.redirect('/my-loans');
  } catch (error) {
    console.error('Request book error:', error);
    req.flash('error', error.message || 'Failed to submit borrow request.');
    res.redirect(`/books/${req.params.id}`);
  }
};

/**
 * POST /books/:id/borrow — Backwards compatibility alias for requestBook.
 */
const borrowBook = async (req, res) => {
  return requestBook(req, res);
};

/**
 * POST /loans/:id/return — Blocked for member direct execution.
 */
const returnBook = async (req, res) => {
  req.flash('error', 'Members cannot return books directly from their account. Please return the physical book to the librarian at the circulation desk.');
  return res.status(403).redirect('/my-loans');
};

/**
 * GET /loans or GET /my-loans — Member's active borrowed books & pending requests.
 * Completely read-only for members.
 */
const getMyLoans = async (req, res) => {
  try {
    const [loans, pendingRequests] = await Promise.all([
      loanService.getActiveLoans(req.session.user._id),
      loanService.getMemberRequests(req.session.user._id),
    ]);

    res.render('member/loans', {
      title: 'My Borrowed Books | Library Management System',
      loans,
      pendingRequests,
      helpers: require('../utils/helpers'),
    });
  } catch (error) {
    console.error('Error fetching member loans:', error);
    req.flash('error', 'Failed to load your borrowed books.');
    res.redirect('/dashboard');
  }
};

/**
 * GET /history — Member's borrowing history (RETURNED, CANCELLED, REJECTED).
 */
const getHistory = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const result = await loanService.getLoanHistory(req.session.user._id, page, 10);

    res.render('member/history', {
      title: 'Borrowing History | Library Management System',
      loans: result.loans,
      pagination: { page: result.page, totalPages: result.totalPages, total: result.total },
      helpers: require('../utils/helpers'),
    });
  } catch (error) {
    console.error('Error fetching history:', error);
    req.flash('error', 'Failed to load borrowing history.');
    res.redirect('/dashboard');
  }
};

/**
 * GET /admin/requests — Librarian pending borrow requests queue.
 */
const getAdminRequests = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const result = await loanService.getPendingRequests(page, config.adminPageSize);

    res.render('admin/requests', {
      title: 'Pending Book Requests | Library Management System',
      requests: result.requests,
      pagination: { page: result.page, totalPages: result.totalPages, total: result.total },
      helpers: require('../utils/helpers'),
    });
  } catch (error) {
    console.error('Error fetching admin requests:', error);
    req.flash('error', 'Failed to load pending requests.');
    res.redirect('/admin');
  }
};

/**
 * POST /admin/requests/:id/approve — Librarian approves and officially issues book.
 */
const approveRequest = async (req, res) => {
  try {
    await loanService.approveAndIssueRequest(req.params.id, req.session.user._id);
    req.flash('success', `Request approved! Book officially issued to member with a ${config.loanDurationDays}-day lending period.`);
    res.redirect('/admin/requests');
  } catch (error) {
    console.error('Approve request error:', error);
    req.flash('error', error.message || 'Failed to approve borrow request.');
    res.redirect('/admin/requests');
  }
};

/**
 * POST /admin/requests/:id/reject — Librarian rejects borrow request.
 */
const rejectRequest = async (req, res) => {
  try {
    const { reason } = req.body;
    await loanService.rejectRequest(req.params.id, req.session.user._id, reason);
    req.flash('info', 'Borrow request has been rejected.');
    res.redirect('/admin/requests');
  } catch (error) {
    console.error('Reject request error:', error);
    req.flash('error', error.message || 'Failed to reject borrow request.');
    res.redirect('/admin/requests');
  }
};

/**
 * GET /admin/loans — Librarian loan management and circulation list.
 */
const getAdminLoans = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const { status, member } = req.query;
    const result = await loanService.getAllLoans({ status, member }, page, config.adminPageSize);

    res.render('admin/loans', {
      title: 'Loan Management | Library Management System',
      loans: result.loans,
      filters: { status: status || 'ALL', member },
      pagination: { page: result.page, totalPages: result.totalPages, total: result.total },
      helpers: require('../utils/helpers'),
    });
  } catch (error) {
    console.error('Error fetching admin loans:', error);
    req.flash('error', 'Failed to load loans.');
    res.redirect('/admin');
  }
};

/**
 * POST /admin/loans/:id/return — Librarian processes physical return.
 */
const adminReturnBook = async (req, res) => {
  try {
    const result = await loanService.returnBook(req.params.id, req.session.user._id);

    if (result.fineAmount > 0) {
      req.flash('warning', `Return processed! Book returned with an overdue fine of ₹${result.fineAmount} (${result.daysOverdue} day${result.daysOverdue > 1 ? 's' : ''} late).`);
    } else {
      req.flash('success', 'Book return processed successfully. Inventory updated.');
    }
    res.redirect('/admin/loans');
  } catch (error) {
    console.error('Admin return error:', error);
    req.flash('error', error.message || 'Failed to process return.');
    res.redirect('/admin/loans');
  }
};

module.exports = {
  requestBook,
  borrowBook,
  returnBook,
  getMyLoans,
  getHistory,
  getAdminRequests,
  approveRequest,
  rejectRequest,
  getAdminLoans,
  adminReturnBook,
};
