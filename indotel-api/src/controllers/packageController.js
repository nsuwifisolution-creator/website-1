/**
 * ============================================================
 *  PACKAGE CONTROLLER
 *  Handle: list packages, detail, subscription, upgrade
 *  - Get all packages (public)
 *  - Get package by slug
 *  - Get my subscription (customer)
 *  - Subscribe / upgrade package
 *  - Cancel subscription
 *  - Compare packages
 * ============================================================
 */

const db = require('../config/database');

// ============ HELPER FUNCTIONS ============

/**
 * Format response sukses
 */
function success(res, data, message = 'Berhasil', statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
}

/**
 * Format response error
 */
function error(res, message, statusCode = 400, code = null, extra = {}) {
  return res.status(statusCode).json({
    success: false,
    message,
    ...(code && { code }),
    ...extra
  });
}

/**
 * Parse features JSON dengan safe fallback
 */
function parseFeatures(featuresStr) {
  try {
    const parsed = JSON.parse(featuresStr || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Format package object untuk response
 */
function formatPackage(pkg, includeIsActive = false) {
  const formatted = {
    id: pkg.id,
    slug: pkg.slug,
    name: pkg.name,
    speed: pkg.speed,
    price: pkg.price,
    description: pkg.description,
    features: parseFeatures(pkg.features),
    isPopular: !!pkg.is_popular,
    isCustom: pkg.price === 0
  };

  if (includeIsActive) {
    formatted.isActive = !!pkg.is_active;
  }

  return formatted;
}

/**
 * Format subscription object untuk response
 */
function formatSubscription(sub) {
  return {
    id: sub.id,
    status: sub.status,
    startDate: sub.start_date,
    endDate: sub.end_date,
    package: {
      id: sub.package_id,
      name: sub.package_name,
      slug: sub.package_slug,
      speed: sub.speed,
      price: sub.price,
      features: parseFeatures(sub.features)
    },
    daysLeft: calculateDaysLeft(sub.end_date),
    createdAt: sub.created_at
  };
}

/**
 * Hitung sisa hari hingga end_date
 */
function calculateDaysLeft(endDate) {
  if (!endDate) return 0;
  const end = new Date(endDate);
  const now = new Date();
  const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
}

// ============================================================
//  CONTROLLER FUNCTIONS
// ============================================================

/**
 * GET /api/packages
 * List semua paket aktif
 * Public endpoint
 *
 * Query params:
 *   ?sort=price_asc|price_desc|popular|speed
 *   ?popular=true → hanya paket populer
 */
exports.getAllPackages = (req, res) => {
  try {
    const { sort, popular } = req.query;

    let query = `
      SELECT id, slug, name, speed, price, description, features,
             is_popular, is_active
      FROM packages
      WHERE is_active = 1
    `;

    const params = [];

    if (popular === 'true') {
      query += ' AND is_popular = 1';
    }

    // Sorting
    switch (sort) {
      case 'price_asc':
        query += ' ORDER BY price ASC';
        break;
      case 'price_desc':
        query += ' ORDER BY price DESC';
        break;
      case 'popular':
        query += ' ORDER BY is_popular DESC, price ASC';
        break;
      case 'speed':
        query += ' ORDER BY CAST(REPLACE(speed, " Mbps", "") AS INTEGER) ASC';
        break;
      default:
        query += ' ORDER BY price ASC';
    }

    const packages = db.prepare(query).all(...params);

    return success(res, packages.map(p => formatPackage(p)), 'Daftar paket berhasil diambil.');
  } catch (err) {
    console.error('❌ Get all packages error:', err.message);
    return error(res, 'Terjadi kesalahan pada server.', 500, 'SERVER_ERROR');
  }
};

/**
 * GET /api/packages/:slug
 * Detail paket by slug
 * Public endpoint
 */
exports.getPackageBySlug = (req, res) => {
  try {
    const { slug } = req.params;

    const pkg = db.prepare(`
      SELECT id, slug, name, speed, price, description, features,
             is_popular, is_active
      FROM packages
      WHERE slug = ? AND is_active = 1
    `).get(slug);

    if (!pkg) {
      return error(res, 'Paket tidak ditemukan.', 404, 'PACKAGE_NOT_FOUND');
    }

    // Bonus: count berapa pelanggan yang berlangganan paket ini
    const subscriberCount = db.prepare(`
      SELECT COUNT(*) as count FROM subscriptions
      WHERE package_id = ? AND status = 'active'
    `).get(pkg.id);

    return success(res, {
      ...formatPackage(pkg),
      subscriberCount: subscriberCount.count
    }, 'Detail paket berhasil diambil.');
  } catch (err) {
    console.error('❌ Get package by slug error:', err.message);
    return error(res, 'Terjadi kesalahan pada server.', 500, 'SERVER_ERROR');
  }
};

/**
 * GET /api/packages/compare
 * Bandingkan 2+ paket
 * Query: ?slugs=home-starter,home-plus,business-pro
 */
exports.comparePackages = (req, res) => {
  try {
    const { slugs } = req.query;

    if (!slugs) {
      return error(res, 'Parameter "slugs" wajib diisi.', 400, 'MISSING_SLUGS');
    }

    const slugList = slugs.split(',').map(s => s.trim()).filter(Boolean);

    if (slugList.length < 2) {
      return error(res, 'Minimal bandingkan 2 paket.', 400, 'NOT_ENOUGH_PACKAGES');
    }

    if (slugList.length > 4) {
      return error(res, 'Maksimal bandingkan 4 paket.', 400, 'TOO_MANY_PACKAGES');
    }

    const placeholders = slugList.map(() => '?').join(',');

    const packages = db.prepare(`
      SELECT id, slug, name, speed, price, description, features, is_popular
      FROM packages
      WHERE slug IN (${placeholders}) AND is_active = 1
      ORDER BY price ASC
    `).all(...slugList);

    if (packages.length === 0) {
      return error(res, 'Paket tidak ditemukan.', 404, 'PACKAGE_NOT_FOUND');
    }

    // Kumpulkan semua fitur unik untuk comparison table
    const allFeatures = new Set();
    packages.forEach(p => {
      parseFeatures(p.features).forEach(f => allFeatures.add(f));
    });

    const comparison = packages.map(p => {
      const features = parseFeatures(p.features);
      const featureMatrix = {};
      allFeatures.forEach(f => {
        featureMatrix[f] = features.includes(f);
      });

      return {
        ...formatPackage(p),
        featureMatrix
      };
    });

    return success(res, {
      packages: comparison,
      allFeatures: Array.from(allFeatures)
    }, 'Perbandingan paket berhasil diambil.');
  } catch (err) {
    console.error('❌ Compare packages error:', err.message);
    return error(res, 'Terjadi kesalahan pada server.', 500, 'SERVER_ERROR');
  }
};

/**
 * GET /api/packages/my-subscription
 * Ambil subscription aktif user yang sedang login
 * Protected (butuh login)
 */
exports.getMySubscription = (req, res) => {
  try {
    const userId = req.user.id;

    const subscription = db.prepare(`
      SELECT 
        s.id, s.status, s.start_date, s.end_date, s.created_at,
        p.id as package_id, p.name as package_name, p.slug as package_slug,
        p.speed, p.price, p.features
      FROM subscriptions s
      JOIN packages p ON s.package_id = p.id
      WHERE s.user_id = ? AND s.status = 'active'
      ORDER BY s.created_at DESC
      LIMIT 1
    `).get(userId);

    if (!subscription) {
      return success(res, null, 'Anda belum memiliki langganan aktif.');
    }

    return success(res, formatSubscription(subscription), 'Langganan aktif berhasil diambil.');
  } catch (err) {
    console.error('❌ Get my subscription error:', err.message);
    return error(res, 'Terjadi kesalahan pada server.', 500, 'SERVER_ERROR');
  }
};

/**
 * GET /api/packages/my-subscriptions/history
 * Riwayat semua subscription user
 * Protected
 */
exports.getMySubscriptionHistory = (req, res) => {
  try {
    const userId = req.user.id;

    const subscriptions = db.prepare(`
      SELECT 
        s.id, s.status, s.start_date, s.end_date, s.created_at,
        p.id as package_id, p.name as package_name, p.slug as package_slug,
        p.speed, p.price, p.features
      FROM subscriptions s
      JOIN packages p ON s.package_id = p.id
      WHERE s.user_id = ?
      ORDER BY s.created_at DESC
    `).all(userId);

    return success(res, subscriptions.map(formatSubscription), 'Riwayat langganan berhasil diambil.');
  } catch (err) {
    console.error('❌ Get subscription history error:', err.message);
    return error(res, 'Terjadi kesalahan pada server.', 500, 'SERVER_ERROR');
  }
};

/**
 * POST /api/packages/subscribe
 * Berlangganan paket baru ATAU upgrade paket
 * Protected
 *
 * Body: { packageSlug: "home-plus" }
 */
exports.subscribe = (req, res) => {
  try {
    const { packageSlug } = req.body;
    const userId = req.user.id;

    // ---- 1. Validasi ----
    if (!packageSlug) {
      return error(res, 'Package slug wajib diisi.', 400, 'MISSING_PACKAGE_SLUG');
    }

    // ---- 2. Cek paket ada & aktif ----
    const pkg = db.prepare(`
      SELECT id, slug, name, speed, price, features, is_active
      FROM packages
      WHERE slug = ? AND is_active = 1
    `).get(packageSlug);

    if (!pkg) {
      return error(res, 'Paket tidak ditemukan atau tidak aktif.', 404, 'PACKAGE_NOT_FOUND');
    }

    // ---- 3. Cek paket custom (Corporate) ----
    if (pkg.price === 0) {
      return error(
        res,
        'Paket Corporate memerlukan konsultasi dengan tim sales. Silakan hubungi kami di 021-1234-5678.',
        400,
        'CUSTOM_PACKAGE_NEEDS_SALES'
      );
    }

    // ---- 4. Cek subscription aktif saat ini ----
    const currentSub = db.prepare(`
      SELECT id, package_id, status
      FROM subscriptions
      WHERE user_id = ? AND status = 'active'
      ORDER BY created_at DESC
      LIMIT 1
    `).get(userId);

    // ---- 5. Handle upgrade/downgrade ----
    if (currentSub) {
      // Jika paket sama
      if (currentSub.package_id === pkg.id) {
        return error(
          res,
          `Anda sudah berlangganan paket ${pkg.name}.`,
          400,
          'ALREADY_SUBSCRIBED'
        );
      }

      // Cek apakah ini upgrade atau downgrade
      const currentPkg = db.prepare('SELECT price, name FROM packages WHERE id = ?')
        .get(currentSub.package_id);

      const isUpgrade = pkg.price > (currentPkg?.price || 0);
      const action = isUpgrade ? 'upgrade' : 'downgrade';

      // Transaction untuk update
      const updateSubscription = db.transaction(() => {
        // Update existing subscription dengan paket baru
        db.prepare(`
          UPDATE subscriptions
          SET package_id = ?,
              start_date = datetime('now'),
              end_date = datetime('now', '+30 days')
          WHERE id = ?
        `).run(pkg.id, currentSub.id);

        return currentSub.id;
      });

      const subscriptionId = updateSubscription();

      console.log(`✅ User ${userId} ${action} to ${pkg.name}`);

      return success(res, {
        subscriptionId,
        action,
        previousPackage: currentPkg?.name || null,
        currentPackage: {
          id: pkg.id,
          name: pkg.name,
          slug: pkg.slug,
          speed: pkg.speed,
          price: pkg.price
        }
      }, `Berhasil ${action} ke paket ${pkg.name}. Tim kami akan menghubungi Anda untuk proses selanjutnya.`);
    }

    // ---- 6. Buat subscription baru ----
    const createSubscription = db.transaction(() => {
      const result = db.prepare(`
        INSERT INTO subscriptions (
          user_id, package_id, status, start_date, end_date
        )
        VALUES (?, ?, 'active', datetime('now'), datetime('now', '+30 days'))
      `).run(userId, pkg.id);

      return result.lastInsertRowid;
    });

    const subscriptionId = createSubscription();

    // ---- 7. Auto-generate invoice pertama ----
    try {
      const now = new Date();
      const months = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
      ];
      const period = `${months[now.getMonth()]} ${now.getFullYear()}`;

      const dueDate = new Date(now);
      dueDate.setDate(dueDate.getDate() + 30);

      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const countResult = db.prepare('SELECT COUNT(*) as count FROM invoices').get();
      const nextNum = String(countResult.count + 1001).padStart(4, '0');
      const invoiceNumber = `INV-${year}-${month}-${nextNum}`;

      db.prepare(`
        INSERT INTO invoices (
          invoice_number, user_id, subscription_id, amount, period,
          due_date, status
        )
        VALUES (?, ?, ?, ?, ?, ?, 'unpaid')
      `).run(
        invoiceNumber,
        userId,
        subscriptionId,
        pkg.price,
        period,
        dueDate.toISOString()
      );

      console.log(`✅ Invoice created: ${invoiceNumber} for user ${userId}`);
    } catch (invErr) {
      // Jangan fail subscription jika invoice gagal
      console.error('⚠️  Failed to create invoice:', invErr.message);
    }

    console.log(`✅ User ${userId} subscribed to ${pkg.name}`);

    return success(res, {
      subscriptionId,
      action: 'subscribe',
      package: {
        id: pkg.id,
        name: pkg.name,
        slug: pkg.slug,
        speed: pkg.speed,
        price: pkg.price
      }
    }, `Berhasil berlangganan paket ${pkg.name}. Tim kami akan menghubungi Anda untuk proses instalasi.`, 201);

  } catch (err) {
    console.error('❌ Subscribe error:', err.message);
    console.error(err.stack);
    return error(res, 'Terjadi kesalahan pada server.', 500, 'SERVER_ERROR');
  }
};

/**
 * POST /api/packages/:id/cancel
 * Batalkan subscription aktif
 * Protected
 */
exports.cancelSubscription = (req, res) => {
  try {
    const userId = req.user.id;

    const currentSub = db.prepare(`
      SELECT s.id, p.name as package_name
      FROM subscriptions s
      JOIN packages p ON s.package_id = p.id
      WHERE s.user_id = ? AND s.status = 'active'
      ORDER BY s.created_at DESC
      LIMIT 1
    `).get(userId);

    if (!currentSub) {
      return error(res, 'Tidak ada langganan aktif untuk dibatalkan.', 404, 'NO_ACTIVE_SUBSCRIPTION');
    }

    db.prepare(`
      UPDATE subscriptions
      SET status = 'cancelled',
          end_date = datetime('now')
      WHERE id = ?
    `).run(currentSub.id);

    console.log(`✅ User ${userId} cancelled subscription ${currentSub.id}`);

    return success(res, {
      subscriptionId: currentSub.id,
      previousPackage: currentSub.package_name
    }, `Langganan paket ${currentSub.package_name} berhasil dibatalkan.`);

  } catch (err) {
    console.error('❌ Cancel subscription error:', err.message);
    return error(res, 'Terjadi kesalahan pada server.', 500, 'SERVER_ERROR');
  }
};

/**
 * GET /api/packages/stats
 * Statistik paket (jumlah pelanggan, dll)
 * Public (atau bisa dibatasi admin)
 */
exports.getPackageStats = (req, res) => {
  try {
    const stats = db.prepare(`
      SELECT 
        p.id, p.slug, p.name, p.speed, p.price,
        COUNT(s.id) as subscriber_count
      FROM packages p
      LEFT JOIN subscriptions s ON s.package_id = p.id AND s.status = 'active'
      WHERE p.is_active = 1
      GROUP BY p.id
      ORDER BY subscriber_count DESC
    `).all();

    const totalActive = db.prepare(
      "SELECT COUNT(*) as count FROM subscriptions WHERE status = 'active'"
    ).get();

    return success(res, {
      totalActiveSubscriptions: totalActive.count,
      packages: stats.map(s => ({
        id: s.id,
        slug: s.slug,
        name: s.name,
        speed: s.speed,
        price: s.price,
        subscriberCount: s.subscriber_count
      }))
    }, 'Statistik paket berhasil diambil.');

  } catch (err) {
    console.error('❌ Get package stats error:', err.message);
    return error(res, 'Terjadi kesalahan pada server.', 500, 'SERVER_ERROR');
  }
};

// ============ EXPORTS ============
module.exports = {
  getAllPackages: exports.getAllPackages,
  getPackageBySlug: exports.getPackageBySlug,
  comparePackages: exports.comparePackages,
  getMySubscription: exports.getMySubscription,
  getMySubscriptionHistory: exports.getMySubscriptionHistory,
  subscribe: exports.subscribe,
  cancelSubscription: exports.cancelSubscription,
  getPackageStats: exports.getPackageStats
};
