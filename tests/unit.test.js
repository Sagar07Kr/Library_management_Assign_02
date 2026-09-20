const { calculateFine, isOverdue, formatFine } = require('../utils/fineCalculator');
const config = require('../config/config');

describe('Fine Calculator', () => {
  test('No fine when returned on time', () => {
    const dueDate = new Date('2026-10-20');
    const returnDate = new Date('2026-10-18');
    const { daysOverdue, fineAmount } = calculateFine(dueDate, returnDate);
    expect(daysOverdue).toBe(0);
    expect(fineAmount).toBe(0);
  });

  test('No fine when returned on due date', () => {
    const dueDate = new Date('2026-10-20T00:00:00');
    const returnDate = new Date('2026-10-20T00:00:00');
    const { daysOverdue, fineAmount } = calculateFine(dueDate, returnDate);
    expect(daysOverdue).toBe(0);
    expect(fineAmount).toBe(0);
  });

  test('Calculates fine for overdue return', () => {
    const dueDate = new Date('2026-10-10');
    const returnDate = new Date('2026-10-14');
    const { daysOverdue, fineAmount } = calculateFine(dueDate, returnDate);
    expect(daysOverdue).toBe(4);
    expect(fineAmount).toBe(4 * config.dailyFineRate);
  });

  test('Calculates fine for 1 day overdue', () => {
    const dueDate = new Date('2026-10-10T00:00:00');
    const returnDate = new Date('2026-10-11T00:00:00');
    const { daysOverdue, fineAmount } = calculateFine(dueDate, returnDate);
    expect(daysOverdue).toBe(1);
    expect(fineAmount).toBe(config.dailyFineRate);
  });

  test('Fine is never negative', () => {
    const dueDate = new Date('2026-10-20');
    const returnDate = new Date('2026-10-15');
    const { fineAmount } = calculateFine(dueDate, returnDate);
    expect(fineAmount).toBe(0);
  });

  test('isOverdue returns true for past due date', () => {
    const pastDue = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    expect(isOverdue(pastDue, null)).toBe(true);
  });

  test('isOverdue returns false for returned book', () => {
    const pastDue = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    const returnedAt = new Date();
    expect(isOverdue(pastDue, returnedAt)).toBe(false);
  });

  test('isOverdue returns false for future due date', () => {
    const futureDue = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
    expect(isOverdue(futureDue, null)).toBe(false);
  });

  test('formatFine formats correctly', () => {
    expect(formatFine(0)).toBe('₹0');
    expect(formatFine(25)).toBe('₹25');
    expect(formatFine(null)).toBe('₹0');
  });
});

describe('Validators', () => {
  const { isValidObjectId, sanitizeSearch, isValidEmail, isValidPassword } = require('../utils/validators');

  test('isValidObjectId validates correctly', () => {
    expect(isValidObjectId('507f1f77bcf86cd799439011')).toBe(true);
    expect(isValidObjectId('invalid-id')).toBe(false);
    expect(isValidObjectId('')).toBe(false);
  });

  test('sanitizeSearch removes regex special chars', () => {
    expect(sanitizeSearch('hello.*world')).toBe('hello\\.\\*world');
    expect(sanitizeSearch('normal search')).toBe('normal search');
    expect(sanitizeSearch('')).toBe('');
  });

  test('isValidEmail validates correctly', () => {
    expect(isValidEmail('test@example.com')).toBe(true);
    expect(isValidEmail('invalid')).toBe(false);
    expect(isValidEmail('@example.com')).toBe(false);
  });

  test('isValidPassword checks minimum length', () => {
    expect(isValidPassword('123456')).toBe(true);
    expect(isValidPassword('12345')).toBe(false);
    expect(isValidPassword('')).toBe(false);
    expect(isValidPassword(null)).toBe(false);
  });
});

describe('Helpers', () => {
  const { formatDate, formatCurrency, getGreeting, truncate, daysBetween } = require('../utils/helpers');

  test('formatDate returns dash for null', () => {
    expect(formatDate(null)).toBe('—');
    expect(formatDate(undefined)).toBe('—');
  });

  test('formatCurrency formats in INR', () => {
    expect(formatCurrency(0)).toBe('₹0');
    expect(formatCurrency(100)).toBe('₹100');
    expect(formatCurrency(null)).toBe('₹0');
  });

  test('getGreeting returns string', () => {
    const g = getGreeting();
    expect(['Good morning', 'Good afternoon', 'Good evening']).toContain(g);
  });

  test('truncate works correctly', () => {
    expect(truncate('hello world', 5)).toBe('hello...');
    expect(truncate('hi', 5)).toBe('hi');
    expect(truncate(null)).toBe('');
  });

  test('daysBetween calculates correctly', () => {
    const d1 = new Date('2026-10-01');
    const d2 = new Date('2026-10-15');
    expect(daysBetween(d1, d2)).toBe(14);
  });
});

describe('Config', () => {
  test('has required configuration values', () => {
    expect(config.loanDurationDays).toBeGreaterThan(0);
    expect(config.maxActiveLoans).toBeGreaterThan(0);
    expect(config.dailyFineRate).toBeGreaterThan(0);
    expect(config.roles.MEMBER).toBe('MEMBER');
    expect(config.roles.ADMIN).toBe('ADMIN');
    expect(config.bookCategories.length).toBeGreaterThan(0);
  });

  test('loan statuses are defined', () => {
    expect(config.loanStatuses.ISSUED).toBe('ISSUED');
    expect(config.loanStatuses.RETURNED).toBe('RETURNED');
    expect(config.loanStatuses.OVERDUE).toBe('OVERDUE');
  });
});
