const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/authController');
const { redirectIfAuthenticated } = require('../middleware/authMiddleware');
const { validateLogin, validateRegistration } = require('../middleware/validationMiddleware');

// Rate limit login attempts to prevent brute force
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 15 : 100, // relaxed in dev to avoid lockout
  message: 'Too many login attempts. Please try again after 15 minutes.',
  handler: (req, res) => {
    req.flash('error', 'Too many login attempts. Please try again after 15 minutes.');
    res.redirect('/login');
  },
});

router.get('/login', redirectIfAuthenticated, authController.getLogin);
router.post('/login', redirectIfAuthenticated, loginLimiter, validateLogin, authController.postLogin);

router.get('/register', redirectIfAuthenticated, authController.getRegister);
router.post('/register', redirectIfAuthenticated, validateRegistration, authController.postRegister);

// Password recovery routes
router.get('/forgot-password', redirectIfAuthenticated, authController.getForgotPassword);
router.post('/forgot-password', redirectIfAuthenticated, authController.postForgotPassword);

router.get('/reset-password/:token', redirectIfAuthenticated, authController.getResetPassword);
router.post('/reset-password/:token', redirectIfAuthenticated, authController.postResetPassword);

router.post('/logout', authController.logout);

module.exports = router;
