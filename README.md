# 📚 Library Management & Book Lending System

A modern, production-quality web application for managing books, library members, book lending, returns, overdue tracking, fines, and library analytics.

Built with **Node.js**, **Express.js**, **EJS**, and **MongoDB Atlas**.

---

## ✨ Features

### Member Features
- Register & login with secure session-based authentication
- Browse, search, filter, and sort the book catalogue
- View detailed book information with availability status
- Borrow available books with one click
- View active loans with due dates
- Return books with automatic fine calculation
- View borrowing history
- Track overdue books and accumulated fines
- Manage profile

### Admin Features
- Professional admin dashboard with analytics
- Full book CRUD (create, edit, soft-delete)
- Member management with borrowing details
- Loan management with status tabs and return processing
- Visual analytics: most-borrowed books, category distribution, monthly trends
- Charts powered by Chart.js

### System Features
- Role-based access control (MEMBER / ADMIN)
- Atomic database transactions for lending operations
- Configurable borrowing limits, loan duration, and fine rates
- Duplicate borrowing prevention
- Zero-stock protection
- Automatic overdue detection and fine calculation (₹ per day)
- Pagination across all list views
- Dark mode with localStorage persistence
- Responsive design (desktop, tablet, mobile)
- Modern toast notifications and confirmation modals
- Input validation (client + server)
- Rate limiting on auth routes
- Security headers via Helmet

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | EJS, HTML5, CSS3, JavaScript |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas, Mongoose ODM |
| Auth | express-session + connect-mongo |
| Security | bcryptjs, helmet, express-rate-limit |
| Charts | Chart.js (CDN) |

---

## 📁 Project Structure

```
library-management-system/
├── app.js                 # Express application setup
├── server.js              # Entry point
├── package.json
├── .env.example
├── .gitignore
├── config/
│   ├── config.js          # Centralized configuration
│   └── db.js              # MongoDB connection
├── models/
│   ├── User.js
│   ├── Book.js
│   └── Loan.js
├── controllers/
│   ├── authController.js
│   ├── bookController.js
│   ├── loanController.js
│   ├── memberController.js
│   └── adminController.js
├── services/
│   ├── loanService.js     # Lending business logic
│   ├── fineService.js     # Fine queries
│   └── dashboardService.js # Analytics aggregations
├── routes/
│   ├── authRoutes.js
│   ├── bookRoutes.js
│   ├── loanRoutes.js
│   ├── memberRoutes.js
│   └── adminRoutes.js
├── middleware/
│   ├── authMiddleware.js
│   ├── errorMiddleware.js
│   └── validationMiddleware.js
├── utils/
│   ├── fineCalculator.js
│   ├── validators.js
│   └── helpers.js
├── views/
│   ├── layouts/main.ejs        # Master layout with head, navbar, flash & footer
│   ├── partials/               # Modular UI partials
│   │   ├── head.ejs            # SEO, typography, & design tokens
│   │   ├── navbar.ejs          # Sticky glass navbar with SVG icons & drawer
│   │   ├── footer.ejs          # Multi-column SaaS footer
│   │   ├── flash-messages.ejs  # Toast notifications with inline SVGs
│   │   ├── pagination.ejs      # Accessible pagination with query preservation
│   │   └── book-card.ejs       # High-polish book card with availability badges
│   ├── auth/ (login, register)
│   ├── member/ (dashboard, loans, history, profile)
│   ├── books/ (catalogue, details)
│   ├── admin/ (dashboard, books, bookForm, members, memberDetail, loans)
│   └── errors/ (404, 500)
├── public/
│   ├── css/
│   │   └── styles.css          # Unified stylesheet with centralized tokens
│   └── js/
│       ├── main.js             # Theme toggle, mobile drawer, dropdowns, modals
│       ├── dashboard.js        # Chart.js visualizations
│       └── forms.js            # Client-side input validation

---

## 🎨 UI/UX Design System & Customization

The front-end design uses a modern, calm, SaaS-grade visual design system built on vanilla CSS custom properties (design tokens).

### How to Change Brand Colors in One Place
All colors, surfaces, fonts, and radii are centralized at the top of [`public/css/styles.css`](file:///Users/sagarkumar_07/Desktop/Assignement%2002/public/css/styles.css) inside `:root` and `[data-theme="dark"]`.

To change your brand color, modify these CSS variables:
```css
:root {
  /* Change primary brand hue */
  --primary: #4F46E5;        /* Brand main (e.g., Violet #7C3AED or Emerald #059669) */
  --primary-hover: #4338CA;  /* Slightly darker for hover state */
  --primary-soft: #EEF2FF;   /* 10% tint for soft badges and active pills */
  --accent: #06B6D4;         /* Secondary highlight / links */

  /* Brand gradient used on hero, primary buttons, and logo badge */
  --hero-gradient: linear-gradient(135deg, var(--primary) 0%, #7C3AED 55%, var(--accent) 100%);
}

[data-theme="dark"] {
  --primary: #818CF8;        /* Lighter tint for dark mode contrast */
  --primary-hover: #6366F1;
  --primary-soft: rgba(129, 140, 248, 0.14);
}
```
No other file needs to be modified — all buttons, links, active navigation pills, badges, and focus rings automatically inherit from these variables!

├── seeds/seed.js
└── tests/unit.test.js
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18+ ([download](https://nodejs.org/))
- **MongoDB Atlas** account ([sign up](https://www.mongodb.com/atlas))
- **Git** installed

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd library-management-system
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/library-management?retryWrites=true&w=majority
SESSION_SECRET=your_secure_random_string_here
NODE_ENV=development
LOAN_DURATION_DAYS=14
MAX_ACTIVE_LOANS=5
DAILY_FINE_RATE=5
```

### 3. MongoDB Atlas Setup

1. Create a free cluster at [MongoDB Atlas](https://cloud.mongodb.com)
2. Create a database user with read/write access
3. Whitelist your IP (or 0.0.0.0/0 for development)
4. Copy the connection string into `MONGODB_URI`

### 4. Seed the Database

```bash
npm run seed
```

This creates demo data: 1 admin, 5 members, 20 books, and sample loans.

### 5. Run Locally

```bash
npm run dev
```

Open [http://localhost:5000](http://localhost:5000)

---

## 🔑 Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@example.com | Admin@123 |
| Member | john@example.com | Member@123 |
| Member | priya@example.com | Member@123 |

> ⚠️ **Change these credentials before any real deployment.**

---

## 🧪 Running Tests

```bash
npm test
```

Tests cover:
- Fine calculation logic (overdue, on-time, edge cases)
- Validator utilities (ObjectId, email, search sanitization)
- Helper functions (date formatting, currency, truncation)
- Configuration integrity

---

## 📊 Fine Calculation

Fine rules (configurable via `.env`):

| Scenario | Fine |
|----------|------|
| Returned on or before due date | ₹0 |
| Returned 1 day late | ₹5 |
| Returned N days late | ₹(N × DAILY_FINE_RATE) |

Fine is never negative. Fine rate defaults to ₹5/day.

---

## 🔒 Security

- Passwords hashed with bcrypt (12 rounds)
- Session-based auth stored in MongoDB
- Secure, httpOnly cookies
- CSRF-safe (POST for mutations)
- Helmet security headers
- Rate limiting on login (10 attempts / 15 min)
- Input validation (express-validator)
- MongoDB injection prevention (Mongoose)
- XSS protection via EJS escaping
- No secrets in source code

---

## 🌐 Deployment (Render)

1. Push to GitHub
2. Create a new **Web Service** on [Render](https://render.com)
3. Connect your repo
4. Set environment:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Node Version**: 18+
5. Add environment variables (same as `.env`)
6. Set `NODE_ENV=production`
7. Ensure MongoDB Atlas allows Render's IP

---

## 🏗️ Architecture Decisions

| Decision | Rationale |
|----------|-----------|
| **Session auth** over JWT | More natural for server-rendered EJS; sessions stored in MongoDB for persistence |
| **Fine embedded in Loan** | Avoids a separate Fine model; fineAmount + fineStatus on Loan keeps queries simple |
| **Soft deletion** for books | `isActive=false` instead of hard delete — preserves loan history integrity |
| **Dynamic overdue detection** | Calculated at query time rather than via cron — simpler, always accurate |
| **Atomic transactions** | `issueBook` and `returnBook` use MongoDB sessions for consistency |

---

## 🔮 Future Improvements

- [ ] Email notifications for due dates
- [ ] Password reset via email
- [ ] Book reservation/waitlist system
- [ ] File upload for book covers
- [ ] Fine payment integration
- [ ] Advanced reporting with date ranges
- [ ] Bulk book import via CSV
- [ ] WebSocket real-time notifications
- [ ] Two-factor authentication
- [ ] API endpoints for mobile app

---

## 📄 License

ISC — Built for academic demonstration and portfolio use.
# Library_management_Assign_02
