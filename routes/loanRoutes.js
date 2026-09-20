const express = require('express');
const router = express.Router();
const loanController = require('../controllers/loanController');
const { isAuthenticated, isMember } = require('../middleware/authMiddleware');
const { validateObjectId } = require('../middleware/validationMiddleware');

// Member book request routes
router.post('/books/:id/request', isAuthenticated, isMember, validateObjectId, loanController.requestBook);
router.post('/books/:id/borrow', isAuthenticated, isMember, validateObjectId, loanController.requestBook);

// SECURITY: Member cannot return loans!
// Any direct attempt to POST /loans/:id/return is blocked unless caller is an admin
router.post('/loans/:id/return', isAuthenticated, (req, res, next) => {
  if (req.session.user && req.session.user.role === 'ADMIN') {
    return loanController.adminReturnBook(req, res, next);
  }
  if (req.xhr || req.headers.accept?.includes('application/json')) {
    return res.status(403).json({ error: 'Members cannot return books directly. Please return the physical book to the librarian.' });
  }
  return res.status(403).render('errors/403', {
    title: 'Access Forbidden - 403',
    message: 'Members cannot return books directly from their account. Please return the physical book to the librarian at the circulation desk.'
  });
});

// Member read-only views
router.get('/loans', isAuthenticated, isMember, loanController.getMyLoans);
router.get('/my-loans', isAuthenticated, isMember, loanController.getMyLoans);
router.get('/history', isAuthenticated, isMember, loanController.getHistory);

module.exports = router;
