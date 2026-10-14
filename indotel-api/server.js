/**
 * ============================================================
 *  INDOTEL API SERVER
 *  REST API untuk layanan internet Indotel
 *  Stack: Node.js + Express + SQLite + JWT
 * ============================================================
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// ============ IMPORT DATABASE (auto-init schema) ============
require('./src/config/database');

// ============ INIT APP ============
const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// ============ SECURITY MIDDLEWARE ============
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// ============ CORS CONFIGURATION ============
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:8000,http://localhost:5173,http://localhost')
  .split(',')
  .map(s => s.trim());

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests without origin (Postman, curl, mobile apps)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`⚠️  CORS blocked: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ============ BODY PARSER ============
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ============ LOGGER ============
if (NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// ============ RATE LIMITERS ============
// Global limiter (semua endpoint)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 300, // 300 request per 15 menit per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Terlalu banyak permintaan. Silakan coba lagi nanti.'
  }
});

// Auth limiter (khusus login/register - lebih ketat)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 20, // 20 percobaan per 15 menit
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Hit only failed attempts
  message: {
    success: false,
    message: 'Terlalu banyak percobaan login. Coba lagi dalam 15 menit.'
  }
});

app.use(globalLimiter);

// ============ HEALTH CHECK ============
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'Indotel API',
    version: '1.0.0',
    environment: NODE_ENV,
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()) + ' seconds'
  });
});

// ============ ROOT ENDPOINT ============
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🚀 Indotel API is running!',
    version: '1.0.0',
    environment: NODE_ENV,
    documentation: '/api/docs',
    endpoints: {
      auth: '/api/auth',
      packages: '/api/packages',
      invoices: '/api/invoices',
      users: '/api/users'
    }
  });
});

// ============ API ROUTES ============
app.use('/api/auth', authLimiter, require('./src/routes/auth'));
app.use('/api/packages', require('./src/routes/packages'));
app.use('/api/invoices', require('./src/routes/invoices'));
app.use('/api/users', require('./src/routes/users'));

// ============ API DOCS (simple) ============
app.get('/api/docs', (req, res) => {
  res.json({
    title: 'Indotel API Documentation',
    version: '1.0.0',
    baseUrl: `${req.protocol}://${req.get('host')}/api`,
    authentication: {
      type: 'Bearer Token (JWT)',
      header: 'Authorization: Bearer <token>',
      obtainToken: 'POST /api/auth/login'
    },
    endpoints: {
      auth: {
        register: { method: 'POST', path: '/api/auth/register', auth: false },
        login: { method: 'POST', path: '/api/auth/login', auth: false },
        me: { method: 'GET', path: '/api/auth/me', auth: true },
        updateProfile: { method: 'PUT', path: '/api/auth/profile', auth: true },
        changePassword: { method: 'PUT', path: '/api/auth/change-password', auth: true }
      },
      packages: {
        list: { method: 'GET', path: '/api/packages', auth: false },
        detail: { method: 'GET', path: '/api/packages/:slug', auth: false },
        mySubscription: { method: 'GET', path: '/api/packages/my-subscription', auth: true },
        subscribe: { method: 'POST', path: '/api/packages/subscribe', auth: true }
      },
      invoices: {
        list: { method: 'GET', path: '/api/invoices', auth: true },
        detail: { method: 'GET', path: '/api/invoices/:id', auth: true },
        pay: { method: 'POST', path: '/api/invoices/:id/pay', auth: true },
        usage: { method: 'GET', path: '/api/invoices/usage', auth: true }
      },
      users: {
        dashboard: { method: 'GET', path: '/api/users/dashboard', auth: true },
        supportTicket: { method: 'POST', path: '/api/users/support-ticket', auth: true }
      }
    }
  });
});

// ============ 404 HANDLER ============
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Endpoint ${req.method} ${req.originalUrl} tidak ditemukan.`,
    hint: 'Lihat dokumentasi di /api/docs'
  });
});

// ============ GLOBAL ERROR HANDLER ============
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  console.error('   Stack:', err.stack);

  // CORS error
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      success: false,
      message: 'Origin tidak diizinkan oleh CORS policy.'
    });
  }

  // JWT error
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Token tidak valid.'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token sudah kadaluarsa. Silakan login kembali.'
    });
  }

  // Validation error
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }

  // Default 500
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Terjadi kesalahan pada server.',
    ...(NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ============ GRACEFUL SHUTDOWN ============
process.on('SIGTERM', () => {
  console.log('\n⚠️  SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\n⚠️  SIGINT received. Shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

// ============ START SERVER ============
const server = app.listen(PORT, '0.0.0.0', () => {
  const banner = `
╔══════════════════════════════════════════════════════╗
║                                                      ║
║   🚀  INDOTEL API SERVER                             ║
║                                                      ║
╠══════════════════════════════════════════════════════╣
║                                                      ║
║   🌐  URL:          http://localhost:${PORT}            ║
║   📦  Mode:         ${NODE_ENV.padEnd(28)}║
║   🔐  JWT Expires:  ${(process.env.JWT_EXPIRES_IN || '7d').padEnd(28)}║
║   🌍  CORS Origin:  ${allowedOrigins.join(', ').substring(0, 28).padEnd(28)}║
║                                                      ║
╠══════════════════════════════════════════════════════╣
║                                                      ║
║   📖  Docs:         http://localhost:${PORT}/api/docs   ║
║   ❤️   Health:       http://localhost:${PORT}/health    ║
║                                                      ║
╠══════════════════════════════════════════════════════╣
║                                                      ║
║   🔑  Test Credentials:                              ║
║       Admin:    admin@indotel.id / Admin123!         ║
║       Customer: demo@indotel.id  / Demo123!          ║
║                                                      ║
╚══════════════════════════════════════════════════════╝
  `;
  console.log(banner);
});

module.exports = app;
