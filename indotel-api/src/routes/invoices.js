/**
 * ============================================================
 *  INVOICE ROUTES
 *  Base: /api/invoices
 *  Semua endpoint require auth
 *  - list, summary, usage, detail, download (GET)
 *  - pay, cancel (POST)
 *
 *  ⚠️  PENTING: Route static (/summary, /usage) harus
 *      didaftarkan SEBELUM route dinamis (/:id)
 * ============================================================
 */

const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();

const invoiceController = require('../controllers/invoiceController');
const { authenticate } = require('../middleware/auth');

// ============ VALIDATION RULES ============

const payValidation = [
  body('paymentMethod')
    .trim()
    .notEmpty().withMessage('Metode pembayaran wajib diisi.')
    .isIn([
      'Transfer Bank',
      'Virtual Account',
      'E-Wallet',
      'Minimart',
      'Kartu Kredit',
      'QRIS'
    ])
    .withMessage('Metode pembayaran tidak valid.'),

  body('notes')
    .optional()
    .isLength({ max: 500 }).withMessage('Catatan maksimal 500 karakter.')
];

const idParamValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('ID harus berupa angka positif.')
];

// ============================================================
//  ALL ROUTES REQUIRE AUTH
// ============================================================
router.use(authenticate);

// ============================================================
//  STATIC ROUTES (HARUS di atas /:id)
// ============================================================

/**
 * @route   GET /api/invoices/summary
 * @desc    Ringkasan tagihan (untuk dashboard widget)
 * @access  Private
 */
router.get('/summary', invoiceController.getInvoiceSummary);

/**
 * @route   GET /api/invoices/usage
 * @desc    Statistik penggunaan internet
 * @query   ?days=7|30|90 (default: 7)
 * @access  Private
 */
router.get('/usage', invoiceController.getUsageStats);

// ============================================================
//  COLLECTION ROUTES
// ============================================================

/**
 * @route   GET /api/invoices
 * @desc    List semua tagihan user (dengan filter & pagination)
 * @query   ?status=paid|unpaid|overdue|cancelled
 * @query   ?page=1
 * @query   ?limit=10
 * @access  Private
 */
router.get('/', invoiceController.getMyInvoices);

// ============================================================
//  DYNAMIC ROUTES (setelah static)
// ============================================================

/**
 * @route   GET /api/invoices/:id
 * @desc    Detail satu tagihan
 * @access  Private
 */
router.get(
  '/:id',
  idParamValidation,
  invoiceController.getInvoiceById
);

/**
 * @route   GET /api/invoices/:id/download
 * @desc    Data invoice untuk PDF generation di frontend
 * @access  Private
 */
router.get(
  '/:id/download',
  idParamValidation,
  invoiceController.downloadInvoice
);

/**
 * @route   POST /api/invoices/:id/pay
 * @desc    Bayar tagihan
 * @body    { paymentMethod: "Transfer Bank", notes?: "..." }
 * @access  Private
 */
router.post(
  '/:id/pay',
  idParamValidation,
  payValidation,
  invoiceController.payInvoice
);

/**
 * @route   POST /api/invoices/:id/cancel
 * @desc    Batalkan tagihan (hanya untuk unpaid/overdue)
 * @access  Private
 */
router.post(
  '/:id/cancel',
  idParamValidation,
  invoiceController.cancelInvoice
);

module.exports = router;
