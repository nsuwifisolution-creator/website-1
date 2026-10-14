/**
 * ============================================================
 *  DATABASE CONFIGURATION
 *  SQLite dengan better-sqlite3 (synchronous, fast, no callback)
 *  Auto-initialize schema saat pertama kali dijalankan
 * ============================================================
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// ============ SETUP DATABASE PATH ============
// Support custom path dari .env (untuk Docker)
const DB_PATH = process.env.DB_PATH || './database/indotel.db';
const dbPath = path.isAbsolute(DB_PATH)
  ? DB_PATH
  : path.join(__dirname, '../..', DB_PATH);

// Pastikan folder database ada
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
  console.log(`📁 Created database directory: ${dbDir}`);
}

// ============ INIT DATABASE ============
const db = new Database(dbPath);

// ============ PRAGMA SETTINGS (Performance & Safety) ============
db.pragma('journal_mode = WAL');        // Write-Ahead Logging (concurrent read/write)
db.pragma('foreign_keys = ON');         // Enable foreign key constraints
db.pragma('busy_timeout = 5000');       // Wait 5s if database is locked
db.pragma('synchronous = NORMAL');      // Balance between speed & safety
db.pragma('cache_size = -64000');       // 64MB cache
db.pragma('temp_store = MEMORY');       // Temp tables di memory

console.log(`💾 Database connected: ${dbPath}`);

// ============================================================
//  SCHEMA INITIALIZATION
// ============================================================
function initDatabase() {
  try {
    db.exec(`
      -- ═══════════════════════════════════════════════════════
      --  USERS
      -- ═══════════════════════════════════════════════════════
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'customer' CHECK(role IN ('customer', 'admin')),
        customer_id TEXT UNIQUE,
        address TEXT,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- ═══════════════════════════════════════════════════════
      --  PACKAGES
      -- ═══════════════════════════════════════════════════════
      CREATE TABLE IF NOT EXISTS packages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        slug TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        speed TEXT NOT NULL,
        price INTEGER NOT NULL,
        description TEXT,
        features TEXT,
        is_popular INTEGER DEFAULT 0,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- ═══════════════════════════════════════════════════════
      --  SUBSCRIPTIONS
      -- ═══════════════════════════════════════════════════════
      CREATE TABLE IF NOT EXISTS subscriptions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        package_id INTEGER NOT NULL,
        status TEXT DEFAULT 'active' CHECK(status IN ('active', 'suspended', 'cancelled', 'pending')),
        start_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        end_date DATETIME,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (package_id) REFERENCES packages(id)
      );

      -- ═══════════════════════════════════════════════════════
      --  INVOICES
      -- ═══════════════════════════════════════════════════════
      CREATE TABLE IF NOT EXISTS invoices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        invoice_number TEXT UNIQUE NOT NULL,
        user_id INTEGER NOT NULL,
        subscription_id INTEGER,
        amount INTEGER NOT NULL,
        period TEXT NOT NULL,
        due_date DATETIME NOT NULL,
        status TEXT DEFAULT 'unpaid' CHECK(status IN ('paid', 'unpaid', 'overdue', 'cancelled')),
        paid_at DATETIME,
        payment_method TEXT,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE SET NULL
      );

      -- ═══════════════════════════════════════════════════════
      --  USAGE STATS (per hari)
      -- ═══════════════════════════════════════════════════════
      CREATE TABLE IF NOT EXISTS usage_stats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        download_gb REAL DEFAULT 0,
        upload_gb REAL DEFAULT 0,
        online_hours REAL DEFAULT 0,
        avg_ping REAL DEFAULT 0,
        recorded_date DATE DEFAULT CURRENT_DATE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(user_id, recorded_date)
      );

      -- ═══════════════════════════════════════════════════════
      --  SUPPORT TICKETS
      -- ═══════════════════════════════════════════════════════
      CREATE TABLE IF NOT EXISTS support_tickets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        subject TEXT NOT NULL,
        message TEXT NOT NULL,
        status TEXT DEFAULT 'open' CHECK(status IN ('open', 'in_progress', 'resolved', 'closed')),
        priority TEXT DEFAULT 'normal' CHECK(priority IN ('low', 'normal', 'high', 'urgent')),
        admin_reply TEXT,
        resolved_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      -- ═══════════════════════════════════════════════════════
      --  INDEXES (untuk performa query)
      -- ═══════════════════════════════════════════════════════
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
      CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
      CREATE INDEX IF NOT EXISTS idx_users_customer_id ON users(customer_id);

      CREATE INDEX IF NOT EXISTS idx_packages_slug ON packages(slug);
      CREATE INDEX IF NOT EXISTS idx_packages_active ON packages(is_active);

      CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
      CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
      CREATE INDEX IF NOT EXISTS idx_subscriptions_package ON subscriptions(package_id);

      CREATE INDEX IF NOT EXISTS idx_invoices_user ON invoices(user_id);
      CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
      CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);
      CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices(invoice_number);

      CREATE INDEX IF NOT EXISTS idx_usage_user_date ON usage_stats(user_id, recorded_date);

      CREATE INDEX IF NOT EXISTS idx_tickets_user ON support_tickets(user_id);
      CREATE INDEX IF NOT EXISTS idx_tickets_status ON support_tickets(status);

      -- ═══════════════════════════════════════════════════════
      --  TRIGGERS (auto-update updated_at)
      -- ═══════════════════════════════════════════════════════
      CREATE TRIGGER IF NOT EXISTS trg_users_updated_at
      AFTER UPDATE ON users
      FOR EACH ROW
      BEGIN
        UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
      END;

      CREATE TRIGGER IF NOT EXISTS trg_packages_updated_at
      AFTER UPDATE ON packages
      FOR EACH ROW
      BEGIN
        UPDATE packages SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
      END;

      CREATE TRIGGER IF NOT EXISTS trg_subscriptions_updated_at
      AFTER UPDATE ON subscriptions
      FOR EACH ROW
      BEGIN
        UPDATE subscriptions SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
      END;

      CREATE TRIGGER IF NOT EXISTS trg_invoices_updated_at
      AFTER UPDATE ON invoices
      FOR EACH ROW
      BEGIN
        UPDATE invoices SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
      END;

      CREATE TRIGGER IF NOT EXISTS trg_tickets_updated_at
      AFTER UPDATE ON support_tickets
      FOR EACH ROW
      BEGIN
        UPDATE support_tickets SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
      END;
    `);

    // Verify tables created
    const tables = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
    ).all();

    console.log(`✅ Database initialized (${tables.length} tables)`);
    console.log(`   Tables: ${tables.map(t => t.name).join(', ')}`);
  } catch (err) {
    console.error('❌ Failed to initialize database:', err.message);
    process.exit(1);
  }
}

// Run schema initialization
initDatabase();

// ============ GRACEFUL SHUTDOWN ============
process.on('SIGTERM', () => {
  try {
    db.close();
    console.log('💾 Database connection closed');
  } catch (err) {
    console.error('Error closing database:', err.message);
  }
});

process.on('SIGINT', () => {
  try {
    db.close();
    console.log('💾 Database connection closed');
  } catch (err) {
    console.error('Error closing database:', err.message);
  }
});

// ============ EXPORT ============
module.exports = db;
