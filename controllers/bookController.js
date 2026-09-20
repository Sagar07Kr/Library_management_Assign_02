const { validationResult } = require('express-validator');
const Book = require('../models/Book');
const Loan = require('../models/Loan');
const config = require('../config/config');
const { sanitizeSearch } = require('../utils/validators');
const { getPlaceholderCover } = require('../utils/helpers');
const loanService = require('../services/loanService');

/**
 * GET /books — Public book catalogue with search, filter, sort, pagination.
 */
const getAllBooks = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = config.defaultPageSize;
    const skip = (page - 1) * limit;

    // Build query
    const query = { isActive: true };
    const search = req.query.search || req.query.q;
    const { category, availability, sort: sortParam } = req.query;

    // Search by title or author (partial match)
    if (search) {
      const sanitized = sanitizeSearch(search);
      query.$or = [
        { title: { $regex: sanitized, $options: 'i' } },
        { author: { $regex: sanitized, $options: 'i' } },
      ];
    }

    // Filter by category
    if (category && category !== 'all') {
      query.category = category;
    }

    // Filter by availability
    if (availability === 'available') {
      query.availableCopies = { $gt: 0 };
    } else if (availability === 'unavailable') {
      query.availableCopies = 0;
    }

    // Sort options
    let sortQuery = { createdAt: -1 }; // Default: newest
    switch (sortParam) {
      case 'title_asc': sortQuery = { title: 1 }; break;
      case 'title_desc': sortQuery = { title: -1 }; break;
      case 'author_asc': sortQuery = { author: 1 }; break;
      case 'author_desc': sortQuery = { author: -1 }; break;
      case 'availability': sortQuery = { availableCopies: -1 }; break;
      case 'newest': sortQuery = { createdAt: -1 }; break;
      case 'oldest': sortQuery = { createdAt: 1 }; break;
    }

    const [books, total] = await Promise.all([
      Book.find(query).sort(sortQuery).skip(skip).limit(limit).lean(),
      Book.countDocuments(query),
    ]);

    // Add placeholder covers for books without images
    books.forEach((book) => {
      if (!book.coverImage) {
        book.coverImage = getPlaceholderCover(book.title);
      }
    });

    const totalPages = Math.ceil(total / limit);

    res.render('books/catalogue', {
      title: 'Browse Books | Library Management System',
      books,
      filters: { search, category, availability, sort: sortParam },
      categories: config.bookCategories,
      pagination: { page, totalPages, total },
    });
  } catch (error) {
    console.error('Error fetching books:', error);
    req.flash('error', 'Failed to load books. Please try again.');
    res.redirect('/');
  }
};

/**
 * GET /books/:id — Book details page.
 */
const getBookById = async (req, res) => {
  try {
    const book = await Book.findOne({ _id: req.params.id, isActive: true }).lean();
    if (!book) {
      return res.status(404).render('errors/404', {
        title: 'Book Not Found | Library Management System',
      });
    }

    if (!book.coverImage) {
      book.coverImage = getPlaceholderCover(book.title);
    }

    // Check borrowing eligibility if user is logged in
    let borrowingEligibility = null;
    if (req.session.user && req.session.user.role === config.roles.MEMBER) {
      borrowingEligibility = await loanService.checkBorrowingEligibility(
        req.session.user._id,
        book._id
      );
    }

    // Fetch related books in the same category
    const relatedBooks = await Book.find({
      category: book.category,
      _id: { $ne: book._id },
      isActive: true,
    })
      .limit(4)
      .lean();

    relatedBooks.forEach((b) => {
      if (!b.coverImage) b.coverImage = getPlaceholderCover(b.title);
    });

    res.render('books/details', {
      title: `${book.title} | Library Management System`,
      book,
      borrowingEligibility,
      relatedBooks,
    });
  } catch (error) {
    console.error('Error fetching book:', error);
    req.flash('error', 'Failed to load book details.');
    res.redirect('/books');
  }
};

/**
 * GET /admin/books — Admin book management page.
 */
const getAdminBooks = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = config.adminPageSize;
    const skip = (page - 1) * limit;

    const query = {};
    const { search, category, status } = req.query;

    if (search) {
      const sanitized = sanitizeSearch(search);
      query.$or = [
        { title: { $regex: sanitized, $options: 'i' } },
        { author: { $regex: sanitized, $options: 'i' } },
        { isbn: { $regex: sanitized, $options: 'i' } },
      ];
    }

    if (category && category !== 'all') {
      query.category = category;
    }

    if (status === 'active') query.isActive = true;
    if (status === 'inactive') query.isActive = false;

    const [books, total] = await Promise.all([
      Book.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Book.countDocuments(query),
    ]);

    books.forEach((book) => {
      if (!book.coverImage) book.coverImage = getPlaceholderCover(book.title);
    });

    res.render('admin/books', {
      title: 'Book Management | Library Management System',
      books,
      filters: { search, category, status },
      categories: config.bookCategories,
      pagination: { page, totalPages: Math.ceil(total / limit), total },
    });
  } catch (error) {
    console.error('Error fetching admin books:', error);
    req.flash('error', 'Failed to load books.');
    res.redirect('/admin');
  }
};

/**
 * GET /admin/books/create — Add book form.
 */
const getCreateBook = (req, res) => {
  res.render('admin/bookForm', {
    title: 'Add Book | Library Management System',
    book: null,
    categories: config.bookCategories,
    isEdit: false,
    values: {},
    errors: [],
  });
};

/**
 * POST /admin/books — Create a new book.
 */
const postCreateBook = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.render('admin/bookForm', {
        title: 'Add Book | Library Management System',
        book: null,
        categories: config.bookCategories,
        isEdit: false,
        values: req.body,
        errors: errors.array(),
      });
    }

    const { title, author, isbn, category, description, publisher, publicationYear, coverImage, totalCopies } = req.body;

    const book = await Book.create({
      title,
      author,
      isbn,
      category,
      description: description || '',
      publisher: publisher || '',
      publicationYear: publicationYear || null,
      coverImage: coverImage || '',
      totalCopies: parseInt(totalCopies, 10),
      availableCopies: parseInt(totalCopies, 10), // New book: all copies available
    });

    req.flash('success', `"${book.title}" has been added to the catalogue.`);
    res.redirect('/admin/books');
  } catch (error) {
    if (error.code === 11000) {
      return res.render('admin/bookForm', {
        title: 'Add Book | Library Management System',
        book: null,
        categories: config.bookCategories,
        isEdit: false,
        values: req.body,
        errors: [{ msg: 'A book with this ISBN already exists.' }],
      });
    }
    console.error('Error creating book:', error);
    req.flash('error', 'Failed to create book. Please try again.');
    res.redirect('/admin/books/create');
  }
};

/**
 * GET /admin/books/:id/edit — Edit book form.
 */
const getEditBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id).lean();
    if (!book) {
      req.flash('error', 'Book not found.');
      return res.redirect('/admin/books');
    }

    res.render('admin/bookForm', {
      title: `Edit ${book.title} | Library Management System`,
      book,
      categories: config.bookCategories,
      isEdit: true,
      values: book,
      errors: [],
    });
  } catch (error) {
    console.error('Error loading edit form:', error);
    req.flash('error', 'Failed to load book for editing.');
    res.redirect('/admin/books');
  }
};

/**
 * POST /admin/books/:id/update — Update a book.
 */
const postUpdateBook = async (req, res) => {
  try {
    const errors = validationResult(req);
    const book = await Book.findById(req.params.id);
    if (!book) {
      req.flash('error', 'Book not found.');
      return res.redirect('/admin/books');
    }

    if (!errors.isEmpty()) {
      return res.render('admin/bookForm', {
        title: `Edit ${book.title} | Library Management System`,
        book: book.toObject(),
        categories: config.bookCategories,
        isEdit: true,
        values: req.body,
        errors: errors.array(),
      });
    }

    const newTotalCopies = parseInt(req.body.totalCopies, 10);
    const oldTotalCopies = book.totalCopies;
    const issuedCopies = oldTotalCopies - book.availableCopies;

    // Prevent reducing below currently issued copies
    if (newTotalCopies < issuedCopies) {
      return res.render('admin/bookForm', {
        title: `Edit ${book.title} | Library Management System`,
        book: book.toObject(),
        categories: config.bookCategories,
        isEdit: true,
        values: req.body,
        errors: [{ msg: `Cannot reduce total copies below ${issuedCopies} (currently issued). Return books first.` }],
      });
    }

    // Calculate new available copies
    const newAvailableCopies = book.availableCopies + (newTotalCopies - oldTotalCopies);

    book.title = req.body.title;
    book.author = req.body.author;
    book.isbn = req.body.isbn;
    book.category = req.body.category;
    book.description = req.body.description || '';
    book.publisher = req.body.publisher || '';
    book.publicationYear = req.body.publicationYear || null;
    book.coverImage = req.body.coverImage || '';
    book.totalCopies = newTotalCopies;
    book.availableCopies = Math.max(0, Math.min(newAvailableCopies, newTotalCopies));

    await book.save();

    req.flash('success', `"${book.title}" has been updated.`);
    res.redirect('/admin/books');
  } catch (error) {
    if (error.code === 11000) {
      req.flash('error', 'A book with this ISBN already exists.');
      return res.redirect(`/admin/books/${req.params.id}/edit`);
    }
    console.error('Error updating book:', error);
    req.flash('error', 'Failed to update book.');
    res.redirect('/admin/books');
  }
};

/**
 * POST /admin/books/:id/delete — Soft-delete a book.
 */
const postDeleteBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      req.flash('error', 'Book not found.');
      return res.redirect('/admin/books');
    }

    // Check for active loans
    const activeLoans = await Loan.countDocuments({
      book: book._id,
      status: { $in: [config.loanStatuses.ISSUED, config.loanStatuses.OVERDUE] },
    });

    if (activeLoans > 0) {
      req.flash('error', `"${book.title}" cannot be deleted because it currently has ${activeLoans} active loan(s). Return all copies first.`);
      return res.redirect('/admin/books');
    }

    // Soft delete
    book.isActive = false;
    await book.save();

    req.flash('success', `"${book.title}" has been removed from the catalogue.`);
    res.redirect('/admin/books');
  } catch (error) {
    console.error('Error deleting book:', error);
    req.flash('error', 'Failed to delete book.');
    res.redirect('/admin/books');
  }
};

module.exports = {
  getAllBooks,
  getBookById,
  getAdminBooks,
  getCreateBook,
  postCreateBook,
  getEditBook,
  postUpdateBook,
  postDeleteBook,
};
