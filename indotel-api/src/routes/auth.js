/**
 * ============================================================
 *  AUTH ROUTES
 *  Base: /api/auth
 *  - register, login, verify-token (public)
 *  - me, profile, change-password, logout (protected)
 * ============================================================
 */

const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

// ============ VALIDATION RULES ============

const registerValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Nama wajib diisi.')
    .isLength({ min: 3, max: 100 }).withMessage('Nama harus 3-100 karakter.'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email wajib diisi.')
    .isEmail().withMessage('Format email tidak valid.')
    .normalizeEmail(),

  body('phone')
    .trim()
    .notEmpty().withMessage('Nomor WhatsApp wajib diisi.')
    .matches(/^(\+62|62|0)8[1-9][0-9]{6,11}$/)
    .withMessage('Format nomor WhatsApp tidak valid (contoh: 081234567890).'),

  body('password')
    .notEmpty().withMessage('Password wajib diisi.')
    .isLength({ min: 8 }).withMessage('Password minimal 8 karakter.'),

  body('address')
    .optional()
    .isLength({ max: 500 }).withMessage('Alamat maksimal 500 karakter.')
];

const loginValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email/WhatsApp wajib diisi.'),

  body('password')
    .notEmpty().withMessage('Password wajib diisi.')
];

const updateProfileValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 }).withMessage('Nama harus 3-100 karakter.'),

  body('phone')
    .optional()
    .trim()
    .matches(/^(\+62|62|0)8[1-9][0-9]{6,11}$/)
    .withMessage('Format nomor WhatsApp tidak valid.'),

  body('address')
    .optional()
    .isLength({ max: 500 }).withMessage('Alamat maksimal 500 karakter.')
];

const changePasswordValidation = [
  body('currentPassword')
    .notEmpty().withMessage('Password lama wajib diisi.'),

  body('newPassword')
    .notEmpty().withMessage('Password baru wajib diisi.')
    .isLength({ min: 8 }).withMessage('Password baru minimal 8 karakter.')
];

const verifyTokenValidation = [
  body('token')
    .notEmpty().withMessage('Token wajib diisi.')
];

// ============ PUBLIC ROUTES ============

/**
 * @route   POST /api/auth/register
 * @desc    Registrasi user baru (customer)
 * @access  Public
 */
router.post('/register', registerValidation, authController.register);

/**
 * @route   POST /api/auth/login
 * @desc    Login dengan email atau nomor WhatsApp
 * @access  Public
 */
router.post('/login', loginValidation, authController.login);

/**
 * @route   POST /api/auth/verify-token
 * @desc    Cek apakah token masih valid (untuk frontend session check)
 * @access  Public
 */
router.post('/verify-token', verifyTokenValidation, authController.verifyToken);

// ============ PROTECTED ROUTES ============

/**
 * @route   GET /api/auth/me
 * @desc    Ambil profil user yang sedang login
 * @access  Private
 */
router.get('/me', authenticate, authController.getMe);

/**
 * @route   PUT /api/auth/profile
 * @desc    Update profil user (name, phone, address)
 * @access  Private
 */
router.put('/profile', authenticate, updateProfileValidation, authController.updateProfile);

/**
 * @route   PUT /api/auth/change-password
 * @desc    Ganti password user
 * @access  Private
 */
router.put(
  '/change-password',
  authenticate,
  changePasswordValidation,
  authController.changePassword
);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout (stateless JWT — hanya logging)
 * @access  Private
 */
router.post('/logout', authenticate, authController.logout);

module.exports = router;
