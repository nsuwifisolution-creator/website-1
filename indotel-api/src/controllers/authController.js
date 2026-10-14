/**
 * ============================================================
 *  AUTH CONTROLLER
 *  Handle: register, login, getMe, updateProfile, changePassword
 *  - Register dengan validasi & cek duplikat
 *  - Login dengan email ATAU nomor WhatsApp
 *  - JWT token generation
 *  - Auto-generate customer ID
 * ============================================================
 */

const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const db = require('../config/database');
const { generateToken, verifyToken } = require('../middleware/auth');
require('dotenv').config();

// ============ CONSTANTS ============
const BCRYPT_ROUNDS = 10;
const CUSTOMER_ID_PREFIX = 'IND';
const MIN_PASSWORD_LENGTH = 8;

// ============ HELPER FUNCTIONS ============

/**
 * Format response standar sukses
 */
function success(res, data, message = 'Berhasil', statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
}

/**
 * Format response standar error
 */
function error(res, message, statusCode = 400, code = null, extra = {}) {
  const payload = {
    success: false,
    message,
    ...(code && { code }),
    ...extra
  };
  return res.status(statusCode).json(payload);
}

/**
 * Sanitize user object sebelum dikirim ke client
 */
function sanitizeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    customerId: user.customer_id || user.customerId,
    address: user.address || null,
    createdAt: user.created_at || user.createdAt || null
  };
}

/**
 * Auto-generate customer ID dengan format: IND-YYYY-MM-XXXX
 * Contoh: IND-2025-10-0001
 */
function generateCustomerId() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');

  // Hitung jumlah customer saat ini untuk urutan
  const result = db.prepare(
    "SELECT COUNT(*) as count FROM users WHERE role = 'customer'"
  ).get();

  const nextNumber = (result.count + 1).toString().padStart(4, '0');
  return `${CUSTOMER_ID_PREFIX}-${year}-${month}-${nextNumber}`;
}

/**
 * Ambil user lengkap dari DB (termasuk password)
 */
function findUserByEmailOrPhone(identifier) {
  return db.prepare(`
    SELECT * FROM users
    WHERE email = ? OR phone = ?
    LIMIT 1
  `).get(identifier, identifier);
}

/**
 * Cek apakah email sudah terdaftar
 */
function isEmailTaken(email) {
  const row = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  return !!row;
}

/**
 * Cek apakah nomor WhatsApp sudah terdaftar
 */
function isPhoneTaken(phone) {
  const row = db.prepare('SELECT id FROM users WHERE phone = ?').get(phone);
  return !!row;
}

/**
 * Normalisasi nomor telepon Indonesia
 * - 08xx → 628xx
 * - +628xx → 628xx
 * - 628xx → 628xx (tetap)
 */
function normalizePhone(phone) {
  if (!phone) return phone;
  let cleaned = phone.replace(/[\s\-()]/g, '');

  if (cleaned.startsWith('+62')) {
    cleaned = cleaned.substring(1); // remove +
  } else if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.substring(1);
  }

  return cleaned;
}

/**
 * Validasi kekuatan password
 * Return: { valid: boolean, message?: string }
 */
function validatePasswordStrength(password) {
  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    return {
      valid: false,
      message: `Password minimal ${MIN_PASSWORD_LENGTH} karakter.`
    };
  }

  if (!/[a-zA-Z]/.test(password)) {
    return { valid: false, message: 'Password harus mengandung huruf.' };
  }

  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password harus mengandung angka.' };
  }

  return { valid: true };
}

// ============================================================
//  CONTROLLER FUNCTIONS
// ============================================================

/**
 * POST /api/auth/register
 * Registrasi user baru (customer)
 */
exports.register = async (req, res) => {
  try {
    // ---- 1. Validasi input ----
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return error(res, 'Validasi gagal.', 400, 'VALIDATION_ERROR', {
        errors: errors.array().map(e => ({
          field: e.path,
          message: e.msg
        }))
      });
    }

    const { name, email, phone, password, address } = req.body;

    // ---- 2. Normalisasi data ----
    const normalizedEmail = email.toLowerCase().trim();
    const normalizedPhone = normalizePhone(phone);
    const trimmedName = name.trim();

    // ---- 3. Validasi kekuatan password ----
    const pwCheck = validatePasswordStrength(password);
    if (!pwCheck.valid) {
      return error(res, pwCheck.message, 400, 'WEAK_PASSWORD');
    }

    // ---- 4. Cek duplikat ----
    if (isEmailTaken(normalizedEmail)) {
      return error(
        res,
        'Email sudah terdaftar. Silakan login atau gunakan email lain.',
        409,
        'EMAIL_TAKEN',
        { field: 'email' }
      );
    }

    if (isPhoneTaken(normalizedPhone)) {
      return error(
        res,
        'Nomor WhatsApp sudah terdaftar. Silakan login atau gunakan nomor lain.',
        409,
        'PHONE_TAKEN',
        { field: 'phone' }
      );
    }

    // ---- 5. Hash password ----
    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

    // ---- 6. Insert user (transaction untuk generate ID yang aman) ----
    const insertUser = db.transaction(() => {
      const customerId = generateCustomerId();

      const result = db.prepare(`
        INSERT INTO users (
          name, email, phone, password, role, customer_id, address, is_active
        )
        VALUES (?, ?, ?, ?, 'customer', ?, ?, 1)
      `).run(
        trimmedName,
        normalizedEmail,
        normalizedPhone,
        hashedPassword,
        customerId,
        address ? address.trim() : null
      );

      return db.prepare(
        'SELECT id, name, email, phone, role, customer_id, address, created_at FROM users WHERE id = ?'
      ).get(result.lastInsertRowid);
    });

    const newUser = insertUser();

    // ---- 7. Generate JWT ----
    const token = generateToken(newUser);

    // ---- 8. Log activity (opsional) ----
    console.log(`✅ New user registered: ${normalizedEmail} (${newUser.customer_id})`);

    // ---- 9. Response ----
    return success(res, {
      user: sanitizeUser(newUser),
      token,
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    }, 'Pendaftaran berhasil! Selamat datang di Indotel.', 201);

  } catch (err) {
    console.error('❌ Register error:', err.message);
    console.error(err.stack);

    // Handle SQLite unique constraint (jaga-jaga jika race condition)
    if (err.message && err.message.includes('UNIQUE constraint')) {
      return error(res, 'Email atau nomor sudah terdaftar.', 409, 'DUPLICATE_ENTRY');
    }

    return error(res, 'Terjadi kesalahan pada server. Silakan coba lagi.', 500, 'SERVER_ERROR');
  }
};

/**
 * POST /api/auth/login
 * Login dengan email ATAU nomor WhatsApp
 */
exports.login = async (req, res) => {
  try {
    // ---- 1. Validasi input ----
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return error(res, 'Validasi gagal.', 400, 'VALIDATION_ERROR', {
        errors: errors.array().map(e => ({
          field: e.path,
          message: e.msg
        }))
      });
    }

    const { email, password } = req.body;

    // ---- 2. Normalisasi identifier ----
    const rawIdentifier = String(email).trim();
    const normalizedPhone = normalizePhone(rawIdentifier);
    const normalizedEmail = rawIdentifier.toLowerCase();

    // ---- 3. Cari user (bisa by email atau phone) ----
    const user = db.prepare(`
      SELECT * FROM users
      WHERE email = ? OR phone = ? OR phone = ?
      LIMIT 1
    `).get(normalizedEmail, rawIdentifier, normalizedPhone);

    // ---- 4. Anti-enumeration: pesan error yang sama untuk user tidak ada vs password salah ----
    const genericError = 'Email/WhatsApp atau password salah.';

    if (!user) {
      console.log(`⚠️  Login attempt failed: user not found (${rawIdentifier})`);
      return error(res, genericError, 401, 'INVALID_CREDENTIALS');
    }

    // ---- 5. Cek apakah akun aktif ----
    if (!user.is_active) {
      return error(
        res,
        'Akun Anda telah dinonaktifkan. Hubungi customer support di 021-1234-5678.',
        403,
        'USER_INACTIVE'
      );
    }

    // ---- 6. Verify password ----
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      console.log(`⚠️  Login attempt failed: wrong password (${rawIdentifier})`);
      return error(res, genericError, 401, 'INVALID_CREDENTIALS');
    }

    // ---- 7. Generate JWT ----
    const token = generateToken(user);

    // ---- 8. Log activity ----
    console.log(`✅ User logged in: ${user.email} (${user.role})`);

    // ---- 9. Response ----
    return success(res, {
      user: sanitizeUser(user),
      token,
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    }, `Login berhasil! Selamat datang, ${user.name}.`);

  } catch (err) {
    console.error('❌ Login error:', err.message);
    console.error(err.stack);
    return error(res, 'Terjadi kesalahan pada server. Silakan coba lagi.', 500, 'SERVER_ERROR');
  }
};

/**
 * GET /api/auth/me
 * Get profil user yang sedang login
 */
exports.getMe = async (req, res) => {
  try {
    // req.user sudah di-attach oleh authenticate() middleware
    const user = db.prepare(`
      SELECT id, name, email, phone, role, customer_id, address, is_active, created_at, updated_at
      FROM users WHERE id = ?
    `).get(req.user.id);

    if (!user) {
      return error(res, 'User tidak ditemukan.', 404, 'USER_NOT_FOUND');
    }

    // Ambil info subscription aktif (opsional)
    const subscription = db.prepare(`
      SELECT s.id, s.status, s.start_date, s.end_date,
             p.name as package_name, p.speed, p.price
      FROM subscriptions s
      JOIN packages p ON s.package_id = p.id
      WHERE s.user_id = ? AND s.status = 'active'
      ORDER BY s.created_at DESC
      LIMIT 1
    `).get(user.id);

    return success(res, {
      user: sanitizeUser(user),
      subscription: subscription ? {
        id: subscription.id,
        packageName: subscription.package_name,
        speed: subscription.speed,
        price: subscription.price,
        status: subscription.status,
        startDate: subscription.start_date,
        endDate: subscription.end_date
      } : null
    }, 'Data profil berhasil diambil.');

  } catch (err) {
    console.error('❌ Get me error:', err.message);
    return error(res, 'Terjadi kesalahan pada server.', 500, 'SERVER_ERROR');
  }
};

/**
 * PUT /api/auth/profile
 * Update profil user (name, phone, address)
 */
exports.updateProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return error(res, 'Validasi gagal.', 400, 'VALIDATION_ERROR', {
        errors: errors.array().map(e => ({ field: e.path, message: e.msg }))
      });
    }

    const { name, phone, address } = req.body;
    const userId = req.user.id;

    // Ambil data saat ini
    const currentUser = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    if (!currentUser) {
      return error(res, 'User tidak ditemukan.', 404, 'USER_NOT_FOUND');
    }

    // ---- Validasi duplikat phone (jika diubah) ----
    let normalizedPhone = currentUser.phone;
    if (phone && phone !== currentUser.phone) {
      normalizedPhone = normalizePhone(phone);

      const phoneTaken = db.prepare(
        'SELECT id FROM users WHERE phone = ? AND id != ?'
      ).get(normalizedPhone, userId);

      if (phoneTaken) {
        return error(
          res,
          'Nomor WhatsApp sudah digunakan oleh akun lain.',
          409,
          'PHONE_TAKEN',
          { field: 'phone' }
        );
      }
    }

    // ---- Update ----
    db.prepare(`
      UPDATE users
      SET name = COALESCE(?, name),
          phone = COALESCE(?, phone),
          address = COALESCE(?, address)
      WHERE id = ?
    `).run(
      name ? name.trim() : null,
      normalizedPhone !== currentUser.phone ? normalizedPhone : null,
      address !== undefined ? (address ? address.trim() : null) : null,
      userId
    );

    // ---- Ambil data terbaru ----
    const updatedUser = db.prepare(`
      SELECT id, name, email, phone, role, customer_id, address, updated_at
      FROM users WHERE id = ?
    `).get(userId);

    console.log(`✅ Profile updated: ${updatedUser.email}`);

    return success(res, {
      user: sanitizeUser(updatedUser)
    }, 'Profil berhasil diperbarui.');

  } catch (err) {
    console.error('❌ Update profile error:', err.message);
    return error(res, 'Terjadi kesalahan pada server.', 500, 'SERVER_ERROR');
  }
};

/**
 * PUT /api/auth/change-password
 * Ganti password user
 */
exports.changePassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return error(res, 'Validasi gagal.', 400, 'VALIDATION_ERROR', {
        errors: errors.array().map(e => ({ field: e.path, message: e.msg }))
      });
    }

    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    // ---- 1. Cek new password != current ----
    if (currentPassword === newPassword) {
      return error(
        res,
        'Password baru harus berbeda dari password lama.',
        400,
        'SAME_PASSWORD'
      );
    }

    // ---- 2. Validasi kekuatan password baru ----
    const pwCheck = validatePasswordStrength(newPassword);
    if (!pwCheck.valid) {
      return error(res, pwCheck.message, 400, 'WEAK_PASSWORD');
    }

    // ---- 3. Ambil password lama dari DB ----
    const user = db.prepare('SELECT password FROM users WHERE id = ?').get(userId);
    if (!user) {
      return error(res, 'User tidak ditemukan.', 404, 'USER_NOT_FOUND');
    }

    // ---- 4. Verify current password ----
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      console.log(`⚠️  Change password failed: wrong current password (user ${userId})`);
      return error(res, 'Password lama salah.', 400, 'WRONG_CURRENT_PASSWORD');
    }

    // ---- 5. Hash & update ----
    const hashedNewPassword = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

    db.prepare(`
      UPDATE users SET password = ? WHERE id = ?
    `).run(hashedNewPassword, userId);

    console.log(`✅ Password changed: user ${userId}`);

    return success(res, null, 'Password berhasil diubah. Silakan login ulang jika diperlukan.');

  } catch (err) {
    console.error('❌ Change password error:', err.message);
    return error(res, 'Terjadi kesalahan pada server.', 500, 'SERVER_ERROR');
  }
};

/**
 * POST /api/auth/verify-token
 * Cek apakah token masih valid
 * Berguna untuk frontend cek session sebelum render halaman
 */
exports.verifyToken = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return error(res, 'Token wajib dikirim.', 400, 'TOKEN_REQUIRED');
    }

    const result = verifyToken(token);

    if (!result.valid) {
      return success(res, {
        valid: false,
        reason: result.errorName || 'INVALID'
      }, 'Token tidak valid.');
    }

    // Cek user masih ada & aktif
    const user = db.prepare(
      'SELECT id, name, email, role, is_active FROM users WHERE id = ?'
    ).get(result.decoded.id);

    if (!user || !user.is_active) {
      return success(res, {
        valid: false,
        reason: 'USER_NOT_FOUND_OR_INACTIVE'
      }, 'Token tidak valid.');
    }

    return success(res, {
      valid: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      expiresAt: new Date(result.decoded.exp * 1000).toISOString()
    }, 'Token valid.');

  } catch (err) {
    console.error('❌ Verify token error:', err.message);
    return error(res, 'Terjadi kesalahan pada server.', 500, 'SERVER_ERROR');
  }
};

/**
 * POST /api/auth/logout
 * Logout user (stateless JWT — hanya untuk logging)
 * Client harus hapus token dari storage
 */
exports.logout = async (req, res) => {
  try {
    // JWT stateless: server tidak simpan session
    // Ini hanya placeholder untuk log activity & future improvement (blacklist token)
    console.log(`✅ User logged out: ${req.user?.email || 'unknown'}`);

    return success(res, null, 'Logout berhasil. Terima kasih!');
  } catch (err) {
    console.error('❌ Logout error:', err.message);
    return error(res, 'Terjadi kesalahan pada server.', 500, 'SERVER_ERROR');
  }
};

// ============ EXPORTS ============
module.exports = {
  register: exports.register,
  login: exports.login,
  getMe: exports.getMe,
  updateProfile: exports.updateProfile,
  changePassword: exports.changePassword,
  verifyToken: exports.verifyToken,
  logout: exports.logout
};
