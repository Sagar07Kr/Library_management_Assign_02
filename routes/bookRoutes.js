const express = require('express');
const router = express.Router();
const bookController = require('../controllers/bookController');
const { isAuthenticated, isAdmin } = require('../middleware/authMiddleware');
const { validateBook, validateObjectId } = require('../middleware/validationMiddleware');

// ---- Public routes ----
router.get('/books', bookController.getAllBooks);
router.get('/books/:id', validateObjectId, bookController.getBookById);

// ---- Admin routes ----
router.get('/admin/books', isAuthenticated, isAdmin, bookController.getAdminBooks);
router.get('/admin/books/create', isAuthenticated, isAdmin, bookController.getCreateBook);
router.post('/admin/books', isAuthenticated, isAdmin, validateBook, bookController.postCreateBook);
router.get('/admin/books/:id/edit', isAuthenticated, isAdmin, validateObjectId, bookController.getEditBook);
router.post('/admin/books/:id/update', isAuthenticated, isAdmin, validateBook, bookController.postUpdateBook);
router.post('/admin/books/:id/delete', isAuthenticated, isAdmin, validateObjectId, bookController.postDeleteBook);

module.exports = router;
