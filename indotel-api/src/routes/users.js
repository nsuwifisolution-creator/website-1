/**
 * ============================================================
 *  USER ROUTES
 *  Base: /api/users
 *  Semua endpoint require auth
 *  - dashboard, stats, activity (GET)
 *  - connection-info, notifications (GET)
 *  - support tickets (CRUD)
 * ============================================================
 */

const express = require('express');
const { body, param, query } = require('express-validator');
const router = express.Router();

const userController = require('../controllers/userController');
const { authenticate, requireAdmin } = require('../middleware/auth');

// ============ VALIDATION RULES ============

const createTicketValidation = [
  body('subject')
    .trim()
    .notEmpty().withMessage('Subjek tiket wajib diisi.')
    .isLength({ min: 5, max: 200 })
    .withMessage('Subjek harus 5-200 karakter.'),

  body('message')
    .trim()
    .notEmpty().withMessage('Pesan tiket wajib diisi.')
    .isLength({ min: 10, max: 2000 })
    .withMessage('Pesan harus 10-2000 karakter.'),

  body('priority')
    .optional()
    .isIn(['low', 'normal', 'high', 'urgent'])
    .withMessage('Priority harus salah satu dari: low, normal, high, urgent.')
];

const replyValidation = [
  body('message')
    .trim()
    .notEmpty().withMessage('Pesan balasan wajib diisi.')
    .isLength({ min: 1, max: 2000 })
    .withMessage('Pesan maksimal 2000 karakter.')
];

const idParamValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('ID harus berupa angka positif.')
];

const limitQueryValidation = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit harus antara 1-50.')
];

// ============================================================
//  ALL ROUTES REQUIRE AUTH
// ============================================================
router.use(authenticate);

// ============================================================
//  DASHBOARD & STATS
// ============================================================

/**
 * @route   GET /api/users/dashboard
 * @desc    Ringkasan lengkap untuk dashboard pelanggan
 * @access  Private
 */
router.get('/dashboard', userController.getDashboardSummary);

/**
 * @route   GET /api/users/stats
 * @desc    Statistik ringkas untuk widget (lebih ringan dari dashboard)
 * @access  Private
 */
router.get('/stats', userController.getQuickStats);

/**
 * @route   GET /api/users/activity
 * @desc    Log aktivitas user (timeline)
 * @query   ?limit=20
 * @access  Private
 */
router.get(
  '/activity',
  limitQueryValidation,
  userController.getUserActivity
);

/**
 * @route   GET /api/users/connection-info
 * @desc    Info koneksi internet (IP, MAC, DNS, uptime)
 * @access  Private
 */
router.get('/connection-info', userController.getConnectionInfo);

/**
 * @route   GET /api/users/notifications
 * @desc    Notifikasi terpadu (billing, subscription, support)
 * @query   ?limit=10
 * @access  Private
 */
router.get(
  '/notifications',
  limitQueryValidation,
  userController.getNotifications
);

// ============================================================
//  SUPPORT TICKETS
// ============================================================

/**
 * @route   GET /api/users/support-tickets
 * @desc    List semua tiket user
 * @query   ?status=open|in_progress|resolved|closed
 * @access  Private
 */
router.get('/support-tickets', userController.getMySupportTickets);

/**
 * @route   POST /api/users/support-ticket
 * @desc    Buat tiket bantuan baru
 * @body    { subject, message, priority? }
 * @access  Private
 */
router.post(
  '/support-ticket',
  createTicketValidation,
  userController.createSupportTicket
);

/**
 * @route   GET /api/users/support-tickets/:id
 * @desc    Detail satu tiket
 * @access  Private
 */
router.get(
  '/support-tickets/:id',
  idParamValidation,
  userController.getSupportTicketById
);

/**
 * @route   POST /api/users/support-tickets/:id/reply
 * @desc    Balas tiket (append message)
 * @body    { message }
 * @access  Private
 */
router.post(
  '/support-tickets/:id/reply',
  idParamValidation,
  replyValidation,
  userController.replySupportTicket
);

/**
 * @route   POST /api/users/support-tickets/:id/close
 * @desc    Tutup tiket sendiri
 * @access  Private
 */
router.post(
  '/support-tickets/:id/close',
  idParamValidation,
  userController.closeSupportTicket
);

// ============================================================
//  ADMIN-ONLY ROUTES (opsional, untuk future use)
// ============================================================

/**
 * @route   GET /api/users/admin/all
 * @desc    List semua user (khusus admin)
 * @access  Private (Admin only)
 */
// Uncomment jika ada method di controller:
// router.get('/admin/all', requireAdmin, userController.getAllUsers);

module.exports = router;
