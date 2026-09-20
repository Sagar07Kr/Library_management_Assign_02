const express = require('express');
const path = require('path');
const session = require('express-session');
const mongoose = require('mongoose');
const MongoStore = require('connect-mongo');
const flash = require('connect-flash');
const helmet = require('helmet');
const morgan = require('morgan');
const methodOverride = require('method-override');
const expressLayouts = require('express-ejs-layouts');
const config = require('./config/config');

const app = express();

// Trust reverse proxy headers when deployed on Render / cloud PaaS
if (config.isProduction) {
  app.set('trust proxy', 1);
}

// --------------- Security Middleware ---------------
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      scriptSrcAttr: ["'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:", "http:"],
      connectSrc: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// --------------- Logging ---------------
if (!config.isProduction) {
  app.use(morgan('dev'));
}

// --------------- Body Parsing ---------------
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// --------------- Method Override (PUT/DELETE via POST) ---------------
app.use(methodOverride('_method'));

// --------------- Static Files ---------------
app.use(express.static(path.join(__dirname, 'public')));

// --------------- View Engine (EJS) ---------------
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layouts/main');
const helpersUtil = require('./utils/helpers');
app.locals.helpers = helpersUtil;
app.locals.h = helpersUtil;
app.locals.require = (mod) => {
  if (mod.includes('helpers')) return helpersUtil;
  return require(mod);
};



// --------------- Sessions ---------------
app.use(session({
  secret: config.sessionSecret,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: config.mongoUri,
    collectionName: 'sessions',
    ttl: 24 * 60 * 60, // 1 day
  }),
  cookie: {
    secure: config.isProduction,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 1 day
    sameSite: 'lax',
  },
}));

// --------------- Flash Messages ---------------
app.use(flash());

// --------------- Global Template Variables ---------------
app.use((req, res, next) => {
  // Make user session data available in all EJS templates
  res.locals.currentUser = req.session.user || null;
  res.locals.isAuthenticated = !!req.session.user;
  res.locals.isAdmin = req.session.user?.role === config.roles.ADMIN;

  // Flash messages
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  res.locals.warning = req.flash('warning');
  res.locals.info = req.flash('info');

  // Config values for views
  res.locals.config = {
    dailyFineRate: config.dailyFineRate,
    maxActiveLoans: config.maxActiveLoans,
    loanDurationDays: config.loanDurationDays,
    bookCategories: config.bookCategories,
  };

  next();
});

// --------------- Routes ---------------
const authRoutes = require('./routes/authRoutes');
const bookRoutes = require('./routes/bookRoutes');
const loanRoutes = require('./routes/loanRoutes');
const memberRoutes = require('./routes/memberRoutes');
const adminRoutes = require('./routes/adminRoutes');

// Landing page
app.get('/', (req, res) => {
  if (req.session.user) {
    return req.session.user.role === config.roles.ADMIN
      ? res.redirect('/admin')
      : res.redirect('/dashboard');
  }
  res.render('landing', {
    title: 'Library Management System',
    layout: false,
  });
});

app.use('/', authRoutes);
app.use('/', bookRoutes);
app.use('/', loanRoutes);
app.use('/', memberRoutes);
app.use('/admin', adminRoutes);

// --------------- Error Handling ---------------
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
app.use(notFound);
app.use(errorHandler);

module.exports = app;
