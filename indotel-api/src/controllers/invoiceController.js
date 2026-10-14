/**
 * ============================================================
 *  INVOICE CONTROLLER
 *  Handle: invoices, payment, usage stats
 *  - List invoices user (dengan filter & pagination)
 *  - Detail invoice
 *  - Pay invoice (simulasi)
 *  - Cancel invoice
 *  - Download invoice data (untuk PDF generation)
 *  - Usage statistics (7/30/90 hari)
 * ============================================================
 */

const db = require('../config/database');

// ============ CONSTANTS ============
const VALID_STATUSES = ['paid', 'unpaid', 'overdue', 'cancelled'];
const VALID_PAYMENT_METHODS = [
  'Transfer Bank',
  'Virtual Account',
  'E-Wallet',
  'Minimart',
  'Kartu Kredit',
  'QRIS'
];

// ============ HELPER FUNCTIONS ============

function success(res, data, message = 'Berhasil', statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
}

function error(res, message, statusCode = 400, code = null, extra = {}) {
  return res.status(statusCode).json({
    success: false,
    message,
    ...(code && { code }),
    ...extra
  });
}

/**
 * Format invoice object untuk response
 */
function formatInvoice(inv) {
  return {
    id: inv.id,
    invoiceNumber: inv.invoice_number,
    amount: inv.amount,
    period: inv.period,
    dueDate: inv.due_date,
    status: inv.status,
    paidAt: inv.paid_at,
    paymentMethod: inv.payment_method,
    notes: inv.notes || null,
    isOverdue: inv.status === 'unpaid' && new Date(inv.due_date) < new Date(),
    daysUntilDue: calculateDaysUntilDue(inv.due_date, inv.status),
    createdAt: inv.created_at
  };
}

/**
 * Hitung hari hingga jatuh tempo
 */
function calculateDaysUntilDue(dueDate, status) {
  if (status === 'paid' || status === 'cancelled') return null;

  const due = new Date(dueDate);
  const now = new Date();
  const diff = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
  return diff;
}

/**
 * Auto-update status invoice yang sudah lewat jatuh tempo
 */
function autoMarkOverdue(userId = null) {
  try {
    let query = `
      UPDATE invoices
      SET status = 'overdue'
      WHERE status = 'unpaid'
        AND due_date < datetime('now')
    `;
    const params = [];

    if (userId) {
      query += ' AND user_id = ?';
      params.push(userId);
    }

    const result = db.prepare(query).run(...params);

    if (result.changes > 0) {
      console.log(`📅 Auto-marked ${result.changes} invoices as overdue`);
    }

    return result.changes;
  } catch (err) {
    console.error('⚠️  Auto-mark overdue error:', err.message);
    return 0;
  }
}

// ============================================================
//  CONTROLLER FUNCTIONS
// ============================================================

/**
 * GET /api/invoices
 * List semua invoice user dengan filter & pagination
 *
 * Query params:
 *   ?status=paid|unpaid|overdue|cancelled
 *   ?page=1
 *   ?limit=10
 */
exports.getMyInvoices = (req, res) => {
  try {
    const userId = req.user.id;
    const { status } = req.query;

    // Auto-mark overdue sebelum query
    autoMarkOverdue(userId);

    // ---- Pagination ----
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const offset = (page - 1) * limit;

    // ---- Build query ----
    let whereClause = 'WHERE user_id = ?';
    const params = [userId];

    if (status && VALID_STATUSES.includes(status)) {
      whereClause += ' AND status = ?';
      params.push(status);
    }

    // ---- Count total ----
    const totalResult = db.prepare(
      `SELECT COUNT(*) as count FROM invoices ${whereClause}`
    ).get(...params);

    // ---- Get invoices ----
    const invoices = db.prepare(`
      SELECT * FROM invoices
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset);

    // ---- Summary ----
    const summary = db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid_count,
        SUM(CASE WHEN status = 'unpaid' THEN 1 ELSE 0 END) as unpaid_count,
        SUM(CASE WHEN status = 'overdue' THEN 1 ELSE 0 END) as overdue_count,
        COALESCE(SUM(CASE WHEN status IN ('unpaid', 'overdue') THEN amount ELSE 0 END), 0) as total_due
      FROM invoices
      WHERE user_id = ?
    `).get(userId);

    return success(res, {
      invoices: invoices.map(formatInvoice),
      pagination: {
        page,
        limit,
        total: totalResult.count,
        totalPages: Math.ceil(totalResult.count / limit),
        hasNext: page * limit < totalResult.count,
        hasPrev: page > 1
      },
      summary: {
        totalInvoices: summary.total,
        paidCount: summary.paid_count || 0,
        unpaidCount: summary.unpaid_count || 0,
        overdueCount: summary.overdue_count || 0,
        totalDue: summary.total_due || 0
      }
    }, 'Daftar tagihan berhasil diambil.');

  } catch (err) {
    console.error('❌ Get my invoices error:', err.message);
    return error(res, 'Terjadi kesalahan pada server.', 500, 'SERVER_ERROR');
  }
};

/**
 * GET /api/invoices/:id
 * Detail satu invoice
 */
exports.getInvoiceById = (req, res) => {
  try {
    const userId = req.user.id;
    const invoiceId = parseInt(req.params.id, 10);

    if (isNaN(invoiceId)) {
      return error(res, 'ID invoice tidak valid.', 400, 'INVALID_ID');
    }

    const invoice = db.prepare(`
      SELECT i.*, 
             p.name as package_name, p.speed as package_speed,
             u.name as customer_name, u.email as customer_email,
             u.phone as customer_phone, u.customer_id as customer_code,
             u.address as customer_address
      FROM invoices i
      LEFT JOIN subscriptions s ON i.subscription_id = s.id
      LEFT JOIN packages p ON s.package_id = p.id
      LEFT JOIN users u ON i.user_id = u.id
      WHERE i.id = ? AND i.user_id = ?
    `).get(invoiceId, userId);

    if (!invoice) {
      return error(res, 'Invoice tidak ditemukan.', 404, 'INVOICE_NOT_FOUND');
    }

    return success(res, {
      ...formatInvoice(invoice),
      customer: {
        name: invoice.customer_name,
        email: invoice.customer_email,
        phone: invoice.customer_phone,
        customerId: invoice.customer_code,
        address: invoice.customer_address
      },
      package: invoice.package_name ? {
        name: invoice.package_name,
        speed: invoice.package_speed
      } : null
    }, 'Detail tagihan berhasil diambil.');

  } catch (err) {
    console.error('❌ Get invoice by id error:', err.message);
    return error(res, 'Terjadi kesalahan pada server.', 500, 'SERVER_ERROR');
  }
};

/**
 * POST /api/invoices/:id/pay
 * Bayar invoice (simulasi)
 *
 * Body: { paymentMethod: "Transfer Bank" }
 */
exports.payInvoice = (req, res) => {
  try {
    const userId = req.user.id;
    const invoiceId = parseInt(req.params.id, 10);
    const { paymentMethod, notes } = req.body;

    // ---- Validasi ----
    if (isNaN(invoiceId)) {
      return error(res, 'ID invoice tidak valid.', 400, 'INVALID_ID');
    }

    if (!paymentMethod) {
      return error(res, 'Metode pembayaran wajib dipilih.', 400, 'MISSING_PAYMENT_METHOD');
    }

    if (!VALID_PAYMENT_METHODS.includes(paymentMethod)) {
      return error(
        res,
        `Metode pembayaran tidak valid. Pilihan: ${VALID_PAYMENT_METHODS.join(', ')}`,
        400,
        'INVALID_PAYMENT_METHOD',
        { validMethods: VALID_PAYMENT_METHODS }
      );
    }

    // ---- Cek invoice ----
    const invoice = db.prepare(`
      SELECT * FROM invoices WHERE id = ? AND user_id = ?
    `).get(invoiceId, userId);

    if (!invoice) {
      return error(res, 'Invoice tidak ditemukan.', 404, 'INVOICE_NOT_FOUND');
    }

    if (invoice.status === 'paid') {
      return error(res, 'Invoice sudah dibayar.', 400, 'ALREADY_PAID', {
        paidAt: invoice.paid_at,
        paymentMethod: invoice.payment_method
      });
    }

    if (invoice.status === 'cancelled') {
      return error(res, 'Invoice telah dibatalkan.', 400, 'INVOICE_CANCELLED');
    }

    // ---- Update ----
    db.prepare(`
      UPDATE invoices
      SET status = 'paid',
          paid_at = datetime('now'),
          payment_method = ?,
          notes = COALESCE(?, notes)
      WHERE id = ?
    `).run(paymentMethod, notes || null, invoiceId);

    // ---- Ambil data terbaru ----
    const updatedInvoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(invoiceId);

    console.log(`✅ Invoice ${invoice.invoice_number} paid via ${paymentMethod} (user ${userId})`);

    return success(res, {
      invoice: formatInvoice(updatedInvoice),
      receipt: {
        invoiceNumber: invoice.invoice_number,
        amount: invoice.amount,
        paymentMethod,
        paidAt: updatedInvoice.paid_at,
        status: 'LUNAS'
      }
    }, `Pembayaran via ${paymentMethod} berhasil. Terima kasih!`);

  } catch (err) {
    console.error('❌ Pay invoice error:', err.message);
    return error(res, 'Terjadi kesalahan pada server.', 500, 'SERVER_ERROR');
  }
};

/**
 * POST /api/invoices/:id/cancel
 * Batalkan invoice (hanya untuk unpaid)
 */
exports.cancelInvoice = (req, res) => {
  try {
    const userId = req.user.id;
    const invoiceId = parseInt(req.params.id, 10);

    if (isNaN(invoiceId)) {
      return error(res, 'ID invoice tidak valid.', 400, 'INVALID_ID');
    }

    const invoice = db.prepare(
      'SELECT * FROM invoices WHERE id = ? AND user_id = ?'
    ).get(invoiceId, userId);

    if (!invoice) {
      return error(res, 'Invoice tidak ditemukan.', 404, 'INVOICE_NOT_FOUND');
    }

    if (invoice.status === 'paid') {
      return error(res, 'Invoice yang sudah dibayar tidak bisa dibatalkan.', 400, 'CANNOT_CANCEL_PAID');
    }

    if (invoice.status === 'cancelled') {
      return error(res, 'Invoice sudah dibatalkan sebelumnya.', 400, 'ALREADY_CANCELLED');
    }

    db.prepare(`
      UPDATE invoices SET status = 'cancelled' WHERE id = ?
    `).run(invoiceId);

    console.log(`✅ Invoice ${invoice.invoice_number} cancelled (user ${userId})`);

    return success(res, {
      invoiceId,
      invoiceNumber: invoice.invoice_number
    }, 'Invoice berhasil dibatalkan.');

  } catch (err) {
    console.error('❌ Cancel invoice error:', err.message);
    return error(res, 'Terjadi kesalahan pada server.', 500, 'SERVER_ERROR');
  }
};

/**
 * GET /api/invoices/usage
 * Statistik penggunaan (download, upload, online, ping)
 *
 * Query: ?days=7|30|90 (default: 7)
 */
exports.getUsageStats = (req, res) => {
  try {
    const userId = req.user.id;
    const days = Math.min(365, Math.max(1, parseInt(req.query.days) || 7));

    // ---- Daily data ----
    const dailyStats = db.prepare(`
      SELECT
        recorded_date as date,
        download_gb,
        upload_gb,
        online_hours,
        avg_ping
      FROM usage_stats
      WHERE user_id = ?
        AND recorded_date >= date('now', ?)
      ORDER BY recorded_date ASC
    `).all(userId, `-${days} days`);

    // ---- Totals ----
    const totals = db.prepare(`
      SELECT
        COALESCE(SUM(download_gb), 0) as total_download,
        COALESCE(SUM(upload_gb), 0) as total_upload,
        COALESCE(SUM(online_hours), 0) as total_online,
        COALESCE(AVG(avg_ping), 0) as avg_ping,
        COALESCE(MAX(download_gb), 0) as max_download,
        COALESCE(MIN(avg_ping), 0) as min_ping
      FROM usage_stats
      WHERE user_id = ?
        AND recorded_date >= date('now', ?)
    `).get(userId, `-${days} days`);

    // ---- Averages ----
    const avgDaily = dailyStats.length > 0
      ? {
          downloadGb: totals.total_download / dailyStats.length,
          uploadGb: totals.total_upload / dailyStats.length,
          onlineHours: totals.total_online / dailyStats.length
        }
      : { downloadGb: 0, uploadGb: 0, onlineHours: 0 };

    // ---- Peak day ----
    const peakDay = dailyStats.reduce((max, d) =>
      d.download_gb > (max?.download_gb || 0) ? d : max
    , null);

    return success(res, {
      period: {
        days,
        startDate: dailyStats[0]?.date || null,
        endDate: dailyStats[dailyStats.length - 1]?.date || null,
        recordCount: dailyStats.length
      },
      totals: {
        downloadGb: Math.round(totals.total_download * 10) / 10,
        uploadGb: Math.round(totals.total_upload * 10) / 10,
        onlineHours: Math.round(totals.total_online * 10) / 10,
        avgPing: Math.round(totals.avg_ping * 10) / 10,
        maxDownloadGb: Math.round(totals.max_download * 10) / 10,
        minPing: Math.round(totals.min_ping * 10) / 10
      },
      average: {
        downloadGbPerDay: Math.round(avgDaily.downloadGb * 10) / 10,
        uploadGbPerDay: Math.round(avgDaily.uploadGb * 10) / 10,
        onlineHoursPerDay: Math.round(avgDaily.onlineHours * 10) / 10
      },
      peakDay: peakDay ? {
        date: peakDay.date,
        downloadGb: Math.round(peakDay.download_gb * 10) / 10
      } : null,
      daily: dailyStats.map(d => ({
        date: d.date,
        downloadGb: Math.round(d.download_gb * 10) / 10,
        uploadGb: Math.round(d.upload_gb * 10) / 10,
        onlineHours: Math.round(d.online_hours * 10) / 10,
        avgPing: Math.round(d.avg_ping * 10) / 10
      }))
    }, 'Statistik penggunaan berhasil diambil.');

  } catch (err) {
    console.error('❌ Get usage stats error:', err.message);
    return error(res, 'Terjadi kesalahan pada server.', 500, 'SERVER_ERROR');
  }
};

/**
 * GET /api/invoices/summary
 * Ringkasan tagihan (untuk dashboard widget)
 */
exports.getInvoiceSummary = (req, res) => {
  try {
    const userId = req.user.id;

    // Auto-mark overdue
    autoMarkOverdue(userId);

    const summary = db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid_count,
        SUM(CASE WHEN status = 'unpaid' THEN 1 ELSE 0 END) as unpaid_count,
        SUM(CASE WHEN status = 'overdue' THEN 1 ELSE 0 END) as overdue_count,
        COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0) as total_paid,
        COALESCE(SUM(CASE WHEN status IN ('unpaid', 'overdue') THEN amount ELSE 0 END), 0) as total_due
      FROM invoices
      WHERE user_id = ?
    `).get(userId);

    // Upcoming due (invoice berikutnya)
    const nextDue = db.prepare(`
      SELECT * FROM invoices
      WHERE user_id = ? AND status IN ('unpaid', 'overdue')
      ORDER BY due_date ASC
      LIMIT 1
    `).get(userId);

    return success(res, {
      counts: {
        total: summary.total,
        paid: summary.paid_count || 0,
        unpaid: summary.unpaid_count || 0,
        overdue: summary.overdue_count || 0
      },
      amounts: {
        totalPaid: summary.total_paid || 0,
        totalDue: summary.total_due || 0
      },
      nextDue: nextDue ? formatInvoice(nextDue) : null
    }, 'Ringkasan tagihan berhasil diambil.');

  } catch (err) {
    console.error('❌ Get invoice summary error:', err.message);
    return error(res, 'Terjadi kesalahan pada server.', 500, 'SERVER_ERROR');
  }
};

/**
 * GET /api/invoices/:id/download
 * Data invoice untuk PDF generation di frontend
 */
exports.downloadInvoice = (req, res) => {
  try {
    const userId = req.user.id;
    const invoiceId = parseInt(req.params.id, 10);

    if (isNaN(invoiceId)) {
      return error(res, 'ID invoice tidak valid.', 400, 'INVALID_ID');
    }

    const data = db.prepare(`
      SELECT i.*,
             u.name as customer_name, u.email as customer_email,
             u.phone as customer_phone, u.customer_id as customer_code,
             u.address as customer_address,
             p.name as package_name, p.speed as package_speed, p.price as package_price
      FROM invoices i
      LEFT JOIN users u ON i.user_id = u.id
      LEFT JOIN subscriptions s ON i.subscription_id = s.id
      LEFT JOIN packages p ON s.package_id = p.id
      WHERE i.id = ? AND i.user_id = ?
    `).get(invoiceId, userId);

    if (!data) {
      return error(res, 'Invoice tidak ditemukan.', 404, 'INVOICE_NOT_FOUND');
    }

    // Format untuk PDF generation di frontend
    return success(res, {
      invoice: {
        number: data.invoice_number,
        period: data.period,
        amount: data.amount,
        dueDate: data.due_date,
        status: data.status,
        paidAt: data.paid_at,
        paymentMethod: data.payment_method,
        issuedAt: data.created_at
      },
      company: {
        name: 'PT Indotel Network Indonesia',
        address: 'Jl. Teknologi Digital No. 88, Jakarta Selatan 12190',
        phone: '(021) 1234-5678',
        email: 'billing@indotel.id',
        npwp: '01.234.567.8-901.000',
        website: 'www.indotel.id'
      },
      customer: {
        name: data.customer_name,
        customerId: data.customer_code,
        email: data.customer_email,
        phone: data.customer_phone,
        address: data.customer_address
      },
      item: data.package_name ? {
        description: `Layanan Internet ${data.package_name}`,
        speed: data.package_speed,
        period: data.period,
        amount: data.amount
      } : {
        description: 'Layanan Internet Indotel',
        period: data.period,
        amount: data.amount
      },
      notes: data.notes
    }, 'Data invoice berhasil diambil.');

  } catch (err) {
    console.error('❌ Download invoice error:', err.message);
    return error(res, 'Terjadi kesalahan pada server.', 500, 'SERVER_ERROR');
  }
};

// ============ EXPORTS ============
module.exports = {
  getMyInvoices: exports.getMyInvoices,
  getInvoiceById: exports.getInvoiceById,
  payInvoice: exports.payInvoice,
  cancelInvoice: exports.cancelInvoice,
  getUsageStats: exports.getUsageStats,
  getInvoiceSummary: exports.getInvoiceSummary,
  downloadInvoice: exports.downloadInvoice
};
