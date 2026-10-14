/**
 * ============================================================
 *  AUTHENTICATION MIDDLEWARE
 *  - authenticate()  → Verifikasi JWT token
 *  - requireAdmin()  → Batasi akses hanya untuk admin
 *  - optionalAuth()  → Attach user jika ada token (tidak wajib)
 *  - requireSelf()   → Cek apakah user mengakses resource miliknya
 * ============================================================
 */

const jwt = require('jsonwebtoken');
const db = require('../config/database');
require('dotenv').config();

// ============ CONFIG ============
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error('❌ FATAL: JWT_SECRET belum diset di .env');
  process.exit(1);
}

// ============ HELPER: Extract token dari request ============
function extractToken(req) {
  const authHeader = req.headers.authorization || req.headers.Authorization;

  if (!authHeader) return null;

  // Format: "Bearer <token>"
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;

  return parts[1];
}

// ============================================================
//  MIDDLEWARE 1: authenticate
//  Wajib ada token yang valid. Jika tidak, return 401.
// ============================================================
function authenticate(req, res, next) {
  const token = extractToken(req);

  // ---- Cek keberadaan token ----
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Akses ditolak. Token tidak ditemukan.',
      code: 'TOKEN_MISSING'
    });
  }

  try {
    // ---- Verifikasi JWT ----
    const decoded = jwt.verify(token, JWT_SECRET);

    // ---- Cek apakah user masih ada & aktif di database ----
    // Ini penting agar user yang sudah dihapus/di-disable tidak bisa akses
    const user = db.prepare(
      'SELECT id, name, email, phone, role, customer_id, is_active FROM users WHERE id = ?'
    ).get(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User tidak ditemukan. Silakan login kembali.',
        code: 'USER_NOT_FOUND'
      });
    }

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Akun Anda telah dinonaktifkan. Hubungi customer support.',
        code: 'USER_INACTIVE'
      });
    }

    // ---- Attach user ke request ----
    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      customerId: user.customer_id
    };

    // Simpan juga raw token (kadang berguna untuk logout/refresh)
    req.token = token;

    next();
  } catch (err) {
    // ---- Handle berbagai jenis JWT error ----
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Sesi Anda telah berakhir. Silakan login kembali.',
        code: 'TOKEN_EXPIRED',
        expiredAt: err.expiredAt
      });
    }

    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token tidak valid.',
        code: 'TOKEN_INVALID'
      });
    }

    if (err.name === 'NotBeforeError') {
      return res.status(401).json({
        success: false,
        message: 'Token belum aktif.',
        code: 'TOKEN_NOT_ACTIVE'
      });
    }

    // ---- Fallback ----
    console.error('Auth middleware error:', err.message);
    return res.status(401).json({
      success: false,
      message: 'Autentikasi gagal.',
      code: 'AUTH_FAILED'
    });
  }
}

// ============================================================
//  MIDDLEWARE 2: requireAdmin
//  Hanya bisa diakses oleh user dengan role 'admin'.
//  HARUS dipakai SETELAH authenticate().
// ============================================================
function requireAdmin(req, res, next) {
  // Pastikan authenticate() sudah dijalankan sebelumnya
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Autentikasi diperlukan terlebih dahulu.',
      code: 'AUTH_REQUIRED'
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Akses hanya untuk administrator.',
      code: 'ADMIN_REQUIRED'
    });
  }

  next();
}

// ============================================================
//  MIDDLEWARE 3: optionalAuth
//  Attach user jika token ada & valid, tapi tidak wajib.
//  Berguna untuk endpoint yang bisa diakses publik
//  tapi menampilkan data berbeda untuk user login.
// ============================================================
function optionalAuth(req, res, next) {
  const token = extractToken(req);

  // Tidak ada token → lanjut tanpa user
  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = db.prepare(
      'SELECT id, name, email, phone, role, customer_id, is_active FROM users WHERE id = ?'
    ).get(decoded.id);

    if (user && user.is_active) {
      req.user = {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        customerId: user.customer_id
      };
      req.token = token;
    } else {
      req.user = null;
    }
  } catch (err) {
    // Token invalid → abaikan, lanjut sebagai guest
    req.user = null;
  }

  next();
}

// ============================================================
//  MIDDLEWARE 4: requireSelf
//  Pastikan user hanya bisa akses resource miliknya sendiri.
//  Admin bisa bypass (akses semua).
//  HARUS dipakai SETELAH authenticate().
//
//  Usage: router.get('/:id', authenticate, requireSelf('id'), ...)
// ============================================================
function requireSelf(paramName = 'id') {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Autentikasi diperlukan.',
        code: 'AUTH_REQUIRED'
      });
    }

    // Admin bisa akses semua
    if (req.user.role === 'admin') {
      return next();
    }

    const resourceId = parseInt(req.params[paramName], 10);

    if (isNaN(resourceId)) {
      return res.status(400).json({
        success: false,
        message: `Parameter "${paramName}" tidak valid.`,
        code: 'INVALID_PARAM'
      });
    }

    // Cek apakah resource milik user ini
    if (resourceId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Anda tidak memiliki akses ke resource ini.',
        code: 'FORBIDDEN'
      });
    }

    next();
  };
}

// ============================================================
//  HELPER: Generate JWT Token
//  Berguna dipanggil dari controller (login/register)
// ============================================================
function generateToken(user, options = {}) {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name
  };

  const expiresIn = options.expiresIn || process.env.JWT_EXPIRES_IN || '7d';

  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

// ============================================================
//  HELPER: Verify Token (tanpa middleware)
//  Return: { valid: boolean, decoded?: object, error?: string }
// ============================================================
function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return { valid: true, decoded };
  } catch (err) {
    return { valid: false, error: err.message, errorName: err.name };
  }
}

// ============================================================
//  HELPER: Decode Token (tanpa verifikasi)
//  Berguna untuk debug atau extract payload dari expired token
// ============================================================
function decodeToken(token) {
  return jwt.decode(token);
}

// ============ EXPORTS ============
module.exports = {
  // Middleware
  authenticate,
  requireAdmin,
  optionalAuth,
  requireSelf,

  // Helpers
  generateToken,
  verifyToken,
  decodeToken
};
