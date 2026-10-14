/**
 * ============================================================
 *  PACKAGE ROUTES
 *  Base: /api/packages
 *  - list, detail, compare, stats (public)
 *  - my-subscription, subscribe, cancel (protected)
 *
 *  ⚠️  PENTING: Route static harus didaftarkan SEBELUM route
 *      dinamis (/:slug), agar "my-subscription" tidak dianggap
 *      sebagai slug!
 * ============================================================
 */

const express = require('express');
const { body, query, param } = require('express-validator');
const router = express.Router();

const packageController = require('../controllers/packageController');
const { authenticate, optionalAuth } = require('../middleware/auth');

// ============ VALIDATION RULES ============

const subscribeValidation = [
  body('packageSlug')
    .trim()
    .notEmpty().withMessage('Package slug wajib diisi.')
    .matches(/^[a-z0-9-]+$/).withMessage('Format package slug tidak valid.')
];

const compareValidation = [
  query('slugs')
    .trim()
    .notEmpty().withMessage('Parameter "slugs" wajib diisi.')
];

const idParamValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('ID harus berupa angka positif.')
];

// ============================================================
//  PUBLIC ROUTES
// ============================================================

/**
 * @route   GET /api/packages
 * @desc    List semua paket aktif (dengan sorting & filter)
 * @query   ?sort=price_asc|price_desc|popular|speed
 * @query   ?popular=true
 * @access  Public
 */
router.get('/', optionalAuth, packageController.getAllPackages);

/**
 * @route   GET /api/packages/stats
 * @desc    Statistik paket (jumlah pelanggan per paket)
 * @access  Public
 */
router.get('/stats', packageController.getPackageStats);

/**
 * @route   GET /api/packages/compare
 * @desc    Bandingkan 2-4 paket
 * @query   ?slugs=home-starter,home-plus,business-pro
 * @access  Public
 */
router.get('/compare', compareValidation, packageController.comparePackages);

// ============================================================
//  PROTECTED ROUTES (harus login)
//  ⚠️  Static routes HARUS di atas route dinamis /:slug
// ============================================================

/**
 * @route   GET /api/packages/my-subscription
 * @desc    Ambil subscription aktif user
 * @access  Private
 */
router.get('/my-subscription', authenticate, packageController.getMySubscription);

/**
 * @route   GET /api/packages/my-subscriptions/history
 * @desc    Riwayat semua subscription user
 * @access  Private
 */
router.get(
  '/my-subscriptions/history',
  authenticate,
  packageController.getMySubscriptionHistory
);

/**
 * @route   POST /api/packages/subscribe
 * @desc    Berlangganan paket baru / upgrade / downgrade
 * @body    { packageSlug: "home-plus" }
 * @access  Private
 */
router.post(
  '/subscribe',
  authenticate,
  subscribeValidation,
  packageController.subscribe
);

/**
 * @route   POST /api/packages/:id/cancel
 * @desc    Batalkan subscription aktif
 * @access  Private
 */
router.post(
  '/:id/cancel',
  authenticate,
  idParamValidation,
  packageController.cancelSubscription
);

// ============================================================
//  PUBLIC DYNAMIC ROUTE (HARUS PALING BAWAH!)
// ============================================================

/**
 * @route   GET /api/packages/:slug
 * @desc    Detail paket berdasarkan slug
 * @access  Public
 */
router.get('/:slug', packageController.getPackageBySlug);

module.exports = router;
