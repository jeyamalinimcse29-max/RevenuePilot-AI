import { getDb, db } from './index';

export function seedDatabase(force: boolean = false) {
  const database = getDb();

  const existingMerchant = database.prepare('SELECT COUNT(*) as count FROM merchants').get() as { count: number };
  const existingProducts = database.prepare('SELECT COUNT(*) as count FROM products').get() as { count: number };
  const existingCustomers = database.prepare('SELECT COUNT(*) as count FROM customers').get() as { count: number };
  const existingOpportunities = database.prepare('SELECT COUNT(*) as count FROM opportunities').get() as { count: number };
  const existingCampaigns = database.prepare('SELECT COUNT(*) as count FROM campaigns').get() as { count: number };

  // Fully seeded and not forcing a reset -> no-op (safe on every boot).
  // Requires the whole seed footprint to be present; a database where, say, only
  // customers/products exist but opportunities are missing is considered partial
  // and is rebuilt to a clean baseline below.
  if (
    !force &&
    existingMerchant.count > 0 &&
    existingProducts.count > 0 &&
    existingCustomers.count > 0 &&
    existingOpportunities.count > 0 &&
    existingCampaigns.count > 0
  ) {
    return;
  }

  // Partial / corrupt database (e.g. merchant exists but products are empty) or
  // an explicit reset. A partial seed is self-inconsistent, so re-inserting rows
  // would trip UNIQUE/PK constraints. Reset everything first to a clean baseline
  // before re-seeding. This makes the store resilient to interrupted seeding.
  database.exec(`
    DELETE FROM audit_events;
    DELETE FROM revenue_attributions;
    DELETE FROM actions;
    DELETE FROM opportunities;
    DELETE FROM payments;
    DELETE FROM checkouts;
    DELETE FROM products;
    DELETE FROM customers;
    DELETE FROM merchants;
    DELETE FROM campaigns;
  `);

  const now = new Date();
  const minsAgo = (mins: number) => new Date(now.getTime() - mins * 60 * 1000).toISOString();
  const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();

  // 1. Merchant Profile
  database.prepare(`
    INSERT INTO merchants (id, name, email, currency, razorpay_key_id, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    'mch_razor_pilot_01',
    'Apex Electronics & Gear',
    'merchant@apexelectronics.io',
    'INR',
    process.env.RAZORPAY_KEY_ID || 'rzp_test_demo123456789',
    daysAgo(120)
  );

  // 2. Products (12 Products with affinity/cross-sell pairs)
  const products = [
    {
      id: 'prod_headphone_01',
      name: 'AeroSound Pro Wireless Headphones',
      sku: 'AERO-NC-001',
      category: 'Audio',
      price: 4999,
      image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
      description: 'Active Noise Cancellation, 40-hour battery, Spatial Audio, Ultra-plush memory foam.',
      inventory: 48,
      order_count: 36,
      total_revenue: 179964,
      created_at: daysAgo(120),
      ai_ready: 1,
      related_product_id: 'prod_webcam_05',
      related_product_name: 'Lumix Pro 4K Conference WebCam',
      target_segment: 'LOYAL',
      cross_sell_confidence: 0.87,
    },
    {
      id: 'prod_smartwatch_02',
      name: 'PulseTrack Ultra Smartwatch',
      sku: 'PULSE-GPS-002',
      category: 'Wearables',
      price: 7499,
      image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80',
      description: 'AMOLED Always-On display, ECG & SpO2 sensors, Dual-band GPS, 7-day battery.',
      inventory: 32,
      order_count: 28,
      total_revenue: 209972,
      created_at: daysAgo(120),
      ai_ready: 1,
      related_product_id: 'prod_earbuds_06',
      related_product_name: 'AeroBuds Pro True Wireless',
      target_segment: 'HIGH_VALUE',
      cross_sell_confidence: 0.91,
    },
    {
      id: 'prod_keyboard_03',
      name: 'KeyCraft RGB Mechanical Keyboard',
      sku: 'KEY-RGB-003',
      category: 'Accessories',
      price: 3299,
      image_url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&q=80',
      description: 'Hot-swappable linear switches, PBT keycaps, customizable per-key RGB backlighting.',
      inventory: 65,
      order_count: 42,
      total_revenue: 138558,
      created_at: daysAgo(120),
      ai_ready: 1,
      related_product_id: 'prod_stand_07',
      related_product_name: 'Ergoflex Aluminum Laptop Stand',
      target_segment: 'LOYAL',
      cross_sell_confidence: 0.84,
    },
    {
      id: 'prod_backpack_04',
      name: 'Nomad Explorer Waterproof Backpack',
      sku: 'NOMAD-WP-004',
      category: 'Gear',
      price: 2199,
      image_url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80',
      description: 'Cordura weather-resistant fabric, TSA laptop sleeve, ergonomic weight distribution.',
      inventory: 80,
      order_count: 54,
      total_revenue: 118746,
      created_at: daysAgo(120),
      ai_ready: 1,
      related_product_id: 'prod_bottle_08',
      related_product_name: 'HydroShield Insulated Smart Bottle',
      target_segment: 'NEW',
      cross_sell_confidence: 0.79,
    },
    {
      id: 'prod_webcam_05',
      name: 'Lumix Pro 4K Conference WebCam',
      sku: 'LUMIX-4K-005',
      category: 'Audio/Video',
      price: 5899,
      image_url: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800&q=80',
      description: 'Ultra HD 4K 60fps, dual noise-canceling stereo mics, AI auto-framing.',
      inventory: 25,
      order_count: 22,
      total_revenue: 129778,
      created_at: daysAgo(120),
      ai_ready: 1,
      related_product_id: 'prod_light_09',
      related_product_name: 'StreamGlow Ring Light Pro',
      target_segment: 'HIGH_VALUE',
      cross_sell_confidence: 0.88,
    },
    {
      id: 'prod_earbuds_06',
      name: 'AeroBuds Pro True Wireless',
      sku: 'AERO-TWS-006',
      category: 'Audio',
      price: 2999,
      image_url: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&q=80',
      description: 'Wireless charging case, low-latency gaming mode, IPX7 sweat resistance.',
      inventory: 60,
      order_count: 38,
      total_revenue: 113962,
      created_at: daysAgo(120),
      ai_ready: 1,
      related_product_id: 'prod_case_10',
      related_product_name: 'AeroBuds Protective Leather Case',
      target_segment: 'LOYAL',
      cross_sell_confidence: 0.85,
    },
    {
      id: 'prod_stand_07',
      name: 'Ergoflex Aluminum Laptop Stand',
      sku: 'ERGO-ST-007',
      category: 'Gear',
      price: 1899,
      image_url: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800&q=80',
      description: 'Precision machined aluminum, foldable design, optimized heat dissipation airflow.',
      inventory: 50,
      order_count: 30,
      total_revenue: 56970,
      created_at: daysAgo(120),
      ai_ready: 1,
      related_product_id: 'prod_mouse_11',
      related_product_name: 'KeyCraft Precision Wireless Mouse',
      target_segment: 'NEW',
      cross_sell_confidence: 0.82,
    },
    {
      id: 'prod_bottle_08',
      name: 'HydroShield Insulated Smart Bottle',
      sku: 'HYDRO-BT-008',
      category: 'Gear',
      price: 1299,
      image_url: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&q=80',
      description: 'LED temperature display, 24h cold insulation, UV-C sterilization cap.',
      inventory: 70,
      order_count: 45,
      total_revenue: 58455,
      created_at: daysAgo(120),
      ai_ready: 1,
      related_product_id: 'prod_backpack_04',
      related_product_name: 'Nomad Explorer Waterproof Backpack',
      target_segment: 'NEW',
      cross_sell_confidence: 0.80,
    },
    {
      id: 'prod_light_09',
      name: 'StreamGlow Ring Light Pro',
      sku: 'STREAM-RL-009',
      category: 'Audio/Video',
      price: 1599,
      image_url: 'https://images.unsplash.com/photo-1598550476439-6847785fcea6?w=800&q=80',
      description: 'Variable color temperature 2700K-6500K, wireless remote control, desk clamp.',
      inventory: 40,
      order_count: 26,
      total_revenue: 41574,
      created_at: daysAgo(120),
      ai_ready: 1,
      related_product_id: 'prod_webcam_05',
      related_product_name: 'Lumix Pro 4K Conference WebCam',
      target_segment: 'HIGH_VALUE',
      cross_sell_confidence: 0.86,
    },
    {
      id: 'prod_case_10',
      name: 'AeroBuds Protective Leather Case',
      sku: 'CASE-LTH-010',
      category: 'Accessories',
      price: 799,
      image_url: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&q=80',
      description: 'Handcrafted full-grain leather, brass carabiner, wireless charging compatible.',
      inventory: 90,
      order_count: 50,
      total_revenue: 39950,
      created_at: daysAgo(120),
      ai_ready: 1,
      related_product_id: 'prod_earbuds_06',
      related_product_name: 'AeroBuds Pro True Wireless',
      target_segment: 'LOYAL',
      cross_sell_confidence: 0.89,
    },
    {
      id: 'prod_mouse_11',
      name: 'KeyCraft Precision Wireless Mouse',
      sku: 'MOUSE-WL-011',
      category: 'Accessories',
      price: 1499,
      image_url: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800&q=80',
      description: 'Ergonomic thumb rest, tri-mode connection (Bluetooth/2.4G/USB-C), 26000 DPI sensor.',
      inventory: 55,
      order_count: 34,
      total_revenue: 50966,
      created_at: daysAgo(120),
      ai_ready: 1,
      related_product_id: 'prod_keyboard_03',
      related_product_name: 'KeyCraft RGB Mechanical Keyboard',
      target_segment: 'LOYAL',
      cross_sell_confidence: 0.83,
    },
    {
      id: 'prod_speaker_12',
      name: 'AeroBoom Bluetooth Portable Speaker',
      sku: 'BOOM-SPK-012',
      category: 'Audio',
      price: 3899,
      image_url: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800&q=80',
      description: '360° omnidirectional sound, dual passive radiators, 20-hour playback, IP67 waterproof.',
      inventory: 35,
      order_count: 20,
      total_revenue: 77980,
      created_at: daysAgo(120),
      ai_ready: 1,
      related_product_id: 'prod_headphone_01',
      related_product_name: 'AeroSound Pro Wireless Headphones',
      target_segment: 'HIGH_VALUE',
      cross_sell_confidence: 0.85,
    },
  ];

  const insertProd = database.prepare(`
    INSERT INTO products (id, name, sku, category, price, image_url, description, inventory, order_count, total_revenue, created_at, ai_ready, related_product_id, related_product_name, target_segment, cross_sell_confidence)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  products.forEach(p => insertProd.run(p.id, p.name, p.sku, p.category, p.price, p.image_url, p.description, p.inventory, p.order_count, p.total_revenue, p.created_at, p.ai_ready, p.related_product_id, p.related_product_name, p.target_segment, p.cross_sell_confidence));

  // 3. Customers (35 Customers across 5 segments)
  const customers = [
    // HIGH_VALUE (7)
    { id: 'cust_01', name: 'Ananya Iyer', email: 'ananya.iyer@example.com', phone: '+91 97654 32109', lifetime_spend: 34990, total_orders: 6, last_purchase_at: daysAgo(3), segment: 'HIGH_VALUE', risk_score: 10, created_at: daysAgo(110) },
    { id: 'cust_02', name: 'Rahul Verma', email: 'rahul.verma@example.com', phone: '+91 98123 45678', lifetime_spend: 28400, total_orders: 5, last_purchase_at: daysAgo(12), segment: 'HIGH_VALUE', risk_score: 25, created_at: daysAgo(105) },
    { id: 'cust_03', name: 'Vikram Patel', email: 'vikram.patel@example.com', phone: '+91 91234 56780', lifetime_spend: 22490, total_orders: 4, last_purchase_at: daysAgo(7), segment: 'HIGH_VALUE', risk_score: 18, created_at: daysAgo(95) },
    { id: 'cust_04', name: 'Sunita Reddy', email: 'sunita.reddy@example.com', phone: '+91 98450 11223', lifetime_spend: 19800, total_orders: 4, last_purchase_at: daysAgo(15), segment: 'HIGH_VALUE', risk_score: 20, created_at: daysAgo(90) },
    { id: 'cust_05', name: 'Rajesh Kumar', email: 'rajesh.kumar@example.com', phone: '+91 97110 33445', lifetime_spend: 18500, total_orders: 3, last_purchase_at: daysAgo(10), segment: 'HIGH_VALUE', risk_score: 15, created_at: daysAgo(85) },
    { id: 'cust_06', name: 'Kavita Sharma', email: 'kavita.sharma@example.com', phone: '+91 96500 55667', lifetime_spend: 17200, total_orders: 3, last_purchase_at: daysAgo(6), segment: 'HIGH_VALUE', risk_score: 12, created_at: daysAgo(80) },
    { id: 'cust_07', name: 'Amit Trivedi', email: 'amit.trivedi@example.com', phone: '+91 95400 77889', lifetime_spend: 16400, total_orders: 3, last_purchase_at: daysAgo(20), segment: 'HIGH_VALUE', risk_score: 28, created_at: daysAgo(75) },

    // LOYAL (7)
    { id: 'cust_08', name: 'Priya Sharma', email: 'priya.sharma@example.com', phone: '+91 98765 43210', lifetime_spend: 14990, total_orders: 4, last_purchase_at: daysAgo(14), segment: 'LOYAL', risk_score: 15, created_at: daysAgo(100) },
    { id: 'cust_09', name: 'Suresh Nair', email: 'suresh.nair@example.com', phone: '+91 94470 88990', lifetime_spend: 13200, total_orders: 4, last_purchase_at: daysAgo(9), segment: 'LOYAL', risk_score: 14, created_at: daysAgo(90) },
    { id: 'cust_10', name: 'Pooja Gupta', email: 'pooja.gupta@example.com', phone: '+91 93120 44556', lifetime_spend: 12800, total_orders: 3, last_purchase_at: daysAgo(18), segment: 'LOYAL', risk_score: 22, created_at: daysAgo(85) },
    { id: 'cust_11', name: 'Rohan Malhotra', email: 'rohan.malhotra@example.com', phone: '+91 98100 66778', lifetime_spend: 11500, total_orders: 3, last_purchase_at: daysAgo(11), segment: 'LOYAL', risk_score: 16, created_at: daysAgo(80) },
    { id: 'cust_12', name: 'Neha Kapoor', email: 'neha.kapoor@example.com', phone: '+91 99100 88990', lifetime_spend: 10400, total_orders: 3, last_purchase_at: daysAgo(8), segment: 'LOYAL', risk_score: 10, created_at: daysAgo(70) },
    { id: 'cust_13', name: 'Deepa Swaminathan', email: 'deepa.s@example.com', phone: '+91 98400 12345', lifetime_spend: 9800, total_orders: 3, last_purchase_at: daysAgo(16), segment: 'LOYAL', risk_score: 19, created_at: daysAgo(65) },
    { id: 'cust_14', name: 'Karthik Raja', email: 'karthik.r@example.com', phone: '+91 97890 23456', lifetime_spend: 9200, total_orders: 2, last_purchase_at: daysAgo(21), segment: 'LOYAL', risk_score: 24, created_at: daysAgo(60) },

    // NEW (7)
    { id: 'cust_15', name: 'Ritu Saxena', email: 'ritu.saxena@example.com', phone: '+91 98710 34567', lifetime_spend: 4999, total_orders: 1, last_purchase_at: daysAgo(2), segment: 'NEW', risk_score: 40, created_at: daysAgo(5) },
    { id: 'cust_16', name: 'Manish Joshi', email: 'manish.j@example.com', phone: '+91 97600 45678', lifetime_spend: 3299, total_orders: 1, last_purchase_at: daysAgo(4), segment: 'NEW', risk_score: 42, created_at: daysAgo(8) },
    { id: 'cust_17', name: 'Divya Rao', email: 'divya.rao@example.com', phone: '+91 96510 56789', lifetime_spend: 2199, total_orders: 1, last_purchase_at: daysAgo(1), segment: 'NEW', risk_score: 35, created_at: daysAgo(3) },
    { id: 'cust_18', name: 'Nitin Agarwal', email: 'nitin.a@example.com', phone: '+91 95410 67890', lifetime_spend: 1899, total_orders: 1, last_purchase_at: daysAgo(6), segment: 'NEW', risk_score: 45, created_at: daysAgo(10) },
    { id: 'cust_19', name: 'Sneha Choudhury', email: 'sneha.c@example.com', phone: '+91 94320 78901', lifetime_spend: 1299, total_orders: 1, last_purchase_at: daysAgo(3), segment: 'NEW', risk_score: 38, created_at: daysAgo(6) },
    { id: 'cust_20', name: 'Varun Sengupta', email: 'varun.s@example.com', phone: '+91 93210 89012', lifetime_spend: 0, total_orders: 0, last_purchase_at: null, segment: 'NEW', risk_score: 50, created_at: daysAgo(2) },
    { id: 'cust_21', name: 'Akash Singhania', email: 'akash.s@example.com', phone: '+91 92100 90123', lifetime_spend: 0, total_orders: 0, last_purchase_at: null, segment: 'NEW', risk_score: 50, created_at: daysAgo(1) },

    // AT_RISK (7)
    { id: 'cust_22', name: 'Arjun Mehta', email: 'arjun.mehta@example.com', phone: '+91 99887 76655', lifetime_spend: 38500, total_orders: 6, last_purchase_at: daysAgo(52), segment: 'AT_RISK', risk_score: 78, created_at: daysAgo(115) },
    { id: 'cust_23', name: 'Sanjay Dutt', email: 'sanjay.dutt@example.com', phone: '+91 98700 12345', lifetime_spend: 26400, total_orders: 5, last_purchase_at: daysAgo(48), segment: 'AT_RISK', risk_score: 72, created_at: daysAgo(110) },
    { id: 'cust_24', name: 'Meera Nambiar', email: 'meera.n@example.com', phone: '+91 97610 23456', lifetime_spend: 21800, total_orders: 4, last_purchase_at: daysAgo(45), segment: 'AT_RISK', risk_score: 68, created_at: daysAgo(105) },
    { id: 'cust_25', name: 'Harish Kulkarni', email: 'harish.k@example.com', phone: '+91 96520 34567', lifetime_spend: 18900, total_orders: 3, last_purchase_at: daysAgo(58), segment: 'AT_RISK', risk_score: 82, created_at: daysAgo(100) },
    { id: 'cust_26', name: 'Geeta Pillai', email: 'geeta.p@example.com', phone: '+91 95430 45678', lifetime_spend: 16500, total_orders: 3, last_purchase_at: daysAgo(62), segment: 'AT_RISK', risk_score: 85, created_at: daysAgo(95) },
    { id: 'cust_27', name: 'Alok Roy', email: 'alok.roy@example.com', phone: '+91 94340 56789', lifetime_spend: 14200, total_orders: 3, last_purchase_at: daysAgo(40), segment: 'AT_RISK', risk_score: 65, created_at: daysAgo(90) },
    { id: 'cust_28', name: 'Tarun Bhatia', email: 'tarun.b@example.com', phone: '+91 93250 67890', lifetime_spend: 12900, total_orders: 2, last_purchase_at: daysAgo(50), segment: 'AT_RISK', risk_score: 75, created_at: daysAgo(85) },

    // INACTIVE (7)
    { id: 'cust_29', name: 'Yash Vardhan', email: 'yash.v@example.com', phone: '+91 92160 78901', lifetime_spend: 15400, total_orders: 3, last_purchase_at: daysAgo(85), segment: 'INACTIVE', risk_score: 90, created_at: daysAgo(120) },
    { id: 'cust_30', name: 'Preeti Bajaj', email: 'preeti.b@example.com', phone: '+91 91070 89012', lifetime_spend: 13800, total_orders: 2, last_purchase_at: daysAgo(92), segment: 'INACTIVE', risk_score: 92, created_at: daysAgo(120) },
    { id: 'cust_31', name: 'Nikhil Chawla', email: 'nikhil.c@example.com', phone: '+91 90980 90123', lifetime_spend: 11200, total_orders: 2, last_purchase_at: daysAgo(78), segment: 'INACTIVE', risk_score: 88, created_at: daysAgo(115) },
    { id: 'cust_32', name: 'Simran Ahuja', email: 'simran.a@example.com', phone: '+91 98890 01234', lifetime_spend: 9600, total_orders: 2, last_purchase_at: daysAgo(105), segment: 'INACTIVE', risk_score: 95, created_at: daysAgo(115) },
    { id: 'cust_33', name: 'Gaurav Deshmukh', email: 'gaurav.d@example.com', phone: '+91 97700 12345', lifetime_spend: 8400, total_orders: 2, last_purchase_at: daysAgo(80), segment: 'INACTIVE', risk_score: 89, created_at: daysAgo(110) },
    { id: 'cust_34', name: 'Shilpa Menon', email: 'shilpa.m@example.com', phone: '+91 96610 23456', lifetime_spend: 7200, total_orders: 1, last_purchase_at: daysAgo(110), segment: 'INACTIVE', risk_score: 96, created_at: daysAgo(110) },
    { id: 'cust_35', name: 'Sameer Merchant', email: 'sameer.m@example.com', phone: '+91 95520 34567', lifetime_spend: 5800, total_orders: 1, last_purchase_at: daysAgo(115), segment: 'INACTIVE', risk_score: 98, created_at: daysAgo(120) },
  ];

  const insertCust = database.prepare(`
    INSERT INTO customers (id, name, email, phone, lifetime_spend, total_orders, last_purchase_at, segment, risk_score, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  customers.forEach(c => insertCust.run(c.id, c.name, c.email, c.phone, c.lifetime_spend, c.total_orders, c.last_purchase_at, c.segment, c.risk_score, c.created_at));

  // 4. Seed 60 Orders & Payments (Relationally Consistent)
  const insertCheckout = database.prepare(`
    INSERT INTO checkouts (id, customer_id, customer_name, customer_email, cart_items, subtotal, discount, total_amount, status, step_reached, abandoned_at, recovery_token, recovery_discount_pct, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertPayment = database.prepare(`
    INSERT INTO payments (id, merchant_id, checkout_id, customer_id, razorpay_order_id, razorpay_payment_id, razorpay_signature, amount, currency, status, failure_code, failure_reason, failure_description, payment_method, is_recovery_payment, opportunity_id, verified_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const paymentMethods = ['UPI', 'card', 'netbanking', 'wallet'];
  const failureReasons = [
    { code: 'BAD_REQUEST_ERROR', reason: 'card_declined', desc: 'The card was declined by the issuer bank due to daily spending limit.' },
    { code: 'GATEWAY_ERROR', reason: 'bank_technical_error', desc: 'Temporary network failure between Razorpay and acquiring bank.' },
    { code: 'BAD_REQUEST_ERROR', reason: 'otp_timeout', desc: 'Customer 2FA authentication timed out during 3D Secure verification.' },
    { code: 'BAD_REQUEST_ERROR', reason: 'insufficient_funds', desc: 'Account balance insufficient to complete the transaction.' },
  ];

  for (let i = 1; i <= 60; i++) {
    const custIndex = (i - 1) % customers.length;
    const cust = customers[custIndex];
    const prodIndex = (i - 1) % products.length;
    const prod = products[prodIndex];
    const dayOffset = Math.floor((60 - i) * 1.5);
    const orderCreatedAt = daysAgo(dayOffset);

    const chkId = `chk_order_${String(i).padStart(3, '0')}`;
    const payId = `pay_rzp_test_${String(i).padStart(3, '0')}`;
    const rzpOrderId = `order_test_${String(i).padStart(3, '0')}`;
    const rzpPayId = `pay_test_cap_${String(i).padStart(3, '0')}`;
    const method = paymentMethods[i % paymentMethods.length];

    let chkStatus = 'COMPLETED';
    let payStatus = 'CAPTURED';
    let isRecovery = (i % 7 === 0) ? 1 : 0;
    let failReasonObj: any = null;

    if (i % 8 === 0 && i !== 24 && i !== 48) {
      chkStatus = 'ABANDONED';
      payStatus = 'FAILED';
      failReasonObj = failureReasons[i % failureReasons.length];
    } else if (i % 11 === 0) {
      chkStatus = 'ABANDONED';
      payStatus = 'CREATED';
    }

    const items = [{ product_id: prod.id, name: prod.name, price: prod.price, quantity: 1, image_url: prod.image_url }];
    if (i % 4 === 0) {
      const relProd = products[(prodIndex + 1) % products.length];
      items.push({ product_id: relProd.id, name: relProd.name, price: relProd.price, quantity: 1, image_url: relProd.image_url });
    }
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    insertCheckout.run(
      chkId,
      cust.id,
      cust.name,
      cust.email,
      JSON.stringify(items),
      subtotal,
      0,
      subtotal,
      chkStatus,
      'PAYMENT',
      chkStatus === 'ABANDONED' ? orderCreatedAt : null,
      chkStatus === 'ABANDONED' ? `rec_tok_${i}_test` : null,
      0,
      orderCreatedAt,
      orderCreatedAt
    );

    if (payStatus !== 'CREATED' || chkStatus === 'ABANDONED') {
      insertPayment.run(
        payId,
        'mch_razor_pilot_01',
        chkId,
        cust.id,
        rzpOrderId,
        payStatus === 'CAPTURED' ? rzpPayId : (payStatus === 'FAILED' ? `pay_fail_${i}` : null),
        payStatus === 'CAPTURED' ? `sig_verified_${i}` : null,
        subtotal,
        'INR',
        payStatus,
        failReasonObj ? failReasonObj.code : null,
        failReasonObj ? failReasonObj.reason : null,
        failReasonObj ? failReasonObj.desc : null,
        method,
        isRecovery,
        null,
        payStatus === 'CAPTURED' ? orderCreatedAt : null,
        orderCreatedAt
      );
    }
  }

  // 5. Seed 6 AI Growth Opportunities (3 Track 01 Primary Growth + Supporting Recovery)
  const opportunities = [
    // 1. Primary Track 01: Cross-Sell Product B
    {
      id: 'opp_cross_headphone_01',
      merchant_id: 'mch_razor_pilot_01',
      type: 'CROSS_SELL',
      status: 'DETECTED',
      priority: 'HIGH',
      target_id: 'prod_headphone_01',
      customer_id: 'cust_08', // Priya Sharma
      customer_name: 'Priya Sharma',
      customer_email: 'priya.sharma@example.com',
      amount_at_risk: 8400,
      potential_recovery_amount: 8400,
      opportunity_score: 87,
      score_factors: JSON.stringify([
        { factor: 'Product Affinity Signal', points: 35, max_points: 35, description: '34% of AeroSound Headphones buyers also purchase Lumix 4K WebCam.', signal_value: 'Headphones -> WebCam' },
        { factor: 'AOV Expansion Potential', points: 25, max_points: 25, description: 'Estimated monthly order value increase of ₹8,400/month.', signal_value: '+₹8,400/mo' },
        { factor: 'AI Readiness Confidence', points: 27, max_points: 25, description: 'High confidence affinity correlation calculated across historic orders.', signal_value: '87% Confidence' },
      ]),
      ai_analysis: JSON.stringify({
        summary: 'High cross-sell affinity detected between AeroSound Headphones and Lumix 4K WebCam.',
        signals: [
          '34% co-purchase rate observed across completed store transactions.',
          'Target AOV expansion potential estimated at ₹8,400/month.',
          'Catalog AI Readiness confidence score calculated at 87%.',
        ],
        rationale: 'Promoting Lumix 4K WebCam during headphone checkout flow increases Average Order Value (AOV) with high conversion likelihood and zero customer acquisition cost.',
        recommended_action: {
          type: 'CROSS_SELL_OFFER',
          title: 'Create Cross-Sell Recommendation (Lumix 4K WebCam)',
          description: 'Deploy automated cross-sell offer widget for Lumix WebCam on headphone checkout step.',
          incentive_details: '10% bundle incentive when added during checkout.',
          discount_pct: 10,
          channel: 'In-Checkout Recommendation Widget',
        },
        expected_outcome: 'Increase Average Order Value (AOV) and generate estimated ₹8,400/month incremental revenue.',
        urgency: 'HIGH',
        risk_assessment: 'Low risk. Non-intrusive bundle recommendation shown only to buyers demonstrating high affinity.',
        confidence: 87,
      }),
      active_action_id: null,
      created_at: minsAgo(15),
      updated_at: minsAgo(15),
    },

    // 2. Primary Track 01: Upsell Higher-Value Product
    {
      id: 'opp_upsell_smartwatch_02',
      merchant_id: 'mch_razor_pilot_01',
      type: 'UPSELL_OPPORTUNITY',
      status: 'DETECTED',
      priority: 'HIGH',
      target_id: 'prod_smartwatch_02',
      customer_id: 'cust_01', // Ananya Iyer
      customer_name: 'Ananya Iyer',
      customer_email: 'ananya.iyer@example.com',
      amount_at_risk: 14500,
      potential_recovery_amount: 14500,
      opportunity_score: 91,
      score_factors: JSON.stringify([
        { factor: 'Customer Segment Value', points: 35, max_points: 35, description: 'VIP High Value customer with ₹34,990 lifetime spend.', signal_value: 'HIGH_VALUE' },
        { factor: 'Upsell Affinity Match', points: 30, max_points: 35, description: 'High propensity to upgrade to PulseTrack Pro Edition.', signal_value: '91% Match Score' },
        { factor: 'Historical AOV', points: 26, max_points: 25, description: 'Past orders consistently in top 10th percentile of store revenue.', signal_value: 'Top Tier LTV' },
      ]),
      ai_analysis: JSON.stringify({
        summary: 'Upsell Opportunity: Transition High-Value buyers to PulseTrack Pro Edition.',
        signals: [
          'Customer Ananya Iyer (VIP High Value) has 6 past orders totaling ₹34,990.',
          'High propensity score calculated for premium smartwatch accessories.',
          'Expected order value uplift of ₹14,500/month across cohort.',
        ],
        rationale: 'High-value repeat buyers demonstrate willingness to pay for premium tiers. Offering a pre-checkout VIP upgrade incentive increases gross margin.',
        recommended_action: {
          type: 'DISCOUNT_INCENTIVE',
          title: 'Offer VIP Upgrade Incentive (PulseTrack Pro Edition)',
          description: 'Present dedicated VIP 12% upgrade discount for PulseTrack Pro tier.',
          incentive_details: '12% VIP courtesy upgrade discount.',
          discount_pct: 12,
          channel: 'VIP Pre-Checkout Banner',
        },
        expected_outcome: 'Capture ₹14,500 incremental high-margin revenue.',
        urgency: 'HIGH',
        risk_assessment: 'Low risk. Exclusive VIP offer enhances retention.',
        confidence: 91,
      }),
      active_action_id: null,
      created_at: minsAgo(25),
      updated_at: minsAgo(25),
    },

    // 3. Primary Track 01: Re-engage Inactive Customers Campaign
    {
      id: 'opp_camp_reengage_01',
      merchant_id: 'mch_razor_pilot_01',
      type: 'RE_ENGAGEMENT',
      status: 'DETECTED',
      priority: 'HIGH',
      target_id: 'target_campaign_inactive_vip',
      customer_id: 'cust_22', // Arjun Mehta
      customer_name: 'Arjun Mehta',
      customer_email: 'arjun.mehta@example.com',
      amount_at_risk: 24600,
      potential_recovery_amount: 24600,
      opportunity_score: 88,
      score_factors: JSON.stringify([
        { factor: 'Customer Churn Signal', points: 30, max_points: 30, description: '126 inactive high-value accounts with >30 days inactivity window.', signal_value: '126 VIP Accounts' },
        { factor: 'Expected Campaign Revenue', points: 30, max_points: 30, description: 'Projected 8-12% conversion uplift yielding ₹24,600.', signal_value: '₹24,600' },
        { factor: 'Historical Brand Affinity', points: 28, max_points: 25, description: 'High past lifetime spend average (₹38,500).', signal_value: 'Top LTV Cohort' },
      ]),
      ai_analysis: JSON.stringify({
        summary: 'AI Campaign Opportunity: Re-engage 126 inactive high-value customers.',
        signals: [
          'Target segment of 126 dormant accounts with >30 days inactivity window.',
          'Historical cohort average spend exceeds ₹15,000 per customer.',
          'Projected conversion rate of 8–12% upon launching targeted offer campaign.',
        ],
        rationale: 'Targeting dormant high-value customers with a personalized 10% reactivation discount recaptures lost lifetime value before churn becomes permanent.',
        recommended_action: {
          type: 'CAMPAIGN_DRAFT',
          title: 'Launch Inactive Customer Reactivation Campaign (10% Offer)',
          description: 'Orchestrate targeted email & WhatsApp reactivation campaign to 126 dormant accounts.',
          incentive_details: '10% promotional reactivation offer.',
          discount_pct: 10,
          channel: 'Multi-Channel Campaign Orchestrator',
        },
        expected_outcome: 'Recapture estimated ₹24,600 in incremental revenue from dormant accounts.',
        urgency: 'NORMAL',
        risk_assessment: 'Controlled. Campaign remains in draft until merchant review and approval.',
        confidence: 88,
      }),
      active_action_id: null,
      created_at: minsAgo(40),
      updated_at: minsAgo(40),
    },

    // 4. Track 01 Growth: Inactive VIP Outreach Campaign
    {
      id: 'opp_inactive_vip_04',
      merchant_id: 'mch_razor_pilot_01',
      type: 'INACTIVE_VIP',
      status: 'DETECTED',
      priority: 'MEDIUM',
      target_id: 'cust_23', // Sanjay Dutt
      customer_id: 'cust_23',
      customer_name: 'Sanjay Dutt',
      customer_email: 'sanjay.dutt@example.com',
      amount_at_risk: 18200,
      potential_recovery_amount: 18200,
      opportunity_score: 79,
      score_factors: JSON.stringify([
        { factor: 'Customer LTV', points: 28, max_points: 30, description: 'Past lifetime spend ₹26,400 across 5 completed transactions.', signal_value: '₹26,400 LTV' },
        { factor: 'Recency Risk', points: 25, max_points: 25, description: '48 days since last purchase attempt.', signal_value: '48d Inactive' },
      ]),
      ai_analysis: JSON.stringify({
        summary: 'Targeted reactivation for dormant VIP account Sanjay Dutt.',
        signals: [
          'Customer Sanjay Dutt has 5 prior orders with total spend of ₹26,400.',
          'Inactivity window of 48 days indicates imminent churn risk.',
        ],
        rationale: 'Sending a direct courtesy reactivation code re-engages the account while maintaining margin.',
        recommended_action: {
          type: 'CAMPAIGN_DRAFT',
          title: 'Send Personal VIP Courtesy Voucher (10% OFF)',
          description: 'Generate single-use reactivation voucher for Sanjay Dutt.',
          incentive_details: '10% courtesy reactivation discount.',
          discount_pct: 10,
          channel: 'Direct Email Notification',
        },
        expected_outcome: 'Reactivate account and capture ₹18,200 incremental revenue.',
        urgency: 'NORMAL',
        risk_assessment: 'Low risk. Bounded single-use token.',
        confidence: 82,
      }),
      active_action_id: null,
      created_at: minsAgo(60),
      updated_at: minsAgo(60),
    },

    // 5. Supporting Capability: Abandoned Checkout Recovery
    {
      id: 'opp_abn_priya_01',
      merchant_id: 'mch_razor_pilot_01',
      type: 'ABANDONED_CHECKOUT',
      status: 'DETECTED',
      priority: 'HIGH',
      target_id: 'chk_order_008',
      customer_id: 'cust_08',
      customer_name: 'Priya Sharma',
      customer_email: 'priya.sharma@example.com',
      amount_at_risk: 4999,
      potential_recovery_amount: 4999,
      opportunity_score: 87,
      score_factors: JSON.stringify([
        { factor: 'Cart / Transaction Value', points: 30, max_points: 35, description: 'High Cart Value (₹4,999) significantly exceeds store average order value.', signal_value: '₹4,999' },
        { factor: 'Customer History & Trust', points: 20, max_points: 25, description: 'Repeat Buyer with 4 completed orders. Established brand trust.', signal_value: 'LOYAL (4 orders, ₹14,990 spend)' },
        { factor: 'Recency & Urgency Window', points: 17, max_points: 20, description: 'Abandoned 35 mins ago. High recency recovery window.', signal_value: '35 mins ago' },
        { factor: 'Intent & Checkout Stage', points: 20, max_points: 20, description: 'High Purchase Intent: Customer filled shipping details and reached payment selector.', signal_value: 'PAYMENT Stage' },
      ]),
      ai_analysis: JSON.stringify({
        summary: 'High-intent abandoned checkout by LOYAL customer Priya Sharma for AeroSound Pro Wireless Headphones valued at ₹4,999.',
        signals: [
          'Cart value of ₹4,999 represents high recoverable revenue.',
          'Customer is classified as LOYAL with 4 prior orders and ₹14,990 lifetime spend.',
          'Checkout reached the PAYMENT stage before abandonment.',
          'Opportunity Priority Score calculated at 87/100.',
        ],
        rationale: 'The customer navigated through shipping and arrived at payment selection before dropping off. Re-engaging with a frictionless recovery link yields highest conversion.',
        recommended_action: {
          type: 'RECOVERY_LINK',
          title: 'Send Instant Cart Recovery Link',
          description: 'Generate cryptographic 1-click checkout recovery link restoring cart contents for Priya Sharma.',
          incentive_details: 'Direct one-click cart restoration link with preserved items.',
          discount_pct: 0,
          channel: 'SMS / WhatsApp / Email Direct Recovery Link',
        },
        expected_outcome: 'Recover ₹4,999 in gross revenue upon customer checkout completion in Razorpay Test Mode.',
        urgency: 'HIGH',
        risk_assessment: 'Low risk. Targeted recovery prevents cart abandonment without site-wide discount inflation.',
        confidence: 87,
      }),
      active_action_id: null,
      created_at: minsAgo(35),
      updated_at: minsAgo(35),
    },

    // 6. Supporting Capability: Failed Payment Recovery
    {
      id: 'opp_fail_rahul_02',
      merchant_id: 'mch_razor_pilot_01',
      type: 'FAILED_PAYMENT',
      status: 'DETECTED',
      priority: 'CRITICAL',
      target_id: 'pay_rzp_test_016',
      customer_id: 'cust_02',
      customer_name: 'Rahul Verma',
      customer_email: 'rahul.verma@example.com',
      amount_at_risk: 7499,
      potential_recovery_amount: 7499,
      opportunity_score: 94,
      score_factors: JSON.stringify([
        { factor: 'Cart / Transaction Value', points: 30, max_points: 35, description: 'High Cart Value (₹7,499) in top 10% of store sales.', signal_value: '₹7,499' },
        { factor: 'Customer History & Trust', points: 25, max_points: 25, description: 'VIP Customer with ₹28,400 lifetime spend across 5 past orders.', signal_value: 'HIGH_VALUE' },
        { factor: 'Intent & Checkout Stage', points: 20, max_points: 20, description: 'Maximum Intent: Customer submitted card credentials in Razorpay checkout.', signal_value: 'Payment Gateway Step' },
        { factor: 'Recency & Urgency Window', points: 19, max_points: 20, description: 'Payment declined only 18 mins ago.', signal_value: '18 mins ago' },
      ]),
      ai_analysis: JSON.stringify({
        summary: 'Payment transaction failure (card_declined) for Rahul Verma attempting purchase of ₹7,499.',
        signals: [
          'Transaction of ₹7,499 failed at Razorpay gateway with reason: "card_declined".',
          'Failure details: "The card was declined by the issuer bank due to daily spending limit."',
          'Customer Rahul Verma has 5 past successful transactions with total spend of ₹28,400.',
        ],
        rationale: 'Involuntary payment failure due to card limit. Autonomous retries disabled. Providing a Smart Retry Payment Link allows customer to complete via UPI or alternate card.',
        recommended_action: {
          type: 'SMART_RETRY_LINK',
          title: 'Issue Smart Payment Retry Link (UPI / Alternate Method)',
          description: 'Create a dedicated Razorpay retry link with UPI & Card failover options for Rahul Verma.',
          incentive_details: 'Frictionless Razorpay test checkout page pre-filled for instant re-attempt.',
          discount_pct: 0,
          channel: 'Instant Payment Retry Notification',
        },
        expected_outcome: 'Recover ₹7,499 revenue at risk by facilitating instant payment completion via alternate channel.',
        urgency: 'IMMEDIATE',
        risk_assessment: 'Zero financial risk. Idempotency guardrails prevent double charges.',
        confidence: 94,
      }),
      active_action_id: null,
      created_at: minsAgo(18),
      updated_at: minsAgo(18),
    },
  ];

  const insertOpp = database.prepare(`
    INSERT INTO opportunities (id, merchant_id, type, status, priority, target_id, customer_id, amount_at_risk, potential_recovery_amount, opportunity_score, score_factors, ai_analysis, active_action_id, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  opportunities.forEach(o => insertOpp.run(o.id, o.merchant_id, o.type, o.status, o.priority, o.target_id, o.customer_id, o.amount_at_risk, o.potential_recovery_amount, o.opportunity_score, o.score_factors, o.ai_analysis, o.active_action_id, o.created_at, o.updated_at));

  // 6. Campaigns (4 Realistic Campaigns)
  const campaigns = [
    {
      id: 'cmp_inactive_vip_01',
      name: 'Inactive VIP Reactivation Campaign Q3',
      target_segment: 'AT_RISK',
      offer_type: '10% Reactivation Offer',
      discount_pct: 10,
      estimated_reach: 126,
      potential_revenue: 24600,
      status: 'ACTIVE',
      agent_rationale: 'Targeting 126 dormant accounts with >30 days inactivity window to recapture ₹24,600 in lost lifetime value.',
      created_at: daysAgo(10),
    },
    {
      id: 'cmp_aerosound_cross_02',
      name: 'AeroSound Cross-Sell Bundle Launch',
      target_segment: 'LOYAL',
      offer_type: '10% Bundle Discount',
      discount_pct: 10,
      estimated_reach: 85,
      potential_revenue: 8400,
      status: 'DRAFT',
      agent_rationale: 'Promoting Lumix 4K WebCam to AeroSound Headphones buyers based on 34% co-purchase affinity graph.',
      created_at: daysAgo(5),
    },
    {
      id: 'cmp_smartwatch_upsell_03',
      name: 'Smartwatch Accessories VIP Upgrade',
      target_segment: 'HIGH_VALUE',
      offer_type: 'VIP Courtesy Upgrade',
      discount_pct: 12,
      estimated_reach: 42,
      potential_revenue: 14500,
      status: 'SCHEDULED',
      agent_rationale: 'Offering exclusive pre-checkout VIP upgrade incentive for PulseTrack Pro tier to high-value cohort.',
      created_at: daysAgo(3),
    },
    {
      id: 'cmp_summer_reactivate_04',
      name: 'Summer Gear Re-engagement Campaign',
      target_segment: 'INACTIVE',
      offer_type: '15% Clearance Offer',
      discount_pct: 15,
      estimated_reach: 200,
      potential_revenue: 32000,
      status: 'COMPLETED',
      agent_rationale: 'Successfully reactivated 28 dormant accounts yielding ₹32,000 in incremental revenue during Q2.',
      created_at: daysAgo(45),
    },
  ];

  const insertCamp = database.prepare(`
    INSERT INTO campaigns (id, name, target_segment, offer_type, discount_pct, estimated_reach, potential_revenue, status, agent_rationale, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  campaigns.forEach(c => insertCamp.run(c.id, c.name, c.target_segment, c.offer_type, c.discount_pct, c.estimated_reach, c.potential_revenue, c.status, c.agent_rationale, c.created_at));

  // 7. Audit Events (15 Audit Trail Events)
  const auditEvents = [
    { id: 'aud_01', merchant_id: 'mch_razor_pilot_01', agent_run_id: 'run_init_seed', opportunity_id: null, action_id: null, payment_id: null, event_type: 'AGENT_RUN_STARTED', actor_type: 'SYSTEM', metadata: JSON.stringify({ message: 'RevenuePilot AI environment initialized with baseline merchant dataset.', merchant_id: 'mch_razor_pilot_01', products_count: 12, customers_count: 35 }), created_at: daysAgo(120) },
    { id: 'aud_02', merchant_id: 'mch_razor_pilot_01', agent_run_id: 'engine_detector_cycle', opportunity_id: 'opp_cross_headphone_01', action_id: null, payment_id: null, event_type: 'SIGNAL_DETECTED', actor_type: 'SYSTEM', metadata: JSON.stringify({ signal_type: 'CROSS_SELL', source_product: 'AeroSound Pro Headphones', recommended_cross_sell: 'Lumix Pro 4K WebCam', confidence_pct: 87, estimated_monthly_revenue: 8400 }), created_at: daysAgo(15) },
    { id: 'aud_03', merchant_id: 'mch_razor_pilot_01', agent_run_id: 'run_cycle_001', opportunity_id: 'opp_cross_headphone_01', action_id: null, payment_id: null, event_type: 'OPPORTUNITY_SCORED', actor_type: 'AI_AGENT', metadata: JSON.stringify({ opportunity_id: 'opp_cross_headphone_01', total_score: 87, priority: 'HIGH', factors: ['Product Affinity: +35', 'AOV Impact: +25', 'AI Readiness: +27'] }), created_at: daysAgo(14) },
    { id: 'aud_04', merchant_id: 'mch_razor_pilot_01', agent_run_id: 'run_cycle_001', opportunity_id: 'opp_cross_headphone_01', action_id: null, payment_id: null, event_type: 'AI_REASONING_COMPLETED', actor_type: 'AI_AGENT', metadata: JSON.stringify({ recommended_action: 'Create Cross-Sell Recommendation (Lumix 4K WebCam)', expected_outcome: 'Increase AOV and capture ₹8,400/month', urgency: 'HIGH' }), created_at: daysAgo(14) },
    { id: 'aud_05', merchant_id: 'mch_razor_pilot_01', agent_run_id: 'engine_detector_cycle', opportunity_id: 'opp_upsell_smartwatch_02', action_id: null, payment_id: null, event_type: 'SIGNAL_DETECTED', actor_type: 'SYSTEM', metadata: JSON.stringify({ signal_type: 'UPSELL_OPPORTUNITY', target_customer: 'Ananya Iyer', customer_segment: 'HIGH_VALUE', estimated_revenue: 14500 }), created_at: daysAgo(25) },
    { id: 'aud_06', merchant_id: 'mch_razor_pilot_01', agent_run_id: 'engine_detector_cycle', opportunity_id: 'opp_camp_reengage_01', action_id: null, payment_id: null, event_type: 'SIGNAL_DETECTED', actor_type: 'SYSTEM', metadata: JSON.stringify({ signal_type: 'RE_ENGAGEMENT', target_segment: 'AT_RISK_VIP', reach: 126, estimated_revenue: 24600 }), created_at: daysAgo(40) },
    { id: 'aud_07', merchant_id: 'mch_razor_pilot_01', agent_run_id: 'engine_detector_cycle', opportunity_id: 'opp_abn_priya_01', action_id: null, payment_id: null, event_type: 'SIGNAL_DETECTED', actor_type: 'SYSTEM', metadata: JSON.stringify({ signal_type: 'ABANDONED_CHECKOUT', checkout_id: 'chk_order_008', customer_name: 'Priya Sharma', amount_at_risk: 4999 }), created_at: minsAgo(35) },
    { id: 'aud_08', merchant_id: 'mch_razor_pilot_01', agent_run_id: 'engine_detector_cycle', opportunity_id: 'opp_fail_rahul_02', action_id: null, payment_id: 'pay_rzp_test_016', event_type: 'PAYMENT_FAILED', actor_type: 'RAZORPAY_WEBHOOK', metadata: JSON.stringify({ payment_id: 'pay_rzp_test_016', failure_reason: 'card_declined', failure_code: 'BAD_REQUEST_ERROR', amount: 7499 }), created_at: minsAgo(18) },
    { id: 'aud_09', merchant_id: 'mch_razor_pilot_01', agent_run_id: 'gate_approval_verify', opportunity_id: 'opp_abn_priya_01', action_id: 'act_recovery_01', payment_id: null, event_type: 'POLICY_GATE_PASSED', actor_type: 'SYSTEM', metadata: JSON.stringify({ policy_rules: ['AUTH_VERIFIED', 'BOUNDED_TYPE_VERIFIED', 'IDEMPOTENCY_CONFIRMED'] }), created_at: minsAgo(12) },
    { id: 'aud_10', merchant_id: 'mch_razor_pilot_01', agent_run_id: 'gate_approval_verify', opportunity_id: 'opp_abn_priya_01', action_id: 'act_recovery_01', payment_id: null, event_type: 'MERCHANT_APPROVED', actor_type: 'MERCHANT', metadata: JSON.stringify({ approved_by: 'Merchant Admin (Dashboard)', notes: 'Approved 1-click cart recovery link generation.' }), created_at: minsAgo(10) },
    { id: 'aud_11', merchant_id: 'mch_razor_pilot_01', agent_run_id: 'gate_approval_verify', opportunity_id: 'opp_abn_priya_01', action_id: 'act_recovery_01', payment_id: null, event_type: 'RECOVERY_LINK_GENERATED', actor_type: 'SYSTEM', metadata: JSON.stringify({ recovery_url: 'http://localhost:3000/recover/rec_tok_priya_demo', discount_applied_pct: 0 }), created_at: minsAgo(10) },
    { id: 'aud_12', merchant_id: 'mch_razor_pilot_01', agent_run_id: 'webhook_listener', opportunity_id: 'opp_abn_priya_01', action_id: 'act_recovery_01', payment_id: 'pay_rec_priya_cap', event_type: 'PAYMENT_SUCCEEDED', actor_type: 'RAZORPAY_WEBHOOK', metadata: JSON.stringify({ payment_id: 'pay_rec_priya_cap', amount: 4999, method: 'UPI', verified: true }), created_at: minsAgo(5) },
    { id: 'aud_13', merchant_id: 'mch_razor_pilot_01', agent_run_id: 'webhook_listener', opportunity_id: 'opp_abn_priya_01', action_id: 'act_recovery_01', payment_id: 'pay_rec_priya_cap', event_type: 'REVENUE_ATTRIBUTED', actor_type: 'SYSTEM', metadata: JSON.stringify({ amount: 4999, source: 'RECOVERY_LINK', confidence: 1.0 }), created_at: minsAgo(4) },
    { id: 'aud_14', merchant_id: 'mch_razor_pilot_01', agent_run_id: 'campaign_orchestrator', opportunity_id: 'opp_camp_reengage_01', action_id: 'act_camp_01', payment_id: null, event_type: 'TOOL_INVOKED', actor_type: 'AI_AGENT', metadata: JSON.stringify({ tool: 'create_campaign_draft', campaign_name: 'Inactive VIP Reactivation Campaign Q3', target_segment: 'AT_RISK' }), created_at: minsAgo(2) },
    { id: 'aud_15', merchant_id: 'mch_razor_pilot_01', agent_run_id: 'agent_cycle_main', opportunity_id: null, action_id: null, payment_id: null, event_type: 'AGENT_RUN_STARTED', actor_type: 'AI_AGENT', metadata: JSON.stringify({ message: 'Autonomous RevenuePilot Agent cycle completed cleanly. All merchant signals in good standing.' }), created_at: minsAgo(1) },
  ];

  const insertAudit = database.prepare(`
    INSERT INTO audit_events (id, merchant_id, agent_run_id, opportunity_id, action_id, payment_id, event_type, actor_type, metadata, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  auditEvents.forEach(a => insertAudit.run(a.id, a.merchant_id, a.agent_run_id, a.opportunity_id, a.action_id, a.payment_id, a.event_type, a.actor_type, a.metadata, a.created_at));

  // 8. Actions referenced by the verified attributions
  //    (FK: revenue_attributions.action_id -> actions.id must resolve)
  const actionsSeed = [
    { id: 'act_recovery_01', opportunity_id: 'opp_abn_priya_01', type: 'RECOVERY_LINK', title: 'Send Instant Cart Recovery Link', description: 'One-click cart restoration recovery link for Priya Sharma.', config: JSON.stringify({ discount_pct: 0, channel: 'SMS / WhatsApp / Email Direct Recovery Link', expiry_hours: 48 }), status: 'EXECUTED', approved_by: 'Merchant Admin (Dashboard)', approved_at: daysAgo(2), executed_at: daysAgo(2), response_payload: JSON.stringify({ recovery_token: 'rec_seed_priya_01', recovery_url: 'http://localhost:3000/recover/rec_seed_priya_01' }), created_at: daysAgo(3) },
    { id: 'act_cross_01', opportunity_id: 'opp_cross_headphone_01', type: 'CROSS_SELL_OFFER', title: 'Create Cross-Sell Recommendation (Lumix 4K WebCam)', description: 'Deploy automated cross-sell offer widget on headphone checkout.', config: JSON.stringify({ discount_pct: 10, channel: 'In-Checkout Recommendation Widget' }), status: 'EXECUTED', approved_by: 'Merchant Admin (Dashboard)', approved_at: daysAgo(4), executed_at: daysAgo(4), response_payload: JSON.stringify({ cross_sell_status: 'ACTIVE', widget_enabled: true }), created_at: daysAgo(5) },
    { id: 'act_retry_02', opportunity_id: 'opp_fail_rahul_02', type: 'SMART_RETRY_LINK', title: 'Issue Smart Payment Retry Link (UPI / Alternate Method)', description: 'Dedicated Razorpay retry link with UPI & Card failover for Rahul Verma.', config: JSON.stringify({ discount_pct: 0, channel: 'Instant Payment Retry Notification', expiry_hours: 48 }), status: 'EXECUTED', approved_by: 'Merchant Admin (Dashboard)', approved_at: daysAgo(6), executed_at: daysAgo(6), response_payload: JSON.stringify({ recovery_token: 'rec_seed_rahul_02', recovery_url: 'http://localhost:3000/recover/rec_seed_rahul_02' }), created_at: daysAgo(7) },
  ];

  const insertAction = database.prepare(`
    INSERT INTO actions (id, opportunity_id, type, title, description, config, status, approved_by, approved_at, executed_at, response_payload, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  actionsSeed.forEach(a => insertAction.run(a.id, a.opportunity_id, a.type, a.title, a.description, a.config, a.status, a.approved_by, a.approved_at, a.executed_at, a.response_payload, a.created_at));

  // 9. Revenue Attributions (3 Verified Attributions)
  const attributions = [
    { id: 'attr_01', opportunity_id: 'opp_abn_priya_01', action_id: 'act_recovery_01', payment_id: 'pay_rzp_test_007', checkout_id: 'chk_order_007', amount: 4999, source: 'RECOVERY_LINK', confidence_score: 1.0, status: 'VERIFIED' as const, attributed_at: daysAgo(2) },
    { id: 'attr_02', opportunity_id: 'opp_cross_headphone_01', action_id: 'act_cross_01', payment_id: 'pay_rzp_test_014', checkout_id: 'chk_order_014', amount: 5899, source: 'CROSS_SELL_OFFER', confidence_score: 1.0, status: 'VERIFIED' as const, attributed_at: daysAgo(4) },
    { id: 'attr_03', opportunity_id: 'opp_fail_rahul_02', action_id: 'act_retry_02', payment_id: 'pay_rzp_test_021', checkout_id: 'chk_order_021', amount: 7499, source: 'SMART_RETRY_LINK', confidence_score: 1.0, status: 'VERIFIED' as const, attributed_at: daysAgo(6) },
  ];

  const insertAttr = database.prepare(`
    INSERT INTO revenue_attributions (id, opportunity_id, action_id, payment_id, checkout_id, amount, source, confidence_score, status, attributed_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  attributions.forEach(at => insertAttr.run(at.id, at.opportunity_id, at.action_id, at.payment_id, at.checkout_id, at.amount, at.source, at.confidence_score, at.status, at.attributed_at));
}
