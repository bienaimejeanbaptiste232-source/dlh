/**
 * migrate_to_supabase.js
 * Migre tout done SQLite lokal → Supabase (REST via @supabase/supabase-js)
 * Koòm kolòn Supabase yo: verifye nan supabase_schema.sql
 */
const { createClient } = require('@supabase/supabase-js');
const sqlite3 = require('sqlite3');
const path = require('path');

const SUPABASE_URL = 'https://xwmxgpdkmrzoraibdzrf.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3bXhncGRrbXJ6b3JhaWJkenJmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTQyMDYxMywiZXhwIjoyMTA2OTk2NjEzfQ.Bg6Sv7HR35FShSu9QiTpYcYKUq8RrH3tg0IPFYq6zQU';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
const db = new sqlite3.Database(path.join(__dirname, 'data/dev.sqlite'));

function q(sql, params) {
  return new Promise((resolve, reject) => {
    db.all(sql, params || [], (err, rows) => err ? reject(err) : resolve(rows));
  });
}

function b(v) { return v === 1 || v === true; }
function f(v) { return parseFloat(v) || 0; }
function i(v) { return parseInt(v) || 0; }
function s(v) { return v || null; }

async function clearTable(table) {
  // Use delete with a condition that matches all rows
  const { error } = await supabase.from(table).delete().gt('id', '00000000-0000-0000-0000-000000000000');
  if (error && !error.message.includes('0 rows')) {
    // Try another approach for tables with non-UUID primary keys or empty tables
  }
}

async function insert(table, rows, label) {
  if (!rows || rows.length === 0) {
    console.log(`   ⏭️  ${label}: vide`);
    return 0;
  }
  let ok = 0;
  const BATCH = 50;
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    const { error } = await supabase.from(table).upsert(batch);
    if (error) {
      console.error(`   ❌ ${label}: ${error.message}`);
      return ok;
    }
    ok += batch.length;
  }
  console.log(`   ✅ ${label}: ${ok} lignes`);
  return ok;
}

async function migrate() {
  console.log('═══════════════════════════════════════════');
  console.log('  🚀 MIGRATION SQLite → Supabase');
  console.log('═══════════════════════════════════════════\n');

  // ─── STEP 1: Clear all tables (reverse dependency order) ───
  console.log('🧹 Nettoyage des tables existantes...');
  const clearOrder = [
    'wallet_transactions', 'payments', 'order_items', 'orders',
    'driver_profiles', 'addresses', 'wallets', 'products',
    'categories', 'merchants', 'delivery_zones', 'users'
  ];
  for (const t of clearOrder) {
    await supabase.from(t).delete().neq('id', '');
  }
  console.log('   ✅ Tables vidées\n');

  // ─── STEP 2: Users ──────────────────────────────────────────
  console.log('1️⃣  Users...');
  const rawUsers = await q('SELECT * FROM users');
  await insert('users', rawUsers.map(u => ({
    id: u.id,
    phoneNumber: u.phoneNumber,
    email: s(u.email),
    passwordHash: u.passwordHash,
    firstName: u.firstName,
    lastName: u.lastName,
    role: u.role || 'CUSTOMER',
    isActive: b(u.isActive),
    isPhoneVerified: b(u.isPhoneVerified),
    avatarUrl: s(u.avatarUrl),
    languagePreference: u.languagePreference || 'ht',
    createdAt: u.createdAt || new Date().toISOString(),
    updatedAt: u.updatedAt || new Date().toISOString(),
  })), 'users');

  // ─── STEP 3: Delivery Zones ────────────────────────────────
  console.log('2️⃣  Zones de livraison...');
  const rawZones = await q('SELECT * FROM delivery_zones');
  await insert('delivery_zones', rawZones.map((z, idx) => ({
    id: z.id,
    name: z.name,
    code: z.code || `ZONE-${String(idx + 1).padStart(2, '0')}`,
    baseFee: f(z.baseDeliveryFee),
    perKmFee: f(z.perKmFee),
    riskLevel: z.riskLevel || 'NORMAL',
    isActive: z.isActive !== 0 && z.isActive !== false,
    createdAt: z.createdAt || new Date().toISOString(),
  })), 'delivery_zones');

  // ─── STEP 4: Merchants ─────────────────────────────────────
  console.log('3️⃣  Marchands...');
  const rawMerchants = await q('SELECT * FROM merchants');
  await insert('merchants', rawMerchants.map(m => ({
    id: m.id,
    ownerId: m.ownerId,
    name: m.name,
    type: m.type || 'RESTAURANT',
    address: m.address || 'Port-au-Prince',
    latitude: f(m.latitude) || 18.54,
    longitude: f(m.longitude) || -72.34,
    zoneId: s(m.zoneId),
    phone: m.phone || '+50900000000',
    logoUrl: s(m.logoUrl),
    bannerUrl: s(m.bannerUrl),
    commissionRate: f(m.commissionRate) || 15.0,
    avgPrepTimeMinutes: i(m.avgPrepTimeMinutes) || 25,
    isOpen: b(m.isOpen),
    isVerified: b(m.isVerified),
    openingHours: s(m.openingHours),
    createdAt: m.createdAt || new Date().toISOString(),
  })), 'merchants');

  // ─── STEP 5: Categories ────────────────────────────────────
  console.log('4️⃣  Catégories...');
  const rawCats = await q('SELECT * FROM categories');
  await insert('categories', rawCats.map(c => ({
    id: c.id,
    merchantId: c.merchantId,
    name: c.name,
    description: s(c.description),
    displayOrder: i(c.displayOrder),
    isActive: b(c.isActive),
  })), 'categories');

  // ─── STEP 6: Products ──────────────────────────────────────
  console.log('5️⃣  Produits...');
  const rawProducts = await q('SELECT * FROM products');
  await insert('products', rawProducts.map(p => ({
    id: p.id,
    merchantId: p.merchantId,
    categoryId: s(p.categoryId),
    name: p.name,
    description: s(p.description),
    price: f(p.price),
    currency: 'HTG',
    imageUrl: s(p.imageUrl),
    isAvailable: b(p.isAvailable),
    prepTimeMinutes: i(p.prepTimeMinutes) || 15,
    createdAt: p.createdAt || new Date().toISOString(),
  })), 'products');

  // ─── STEP 7: Driver Profiles ───────────────────────────────
  console.log('6️⃣  Profils livreurs...');
  const rawDrivers = await q('SELECT * FROM drivers');
  const driverUsers = await q("SELECT id FROM users WHERE role = 'DRIVER'");

  await insert('driver_profiles', rawDrivers.map((d, idx) => ({
    id: d.id,
    userId: driverUsers[idx] ? driverUsers[idx].id : d.id,
    vehicleType: d.vehicleType || 'MOTO',
    vehiclePlate: s(d.licensePlate || d.vehiclePlate),
    vehicleModel: s(d.vehicleModel),
    licenseNumber: s(d.identityCardNumber || d.licenseNumber),
    licensePhotoUrl: s(d.driverLicensePhoto),
    idCardPhotoUrl: s(d.identityCardPhoto),
    isApproved: b(d.isVerified),
    status: d.status || 'OFFLINE',
    currentLatitude: d.currentLatitude ? f(d.currentLatitude) : null,
    currentLongitude: d.currentLongitude ? f(d.currentLongitude) : null,
    rating: f(d.ratingAvg) || 5.0,
    totalDeliveries: i(d.totalDeliveries),
    assignedZoneId: null,
    createdAt: d.createdAt || new Date().toISOString(),
  })), 'driver_profiles');

  // ─── STEP 8: Addresses ─────────────────────────────────────
  console.log('7️⃣  Adresses...');
  const rawAddresses = await q('SELECT * FROM addresses');
  await insert('addresses', rawAddresses.map(a => ({
    id: a.id,
    userId: a.userId,
    title: a.title || a.label || 'Kay',
    fullAddress: a.fullAddress || a.street || 'Port-au-Prince',
    landmark: s(a.landmark),
    latitude: f(a.latitude) || 18.54,
    longitude: f(a.longitude) || -72.34,
    isDefault: b(a.isDefault),
    createdAt: a.createdAt || new Date().toISOString(),
  })), 'addresses');

  // ─── STEP 9: Wallets ───────────────────────────────────────
  console.log('8️⃣  Portefeuilles...');
  const rawWallets = await q('SELECT * FROM wallets');
  await insert('wallets', rawWallets.map(w => ({
    id: w.id,
    userId: w.userId,
    balance: f(w.balance),
    currency: 'HTG',
    isFrozen: b(w.isFrozen),
    updatedAt: w.updatedAt || new Date().toISOString(),
  })), 'wallets');

  // ─── STEP 10: Orders ───────────────────────────────────────
  console.log('9️⃣  Commandes...');
  const rawOrders = await q('SELECT * FROM orders');
  await insert('orders', rawOrders.map(o => {
    let addr = o.deliveryAddress;
    if (addr && typeof addr === 'string') {
      try { addr = JSON.stringify(JSON.parse(addr)); } catch(e) {}
    }
    return {
      id: o.id,
      orderNumber: o.orderNumber,
      customerId: o.customerId,
      merchantId: o.merchantId,
      driverId: s(o.driverId),
      status: o.status || 'PENDING',
      paymentMethod: o.paymentMethod || 'CASH_ON_DELIVERY',
      paymentStatus: o.paymentStatus || 'PENDING',
      subtotal: f(o.subtotalAmount || o.subtotal),
      deliveryFee: f(o.deliveryFee),
      serviceFee: f(o.serviceFee),
      total: f(o.totalAmount || o.total),
      currency: 'HTG',
      deliveryAddress: typeof addr === 'string' ? addr : 'Port-au-Prince',
      deliveryLatitude: f(o.deliveryLatitude) || 18.54,
      deliveryLongitude: f(o.deliveryLongitude) || -72.34,
      merchantLatitude: f(o.merchantLatitude) || 18.51,
      merchantLongitude: f(o.merchantLongitude) || -72.29,
      distanceKm: f(o.distanceKm),
      notesForDriver: s(o.notesForDriver),
      notesForMerchant: s(o.notesForMerchant),
      estimatedDeliveryTimeMinutes: i(o.estimatedDeliveryTimeMinutes) || 35,
      createdAt: o.createdAt || new Date().toISOString(),
      updatedAt: o.updatedAt || new Date().toISOString(),
    };
  }), 'orders');

  // ─── STEP 11: Order Items ──────────────────────────────────
  console.log('🔟 Articles des commandes...');
  const rawItems = await q('SELECT * FROM order_items');
  await insert('order_items', rawItems.map(item => ({
    id: item.id,
    orderId: item.orderId,
    productId: s(item.productId),
    productName: item.productName || item.name || 'Produit',
    unitPrice: f(item.unitPrice),
    quantity: i(item.quantity) || 1,
    totalPrice: f(item.totalPrice),
    notes: s(item.notes),
  })), 'order_items');

  // ─── FINAL VERIFICATION ────────────────────────────────────
  console.log('\n═══════════════════════════════════════════');
  console.log('  📊 VÉRIFICATION FINALE SUR SUPABASE');
  console.log('═══════════════════════════════════════════');
  const tables = [
    ['users', '👥'], ['delivery_zones', '📍'], ['merchants', '🍽️'],
    ['categories', '📂'], ['products', '🛒'], ['driver_profiles', '🏍️'],
    ['addresses', '🏠'], ['wallets', '💰'], ['orders', '📦'],
    ['order_items', '📋']
  ];
  let allGood = true;
  for (const [t, icon] of tables) {
    const { count, error } = await supabase.from(t).select('*', { count: 'exact', head: true });
    const status = count > 0 ? '✅' : '⚪';
    if (error) allGood = false;
    console.log(`  ${status} ${icon} ${t.padEnd(20)}: ${count !== null ? count + ' lignes' : '❌ ' + error?.message}`);
  }

  console.log('\n' + (allGood ? '🎉 Migration réussie! Toutes les données sont sur Supabase.' : '⚠️  Migration partielle. Vérifiez les erreurs ci-dessus.'));
  db.close();
}

migrate().catch(e => {
  console.error('\n❌ Erreur fatale:', e.message);
  db.close();
  process.exit(1);
});
