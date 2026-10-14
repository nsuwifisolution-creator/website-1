/**
 * ============================================================
 *  DATABASE SEEDER
 *  Mengisi database dengan data awal:
 *  - Admin user
 *  - Demo customer
 *  - 4 paket layanan
 *  - Subscription untuk demo customer
 *  - Invoice (bulan lalu + bulan ini)
 *  - Usage stats (30 hari terakhir)
 *  - Support tickets (contoh)
 * ============================================================
 */

const bcrypt = require('bcryptjs');
const db = require('./database');
require('dotenv').config();

// ============ HELPER FUNCTIONS ============

/**
 * Cek apakah database sudah di-seed sebelumnya
 */
function isAlreadySeeded() {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
  const packageCount = db.prepare('SELECT COUNT(*) as count FROM packages').get();
  return userCount.count > 0 || packageCount.count > 0;
}

/**
 * Format customer ID: IND-YYYY-MM-XXXX
 */
function generateCustomerId(index) {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const num = String(index).padStart(4, '0');
  return `IND-${year}-${month}-${num}`;
}

/**
 * Format invoice number: INV-YYYY-MM-XXXX
 */
function generateInvoiceNumber(year, month, index) {
  const m = String(month).padStart(2, '0');
  const num = String(index).padStart(4, '0');
  return `INV-${year}-${m}-${num}`;
}

/**
 * Format tanggal Indonesia
 */
function formatPeriod(date) {
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  return `${months[date.getMonth()]} ${date.getFullYear()}`;
}

// ============ SEED FUNCTIONS ============

/**
 * Seed packages
 */
function seedPackages() {
  console.log('\n📦 Seeding packages...');

  const insertPackage = db.prepare(`
    INSERT INTO packages (slug, name, speed, price, description, features, is_popular, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const packages = [
    {
      slug: 'home-starter',
      name: 'Home Starter',
      speed: '20 Mbps',
      price: 250000,
      description: 'Internet rumah 20 Mbps untuk kebutuhan sehari-hari',
      features: [
        'Kecepatan 20 Mbps Simetris',
        'Unlimited Tanpa FUP',
        'Gratis Modem WiFi',
        'Gratis Instalasi',
        'Support 24/7'
      ],
      is_popular: 0
    },
    {
      slug: 'home-plus',
      name: 'Home Plus',
      speed: '50 Mbps',
      price: 350000,
      description: 'Internet rumah 50 Mbps untuk streaming & WFH',
      features: [
        'Kecepatan 50 Mbps Simetris',
        'Unlimited Tanpa FUP',
        'Gratis Modem WiFi 5GHz',
        'Gratis Instalasi',
        'IPTV Basic 50 Channel',
        'Priority Support'
      ],
      is_popular: 1
    },
    {
      slug: 'business-pro',
      name: 'Business Pro',
      speed: '100 Mbps',
      price: 750000,
      description: 'Internet bisnis 100 Mbps dengan SLA & static IP',
      features: [
        'Kecepatan 100 Mbps Simetris',
        'Unlimited Tanpa FUP',
        'Static IP Address',
        'SLA 99.9% Uptime',
        'Dedicated Account Manager',
        '24/7 Priority Support'
      ],
      is_popular: 0
    },
    {
      slug: 'corporate',
      name: 'Corporate',
      speed: 'Custom',
      price: 0,
      description: 'Solusi kustom untuk kebutuhan perusahaan',
      features: [
        'Bandwidth Dedicated',
        'Multiple Static IP',
        'SLA Kustom',
        'Redundancy Line',
        'Konsultasi Gratis'
      ],
      is_popular: 0
    }
  ];

  const insertMany = db.transaction((items) => {
    items.forEach(p => {
      insertPackage.run(
        p.slug,
        p.name,
        p.speed,
        p.price,
        p.description,
        JSON.stringify(p.features),
        p.is_popular,
        1
      );
    });
  });

  insertMany(packages);
  console.log(`   ✅ ${packages.length} packages created`);
}

/**
 * Seed admin user
 */
function seedAdmin() {
  console.log('\n👤 Seeding admin...');

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@indotel.id';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!';

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(adminEmail);
  if (existing) {
    console.log(`   ⚠️  Admin already exists: ${adminEmail}`);
    return;
  }

  const hashedPassword = bcrypt.hashSync(adminPassword, 10);

  db.prepare(`
    INSERT INTO users (name, email, phone, password, role, customer_id, address)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    'Administrator Indotel',
    adminEmail,
    '6281200000000',
    hashedPassword,
    'admin',
    'ADM-0001',
    'Kantor Pusat Indotel, Jakarta'
  );

  console.log(`   ✅ Admin created: ${adminEmail} / ${adminPassword}`);
}

/**
 * Seed demo customer + subscription + invoices + usage
 */
function seedDemoCustomer() {
  console.log('\n👥 Seeding demo customer...');

  const demoEmail = 'demo@indotel.id';
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(demoEmail);
  if (existing) {
    console.log(`   ⚠️  Demo customer already exists: ${demoEmail}`);
    return;
  }

  const hashedPassword = bcrypt.hashSync('Demo123!', 10);

  // ---- Insert user ----
  const userResult = db.prepare(`
    INSERT INTO users (name, email, phone, password, role, customer_id, address)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    'Demo Customer',
    demoEmail,
    '6281234567890',
    hashedPassword,
    'customer',
    generateCustomerId(1),
    'Jl. Contoh Raya No. 123, RT 04/RW 05, Jakarta Selatan 12190'
  );

  const userId = userResult.lastInsertRowid;
  console.log(`   ✅ Customer created: ${demoEmail} / Demo123!`);

  // ---- Subscribe ke Home Plus ----
  const homePlus = db.prepare('SELECT id, price FROM packages WHERE slug = ?').get('home-plus');
  if (!homePlus) {
    console.error('   ❌ Package "home-plus" not found. Run seedPackages() first.');
    return;
  }

  const now = new Date();
  const endDate = new Date(now);
  endDate.setDate(endDate.getDate() + 30);

  const subResult = db.prepare(`
    INSERT INTO subscriptions (user_id, package_id, status, start_date, end_date)
    VALUES (?, ?, 'active', datetime('now'), ?)
  `).run(userId, homePlus.id, endDate.toISOString());

  const subscriptionId = subResult.lastInsertRowid;
  console.log(`   ✅ Subscription created (Home Plus, ID: ${subscriptionId})`);

  // ---- Create invoices (3 bulan terakhir) ----
  const monthlyPrice = homePlus.price;

  const invoiceTemplate = db.prepare(`
    INSERT INTO invoices (
      invoice_number, user_id, subscription_id, amount, period,
      due_date, status, paid_at, payment_method
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Invoice 2 bulan lalu (lunas)
  const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);
  const twoMonthsAgoDue = new Date(now.getFullYear(), now.getMonth() - 2, 28);
  invoiceTemplate.run(
    generateInvoiceNumber(twoMonthsAgo.getFullYear(), twoMonthsAgo.getMonth() + 1, 1001),
    userId,
    subscriptionId,
    monthlyPrice,
    formatPeriod(twoMonthsAgo),
    twoMonthsAgoDue.toISOString(),
    'paid',
    new Date(now.getFullYear(), now.getMonth() - 2, 5).toISOString(),
    'Transfer Bank'
  );

  // Invoice 1 bulan lalu (lunas)
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthDue = new Date(now.getFullYear(), now.getMonth() - 1, 28);
  invoiceTemplate.run(
    generateInvoiceNumber(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 1002),
    userId,
    subscriptionId,
    monthlyPrice,
    formatPeriod(lastMonth),
    lastMonthDue.toISOString(),
    'paid',
    new Date(now.getFullYear(), now.getMonth() - 1, 3).toISOString(),
    'Virtual Account'
  );

  // Invoice bulan ini (belum bayar)
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMonthDue = new Date(now.getFullYear(), now.getMonth(), 28);
  invoiceTemplate.run(
    generateInvoiceNumber(thisMonth.getFullYear(), thisMonth.getMonth() + 1, 1003),
    userId,
    subscriptionId,
    monthlyPrice,
    formatPeriod(thisMonth),
    thisMonthDue.toISOString(),
    'unpaid',
    null,
    null
  );

  console.log(`   ✅ 3 invoices created (2 paid, 1 unpaid)`);

  // ---- Usage stats (30 hari terakhir) ----
  const usageTemplate = db.prepare(`
    INSERT INTO usage_stats (
      user_id, download_gb, upload_gb, online_hours, avg_ping, recorded_date
    )
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const insertUsage = db.transaction(() => {
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      // Random realistic values
      const downloadGb = +(Math.random() * 25 + 15).toFixed(2); // 15-40 GB
      const uploadGb = +(Math.random() * 6 + 3).toFixed(2);     // 3-9 GB
      const onlineHours = +(Math.random() * 8 + 12).toFixed(1); // 12-20 jam
      const avgPing = +(Math.random() * 3 + 3).toFixed(1);      // 3-6 ms

      usageTemplate.run(
        userId,
        downloadGb,
        uploadGb,
        onlineHours,
        avgPing,
        dateStr
      );
    }
  });

  insertUsage();
  console.log(`   ✅ 30 days of usage stats created`);

  // ---- Support tickets (contoh) ----
  const ticketTemplate = db.prepare(`
    INSERT INTO support_tickets (user_id, subject, message, status, priority)
    VALUES (?, ?, ?, ?, ?)
  `);

  ticketTemplate.run(
    userId,
    'Internet lambat pada jam 8-10 malam',
    'Koneksi terasa melambat pada jam sibuk. Mohon dicek apakah ada gangguan di area saya.',
    'resolved',
    'normal'
  );

  ticketTemplate.run(
    userId,
    'Request upgrade ke paket Business Pro',
    'Saya tertarik upgrade ke paket Business Pro 100 Mbps. Mohon info prosedurnya.',
    'in_progress',
    'high'
  );

  console.log(`   ✅ 2 support tickets created`);
}

/**
 * Seed additional customers (opsional, untuk testing admin panel)
 */
function seedAdditionalCustomers() {
  console.log('\n👥 Seeding additional customers...');

  const customers = [
    { name: 'Budi Santoso', email: 'budi@example.com', phone: '6281111111111', pkg: 'home-starter' },
    { name: 'Siti Rahmawati', email: 'siti@example.com', phone: '6282222222222', pkg: 'home-plus' },
    { name: 'Agus Wijaya', email: 'agus@example.com', phone: '6283333333333', pkg: 'business-pro' },
    { name: 'Dewi Pratiwi', email: 'dewi@example.com', phone: '6284444444444', pkg: 'home-plus' }
  ];

  const hashedPassword = bcrypt.hashSync('Customer123!', 10);

  const insertUser = db.prepare(`
    INSERT INTO users (name, email, phone, password, role, customer_id)
    VALUES (?, ?, ?, ?, 'customer', ?)
  `);

  const insertSub = db.prepare(`
    INSERT INTO subscriptions (user_id, package_id, status, start_date, end_date)
    VALUES (?, ?, 'active', datetime('now'), datetime('now', '+30 days'))
  `);

  let index = 2;
  customers.forEach(c => {
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(c.email);
    if (existing) {
      console.log(`   ⚠️  ${c.email} already exists`);
      return;
    }

    const result = insertUser.run(
      c.name,
      c.email,
      c.phone,
      hashedPassword,
      generateCustomerId(index)
    );

    const pkg = db.prepare('SELECT id FROM packages WHERE slug = ?').get(c.pkg);
    if (pkg) {
      insertSub.run(result.lastInsertRowid, pkg.id);
    }

    index++;
    console.log(`   ✅ ${c.name} (${c.email})`);
  });

  console.log(`\n   🔑 All additional customers password: Customer123!`);
}

/**
 * Print summary
 */
function printSummary() {
  const stats = {
    users: db.prepare('SELECT COUNT(*) as count FROM users').get().count,
    admins: db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'admin'").get().count,
    customers: db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'customer'").get().count,
    packages: db.prepare('SELECT COUNT(*) as count FROM packages').get().count,
    subscriptions: db.prepare('SELECT COUNT(*) as count FROM subscriptions').get().count,
    invoices: db.prepare('SELECT COUNT(*) as count FROM invoices').get().count,
    paidInvoices: db.prepare("SELECT COUNT(*) as count FROM invoices WHERE status = 'paid'").get().count,
    unpaidInvoices: db.prepare("SELECT COUNT(*) as count FROM invoices WHERE status = 'unpaid'").get().count,
    usageRecords: db.prepare('SELECT COUNT(*) as count FROM usage_stats').get().count,
    tickets: db.prepare('SELECT COUNT(*) as count FROM support_tickets').get().count
  };

  console.log(`
╔══════════════════════════════════════════════════════╗
║   📊 DATABASE SUMMARY                                ║
╠══════════════════════════════════════════════════════╣
║   👤 Users:           ${String(stats.users).padEnd(31)}║
║      - Admins:        ${String(stats.admins).padEnd(31)}║
║      - Customers:     ${String(stats.customers).padEnd(31)}║
║   📦 Packages:        ${String(stats.packages).padEnd(31)}║
║   📡 Subscriptions:   ${String(stats.subscriptions).padEnd(31)}║
║   📄 Invoices:        ${String(stats.invoices).padEnd(31)}║
║      - Paid:          ${String(stats.paidInvoices).padEnd(31)}║
║      - Unpaid:        ${String(stats.unpaidInvoices).padEnd(31)}║
║   📈 Usage Records:   ${String(stats.usageRecords).padEnd(31)}║
║   🎫 Support Tickets: ${String(stats.tickets).padEnd(31)}║
╚══════════════════════════════════════════════════════╝
  `);

  console.log('🔑 LOGIN CREDENTIALS:');
  console.log('   ┌─────────────────────────────────────────────┐');
  console.log('   │ Admin:                                │');
  console.log(`   │   Email:    ${process.env.ADMIN_EMAIL || 'admin@indotel.id'}`.padEnd(47) + '│');
  console.log(`   │   Password: ${process.env.ADMIN_PASSWORD || 'Admin123!'}`.padEnd(47) + '│');
  console.log('   │                                       │');
  console.log('   │ Demo Customer:                        │');
  console.log('   │   Email:    demo@indotel.id           │');
  console.log('   │   Password: Demo123!                  │');
  console.log('   │                                       │');
  console.log('   │ Other Customers (password: Customer123!): │');
  console.log('   │   budi@example.com                    │');
  console.log('   │   siti@example.com                    │');
  console.log('   │   agus@example.com                    │');
  console.log('   │   dewi@example.com                    │');
  console.log('   └─────────────────────────────────────────────┘');
}

// ============ MAIN SEED FUNCTION ============

function seed(options = {}) {
  const { force = false } = options;

  console.log('\n🌱 ═══════════════════════════════════════════');
  console.log('   INDOTEL DATABASE SEEDER');
  console.log('   ═══════════════════════════════════════════\n');

  // Cek apakah sudah pernah di-seed
  if (isAlreadySeeded() && !force) {
    console.log('⚠️  Database already contains data.');
    console.log('   Use --force to re-seed (will DELETE existing data).\n');
    console.log('   Current data:');
    const stats = {
      users: db.prepare('SELECT COUNT(*) as count FROM users').get().count,
      packages: db.prepare('SELECT COUNT(*) as count FROM packages').get().count,
      subscriptions: db.prepare('SELECT COUNT(*) as count FROM subscriptions').get().count,
      invoices: db.prepare('SELECT COUNT(*) as count FROM invoices').get().count
    };
    console.log(`   - Users: ${stats.users}`);
    console.log(`   - Packages: ${stats.packages}`);
    console.log(`   - Subscriptions: ${stats.subscriptions}`);
    console.log(`   - Invoices: ${stats.invoices}\n`);
    return;
  }

  // Force mode: clean existing data
  if (force) {
    console.log('🗑️  Force mode: clearing existing data...');
    db.exec(`
      DELETE FROM support_tickets;
      DELETE FROM usage_stats;
      DELETE FROM invoices;
      DELETE FROM subscriptions;
      DELETE FROM users;
      DELETE FROM packages;
      DELETE FROM sqlite_sequence;
    `);
    console.log('   ✅ All data cleared\n');
  }

  // Start transaction untuk konsistensi
  try {
    const seedTransaction = db.transaction(() => {
      seedPackages();
      seedAdmin();
      seedDemoCustomer();

      // Optional: uncomment jika ingin tambahan customer
      // seedAdditionalCustomers();
    });

    seedTransaction();

    printSummary();

    console.log('\n✅ Seeding completed successfully!\n');
    console.log('📝 Next steps:');
    console.log('   1. Start server:  npm run dev');
    console.log('   2. Test login:    POST /api/auth/login');
    console.log('   3. Check docs:    http://localhost:3000/api/docs\n');
  } catch (err) {
    console.error('\n❌ Seeding failed:', err.message);
    console.error('   Stack:', err.stack);
    process.exit(1);
  }
}

// ============ RUN SEED ============

// Cek argumen CLI: --force untuk reset
const args = process.argv.slice(2);
const force = args.includes('--force') || args.includes('-f');

seed({ force });

// Tutup koneksi database
setTimeout(() => {
  db.close();
  process.exit(0);
}, 100);
