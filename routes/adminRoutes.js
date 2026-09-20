const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const loanController = require('../controllers/loanController');
const { isAuthenticated, isAdmin } = require('../middleware/authMiddleware');
const { validateObjectId } = require('../middleware/validationMiddleware');

// All admin routes require authentication + admin role
router.use(isAuthenticated, isAdmin);

// Admin dashboard & member management
router.get('/', adminController.getDashboard);
router.get('/members', adminController.getMembers);
router.get('/members/:id', validateObjectId, adminController.getMemberDetail);

// Request queue management (Librarian approves / rejects)
router.get('/requests', loanController.getAdminRequests);
router.post('/requests/:id/approve', validateObjectId, loanController.approveRequest);
router.post('/requests/:id/reject', validateObjectId, loanController.rejectRequest);

// Loan circulation & physical returns
router.get('/loans', loanController.getAdminLoans);
router.post('/loans/:id/return', validateObjectId, loanController.adminReturnBook);

module.exports = router;
