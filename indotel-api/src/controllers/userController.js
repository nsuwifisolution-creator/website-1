/**
 * ============================================================
 *  USER CONTROLLER
 *  Handle: dashboard summary, support tickets, activity log
 *  - Dashboard summary (aggregate data untuk halaman utama)
 *  - Support ticket (CRUD)
 *  - User activity log
 *  - Quick stats (koneksi, uptime, dll)
 * ============================================================
 */

const db = require('../config/database');

// ============ CONSTANTS ============
const VALID_TICKET_STATUSES = ['open', 'in_progress', 'resolved', 'closed'];
const VALID_PRIORITIES = ['low', 'normal', 'high', 'urgent'];
const MAX_TICKET_SUBJECT_LENGTH = 200;
const MAX_TICKET_MESSAGE_LENGTH = 2000;

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
 * Format ticket untuk response
 */
function formatTicket(ticket) {
  return {
    id: ticket.id,
    subject: ticket.subject,
    message: ticket.message,
    status: ticket.status,
    priority: ticket.priority,
    adminReply: ticket.admin_reply || null,
    resolvedAt: ticket.resolved_at || null,
    createdAt: ticket.created_at,
    updatedAt: ticket.updated_at
  };
}

/**
 * Hitung sisa hari
 */
function calculateDaysLeft(endDate) {
  if (!endDate) return 0;
  const end = new Date(endDate);
  const now = new Date();
  const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
}

/**
 * Ambil info subscription aktif user
 */
function getActiveSubscription(userId) {
  return db.prepare(`
    SELECT
      s.id, s.status, s.start_date, s.end_date,
      p.id as package_id, p.name as package_name, p.slug as package_slug,
      p.speed, p.price, p.features
    FROM subscriptions s
    JOIN packages p ON s.package_id = p.id
    WHERE s.user_id = ? AND s.status = 'active'
    ORDER BY s.created_at DESC
    LIMIT 1
  `).get(userId);
}

/**
 * Ambil ringkasan billing user
 */
function getBillingSummary(userId) {
  // Auto-mark overdue dulu
  try {
    db.prepare(`
      UPDATE invoices
      SET status = 'overdue'
      WHERE user_id = ? AND status = 'unpaid'
        AND due_date < datetime('now')
    `).run(userId);
  } catch (err) {
    console.error('⚠️  Auto-mark overdue error:', err.message);
  }

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

  // Next due
  const nextDue = db.prepare(`
    SELECT id, invoice_number, amount, period, due_date, status
    FROM invoices
    WHERE user_id = ? AND status IN ('unpaid', 'overdue')
    ORDER BY due_date ASC
    LIMIT 1
  `).get(userId);

  return {
    totalInvoices: summary.total || 0,
    paidCount: summary.paid_count || 0,
    unpaidCount: summary.unpaid_count || 0,
    overdueCount: summary.overdue_count || 0,
    totalDue: summary.total_due || 0,
    nextDue: nextDue ? {
      id: nextDue.id,
      invoiceNumber: nextDue.invoice_number,
      amount: nextDue.amount,
      period: nextDue.period,
      dueDate: nextDue.due_date,
      status: nextDue.status,
      daysUntilDue: calculateDaysLeft(nextDue.due_date)
    } : null
  };
}

/**
 * Ambil ringkasan usage 7 hari terakhir
 */
function getUsageSummary(userId, days = 7) {
  const usage = db.prepare(`
    SELECT
      COALESCE(SUM(download_gb), 0) as total_download,
      COALESCE(SUM(upload_gb), 0) as total_upload,
      COALESCE(SUM(online_hours), 0) as total_online,
      COALESCE(AVG(avg_ping), 0) as avg_ping,
      COUNT(*) as record_count
    FROM usage_stats
    WHERE user_id = ? AND recorded_date >= date('now', ?)
  `).get(userId, `-${days} days`);

  return {
    period: `${days} hari terakhir`,
    downloadGb: Math.round(usage.total_download * 10) / 10,
    uploadGb: Math.round(usage.total_upload * 10) / 10,
    onlineHours: Math.round(usage.total_online * 10) / 10,
    avgPing: Math.round(usage.avg_ping * 10) / 10,
    recordCount: usage.record_count
  };
}

/**
 * Ambil jumlah ticket aktif
 */
function getTicketSummary(userId) {
  const summary = db.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as open_count,
      SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as progress_count,
      SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved_count,
      SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed_count
    FROM support_tickets
    WHERE user_id = ?
  `).get(userId);

  return {
    total: summary.total || 0,
    open: summary.open_count || 0,
    inProgress: summary.progress_count || 0,
    resolved: summary.resolved_count || 0,
    closed: summary.closed_count || 0,
    active: (summary.open_count || 0) + (summary.progress_count || 0)
  };
}

// ============================================================
//  CONTROLLER FUNCTIONS
// ============================================================

/**
 * GET /api/users/dashboard
 * Ringkasan lengkap untuk dashboard pelanggan
 * Protected
 */
exports.getDashboardSummary = (req, res) => {
  try {
    const userId = req.user.id;

    // ---- Ambil data user ----
    const user = db.prepare(`
      SELECT id, name, email, phone, role, customer_id, address, created_at
      FROM users WHERE id = ?
    `).get(userId);

    if (!user) {
      return error(res, 'User tidak ditemukan.', 404, 'USER_NOT_FOUND');
    }

    // ---- Subscription aktif ----
    const subscription = getActiveSubscription(userId);

    // ---- Billing summary ----
    const billing = getBillingSummary(userId);

    // ---- Usage summary (7 hari) ----
    const usage = getUsageSummary(userId, 7);

    // ---- Support tickets ----
    const tickets = getTicketSummary(userId);

    // ---- Koneksi info (simulasi — di produksi dari sistem NOC) ----
    const connection = subscription ? {
      status: 'online',
      speed: subscription.speed,
      uptime: '99.9%',
      lastSync: new Date().toISOString(),
      ipAddress: '10.0.' + (userId % 255) + '.' + ((userId * 7) % 255)
    } : {
      status: 'inactive',
      speed: null,
      uptime: null,
      lastSync: null,
      ipAddress: null
    };

    // ---- Build response ----
    return success(res, {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        customerId: user.customer_id,
        address: user.address,
        memberSince: user.created_at
      },
      subscription: subscription ? {
        id: subscription.id,
        packageName: subscription.package_name,
        packageSlug: subscription.package_slug,
        speed: subscription.speed,
        price: subscription.price,
        status: subscription.status,
        startDate: subscription.start_date,
        endDate: subscription.end_date,
        daysLeft: calculateDaysLeft(subscription.end_date)
      } : null,
      connection,
      billing,
      usage,
      tickets,
      // Greeting berdasarkan waktu
      greeting: getGreeting(),
      serverTime: new Date().toISOString()
    }, 'Dashboard summary berhasil diambil.');

  } catch (err) {
    console.error('❌ Get dashboard summary error:', err.message);
    console.error(err.stack);
    return error(res, 'Terjadi kesalahan pada server.', 500, 'SERVER_ERROR');
  }
};

/**
 * Helper: greeting berdasarkan waktu server
 */
function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Selamat pagi';
  if (hour < 15) return 'Selamat siang';
  if (hour < 18) return 'Selamat sore';
  return 'Selamat malam';
}

/**
 * GET /api/users/stats
 * Statistik ringkas untuk widget (tanpa data user)
 */
exports.getQuickStats = (req, res) => {
  try {
    const userId = req.user.id;

    const subscription = getActiveSubscription(userId);
    const billing = getBillingSummary(userId);
    const usage = getUsageSummary(userId, 7);

    return success(res, {
      speed: subscription?.speed || '-',
      daysLeft: subscription ? calculateDaysLeft(subscription.end_date) : 0,
      totalDue: billing.totalDue,
      unpaidCount: billing.unpaidCount,
      downloadGb: usage.downloadGb,
      uploadGb: usage.uploadGb,
      avgPing: usage.avgPing
    }, 'Statistik berhasil diambil.');

  } catch (err) {
    console.error('❌ Get quick stats error:', err.message);
    return error(res, 'Terjadi kesalahan pada server.', 500, 'SERVER_ERROR');
  }
};

/**
 * POST /api/users/support-ticket
 * Buat tiket bantuan baru
 *
 * Body: { subject, message, priority? }
 */
exports.createSupportTicket = (req, res) => {
  try {
    const userId = req.user.id;
    const { subject, message, priority = 'normal' } = req.body;

    // ---- Validasi ----
    if (!subject || !subject.trim()) {
      return error(res, 'Subjek tiket wajib diisi.', 400, 'MISSING_SUBJECT');
    }

    if (!message || !message.trim()) {
      return error(res, 'Pesan tiket wajib diisi.', 400, 'MISSING_MESSAGE');
    }

    const trimmedSubject = subject.trim();
    const trimmedMessage = message.trim();

    if (trimmedSubject.length > MAX_TICKET_SUBJECT_LENGTH) {
      return error(
        res,
        `Subjek maksimal ${MAX_TICKET_SUBJECT_LENGTH} karakter.`,
        400,
        'SUBJECT_TOO_LONG'
      );
    }

    if (trimmedMessage.length > MAX_TICKET_MESSAGE_LENGTH) {
      return error(
        res,
        `Pesan maksimal ${MAX_TICKET_MESSAGE_LENGTH} karakter.`,
        400,
        'MESSAGE_TOO_LONG'
      );
    }

    if (!VALID_PRIORITIES.includes(priority)) {
      return error(
        res,
        `Priority tidak valid. Pilihan: ${VALID_PRIORITIES.join(', ')}`,
        400,
        'INVALID_PRIORITY'
      );
    }

    // ---- Limit: maks 5 ticket aktif sekaligus ----
    const activeCount = db.prepare(`
      SELECT COUNT(*) as count FROM support_tickets
      WHERE user_id = ? AND status IN ('open', 'in_progress')
    `).get(userId);

    if (activeCount.count >= 5) {
      return error(
        res,
        'Anda memiliki 5 tiket aktif. Selesaikan tiket sebelumnya atau hubungi CS.',
        429,
        'TOO_MANY_ACTIVE_TICKETS'
      );
    }

    // ---- Insert ticket ----
    const result = db.prepare(`
      INSERT INTO support_tickets (user_id, subject, message, status, priority)
      VALUES (?, ?, ?, 'open', ?)
    `).run(userId, trimmedSubject, trimmedMessage, priority);

    const ticket = db.prepare('SELECT * FROM support_tickets WHERE id = ?')
      .get(result.lastInsertRowid);

    console.log(`✅ Support ticket created: #${ticket.id} (user ${userId})`);

    return success(res, {
      ticket: formatTicket(ticket)
    }, 'Tiket bantuan berhasil dibuat. Tim kami akan segera menghubungi Anda.', 201);

  } catch (err) {
    console.error('❌ Create support ticket error:', err.message);
    return error(res, 'Terjadi kesalahan pada server.', 500, 'SERVER_ERROR');
  }
};

/**
 * GET /api/users/support-tickets
 * List semua tiket user
 *
 * Query: ?status=open|in_progress|resolved|closed
 */
exports.getMySupportTickets = (req, res) => {
  try {
    const userId = req.user.id;
    const { status } = req.query;

    let query = 'SELECT * FROM support_tickets WHERE user_id = ?';
    const params = [userId];

    if (status && VALID_TICKET_STATUSES.includes(status)) {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC';

    const tickets = db.prepare(query).all(...params);

    return success(res, {
      tickets: tickets.map(formatTicket),
      summary: getTicketSummary(userId)
    }, 'Daftar tiket berhasil diambil.');

  } catch (err) {
    console.error('❌ Get my support tickets error:', err.message);
    return error(res, 'Terjadi kesalahan pada server.', 500, 'SERVER_ERROR');
  }
};

/**
 * GET /api/users/support-tickets/:id
 * Detail satu tiket
 */
exports.getSupportTicketById = (req, res) => {
  try {
    const userId = req.user.id;
    const ticketId = parseInt(req.params.id, 10);

    if (isNaN(ticketId)) {
      return error(res, 'ID tiket tidak valid.', 400, 'INVALID_ID');
    }

    const ticket = db.prepare(`
      SELECT * FROM support_tickets
      WHERE id = ? AND user_id = ?
    `).get(ticketId, userId);

    if (!ticket) {
      return error(res, 'Tiket tidak ditemukan.', 404, 'TICKET_NOT_FOUND');
    }

    return success(res, {
      ticket: formatTicket(ticket)
    }, 'Detail tiket berhasil diambil.');

  } catch (err) {
    console.error('❌ Get support ticket error:', err.message);
    return error(res, 'Terjadi kesalahan pada server.', 500, 'SERVER_ERROR');
  }
};

/**
 * POST /api/users/support-tickets/:id/reply
 * Balas tiket (customer)
 *
 * Body: { message }
 */
exports.replySupportTicket = (req, res) => {
  try {
    const userId = req.user.id;
    const ticketId = parseInt(req.params.id, 10);
    const { message } = req.body;

    if (isNaN(ticketId)) {
      return error(res, 'ID tiket tidak valid.', 400, 'INVALID_ID');
    }

    if (!message || !message.trim()) {
      return error(res, 'Pesan balasan wajib diisi.', 400, 'MISSING_MESSAGE');
    }

    const ticket = db.prepare(`
      SELECT * FROM support_tickets
      WHERE id = ? AND user_id = ?
    `).get(ticketId, userId);

    if (!ticket) {
      return error(res, 'Tiket tidak ditemukan.', 404, 'TICKET_NOT_FOUND');
    }

    if (ticket.status === 'closed') {
      return error(res, 'Tiket sudah ditutup. Buat tiket baru jika ada kendala.', 400, 'TICKET_CLOSED');
    }

    // Append message dengan prefix [Customer]
    const timestamp = new Date().toISOString();
    const appendedMessage = `${ticket.message}\n\n--- [Customer @ ${timestamp}] ---\n${message.trim()}`;

    db.prepare(`
      UPDATE support_tickets
      SET message = ?,
          status = CASE WHEN status = 'resolved' THEN 'open' ELSE status END
      WHERE id = ?
    `).run(appendedMessage, ticketId);

    const updated = db.prepare('SELECT * FROM support_tickets WHERE id = ?').get(ticketId);

    console.log(`✅ Ticket #${ticketId} replied by user ${userId}`);

    return success(res, {
      ticket: formatTicket(updated)
    }, 'Balasan berhasil dikirim.');

  } catch (err) {
    console.error('❌ Reply support ticket error:', err.message);
    return error(res, 'Terjadi kesalahan pada server.', 500, 'SERVER_ERROR');
  }
};

/**
 * POST /api/users/support-tickets/:id/close
 * Tutup tiket sendiri (customer)
 */
exports.closeSupportTicket = (req, res) => {
  try {
    const userId = req.user.id;
    const ticketId = parseInt(req.params.id, 10);

    if (isNaN(ticketId)) {
      return error(res, 'ID tiket tidak valid.', 400, 'INVALID_ID');
    }

    const ticket = db.prepare(`
      SELECT * FROM support_tickets
      WHERE id = ? AND user_id = ?
    `).get(ticketId, userId);

    if (!ticket) {
      return error(res, 'Tiket tidak ditemukan.', 404, 'TICKET_NOT_FOUND');
    }

    if (ticket.status === 'closed') {
      return error(res, 'Tiket sudah ditutup sebelumnya.', 400, 'ALREADY_CLOSED');
    }

    db.prepare(`
      UPDATE support_tickets
      SET status = 'closed', resolved_at = datetime('now')
      WHERE id = ?
    `).run(ticketId);

    console.log(`✅ Ticket #${ticketId} closed by user ${userId}`);

    return success(res, {
      ticketId,
      closedAt: new Date().toISOString()
    }, 'Tiket berhasil ditutup. Terima kasih!');

  } catch (err) {
    console.error('❌ Close support ticket error:', err.message);
    return error(res, 'Terjadi kesalahan pada server.', 500, 'SERVER_ERROR');
  }
};

/**
 * GET /api/users/activity
 * Log aktivitas user (berdasarkan data yang ada)
 * Protected
 */
exports.getUserActivity = (req, res) => {
  try {
    const userId = req.user.id;
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));

    // Gabungan aktivitas dari berbagai sumber
    const activities = [];

    // 1. Invoices terbaru
    const invoices = db.prepare(`
      SELECT id, invoice_number, amount, period, status, paid_at, created_at
      FROM invoices
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `).all(userId, limit);

    invoices.forEach(inv => {
      activities.push({
        type: inv.status === 'paid' ? 'payment' : 'invoice',
        title: inv.status === 'paid'
          ? `Pembayaran tagihan ${inv.period}`
          : `Tagihan baru ${inv.period}`,
        description: inv.status === 'paid'
          ? `Pembayaran Rp ${inv.amount.toLocaleString('id-ID')} berhasil`
          : `Tagihan Rp ${inv.amount.toLocaleString('id-ID')} menunggu pembayaran`,
        amount: inv.amount,
        status: inv.status,
        timestamp: inv.paid_at || inv.created_at,
        referenceId: inv.invoice_number
      });
    });

    // 2. Subscription events
    const subs = db.prepare(`
      SELECT s.id, s.status, s.created_at, s.end_date,
             p.name as package_name, p.price, p.speed
      FROM subscriptions s
      JOIN packages p ON s.package_id = p.id
      WHERE s.user_id = ?
      ORDER BY s.created_at DESC
      LIMIT ?
    `).all(userId, limit);

    subs.forEach(sub => {
      activities.push({
        type: 'subscription',
        title: `Langganan ${sub.package_name}`,
        description: `Paket ${sub.speed} - Rp ${sub.price.toLocaleString('id-ID')}/bln`,
        status: sub.status,
        timestamp: sub.created_at,
        referenceId: sub.id
      });
    });

    // 3. Support tickets
    const tickets = db.prepare(`
      SELECT id, subject, status, created_at, updated_at
      FROM support_tickets
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `).all(userId, limit);

    tickets.forEach(t => {
      activities.push({
        type: 'support',
        title: `Tiket: ${t.subject}`,
        description: `Status: ${t.status.replace('_', ' ')}`,
        status: t.status,
        timestamp: t.updated_at || t.created_at,
        referenceId: t.id
      });
    });

    // Sort by timestamp desc & limit
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const limited = activities.slice(0, limit);

    return success(res, {
      activities: limited,
      total: activities.length
    }, 'Aktivitas berhasil diambil.');

  } catch (err) {
    console.error('❌ Get user activity error:', err.message);
    return error(res, 'Terjadi kesalahan pada server.', 500, 'SERVER_ERROR');
  }
};

/**
 * GET /api/users/connection-info
 * Info koneksi user (untuk widget jaringan)
 * Protected
 */
exports.getConnectionInfo = (req, res) => {
  try {
    const userId = req.user.id;

    const subscription = getActiveSubscription(userId);

    if (!subscription) {
      return error(res, 'Tidak ada langganan aktif.', 404, 'NO_ACTIVE_SUBSCRIPTION');
    }

    // Simulasi info koneksi — di produksi ambil dari sistem NOC/monitoring
    const now = new Date();
    const info = {
      status: 'online',
      packageName: subscription.package_name,
      speed: subscription.speed,
      ipAddress: `10.0.${userId % 255}.${(userId * 7) % 255}`,
      macAddress: `AA:BB:CC:${String(userId % 255).padStart(2, '0')}:${String((userId * 3) % 255).padStart(2, '0')}:FF`,
      dns: ['8.8.8.8', '1.1.1.1'],
      gateway: `10.0.${userId % 255}.1`,
      uptime: '99.9%',
      connectionType: 'Fiber Optic (FTTH)',
      lastSpeedtest: new Date(now.getTime() - 3600000).toISOString(),
      currentSpeed: {
        download: subscription.speed,
        upload: subscription.speed
      },
      latency: 4.5
    };

    return success(res, info, 'Info koneksi berhasil diambil.');

  } catch (err) {
    console.error('❌ Get connection info error:', err.message);
    return error(res, 'Terjadi kesalahan pada server.', 500, 'SERVER_ERROR');
  }
};

/**
 * GET /api/users/notifications
 * List notifikasi user (dari berbagai sumber)
 * Protected
 */
exports.getNotifications = (req, res) => {
  try {
    const userId = req.user.id;
    const limit = Math.min(20, Math.max(1, parseInt(req.query.limit) || 10));

    const notifications = [];

    // 1. Invoice unpaid/overdue
    const unpaidInvoices = db.prepare(`
      SELECT id, invoice_number, amount, period, due_date, status
      FROM invoices
      WHERE user_id = ? AND status IN ('unpaid', 'overdue')
      ORDER BY due_date ASC
      LIMIT ?
    `).all(userId, limit);

    unpaidInvoices.forEach(inv => {
      const daysLeft = calculateDaysLeft(inv.due_date);
      notifications.push({
        type: inv.status === 'overdue' ? 'warning' : 'info',
        category: 'billing',
        title: inv.status === 'overdue'
          ? 'Tagihan Melewati Jatuh Tempo'
          : 'Pengingat Pembayaran',
        message: inv.status === 'overdue'
          ? `Tagihan ${inv.period} sebesar Rp ${inv.amount.toLocaleString('id-ID')} telah melewati jatuh tempo.`
          : `Tagihan ${inv.period} akan jatuh tempo dalam ${daysLeft} hari.`,
        actionUrl: `/dashboard/invoices/${inv.id}`,
        referenceId: inv.id
      });
    });

    // 2. Subscription expiring soon (dalam 7 hari)
    const subscription = getActiveSubscription(userId);
    if (subscription) {
      const daysLeft = calculateDaysLeft(subscription.end_date);
      if (daysLeft <= 7 && daysLeft > 0) {
        notifications.push({
          type: 'warning',
          category: 'subscription',
          title: 'Langganan Akan Berakhir',
          message: `Langganan ${subscription.package_name} akan berakhir dalam ${daysLeft} hari.`,
          actionUrl: '/dashboard/packages',
          referenceId: subscription.id
        });
      }
    }

    // 3. Support ticket replies
    const repliedTickets = db.prepare(`
      SELECT id, subject, status, admin_reply, updated_at
      FROM support_tickets
      WHERE user_id = ? AND admin_reply IS NOT NULL AND status != 'closed'
      ORDER BY updated_at DESC
      LIMIT ?
    `).all(userId, limit);

    repliedTickets.forEach(t => {
      notifications.push({
        type: 'info',
        category: 'support',
        title: 'Balasan dari Customer Support',
        message: `Tiket "${t.subject}" telah dibalas oleh tim kami.`,
        actionUrl: `/dashboard/support/${t.id}`,
        referenceId: t.id
      });
    });

    return success(res, {
      notifications: notifications.slice(0, limit),
      unreadCount: notifications.length
    }, 'Notifikasi berhasil diambil.');

  } catch (err) {
    console.error('❌ Get notifications error:', err.message);
    return error(res, 'Terjadi kesalahan pada server.', 500, 'SERVER_ERROR');
  }
};

// ============ EXPORTS ============
module.exports = {
  getDashboardSummary: exports.getDashboardSummary,
  getQuickStats: exports.getQuickStats,
  createSupportTicket: exports.createSupportTicket,
  getMySupportTickets: exports.getMySupportTickets,
  getSupportTicketById: exports.getSupportTicketById,
  replySupportTicket: exports.replySupportTicket,
  closeSupportTicket: exports.closeSupportTicket,
  getUserActivity: exports.getUserActivity,
  getConnectionInfo: exports.getConnectionInfo,
  getNotifications: exports.getNotifications
};
