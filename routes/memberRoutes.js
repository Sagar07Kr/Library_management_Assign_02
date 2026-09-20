const express = require('express');
const router = express.Router();
const memberController = require('../controllers/memberController');
const { isAuthenticated, isMember } = require('../middleware/authMiddleware');
const { validateProfile } = require('../middleware/validationMiddleware');

router.get('/dashboard', isAuthenticated, isMember, memberController.getDashboard);
router.get('/profile', isAuthenticated, memberController.getProfile);
router.post('/profile', isAuthenticated, validateProfile, memberController.updateProfile);

module.exports = router;
