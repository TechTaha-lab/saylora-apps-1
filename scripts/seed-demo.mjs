/**
 * Creates the admin demo account and a sample store with products.
 * Run: node scripts/seed-demo.mjs
 */
import pkg from "pg";
import bcrypt from "bcryptjs";

const { Pool } = pkg;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const ADMIN_EMAIL = "92130352@students.liu.edu.lb";
const ADMIN_PASSWORD = "Taha@#$2003";
const ADMIN_NAME = "Taha Kourani";

async function main() {
  console.log("🌱 Seeding demo store...");

  const hash = await bcrypt.hash(ADMIN_PASSWORD, 12);

  // Upsert admin user
  const existing = await pool.query(
    "SELECT id FROM users WHERE email = $1",
    [ADMIN_EMAIL]
  );

  let userId;
  if (existing.rows.length > 0) {
    userId = existing.rows[0].id;
    await pool.query(
      "UPDATE users SET password_hash=$1, is_admin=true, email_verified=true, is_active=true WHERE id=$2",
      [hash, userId]
    );
    console.log(`✅ Updated existing user id=${userId}`);
  } else {
    const ins = await pool.query(
      `INSERT INTO users (email, password_hash, name, whatsapp, language, email_verified, is_active, is_admin)
       VALUES ($1,$2,$3,$4,$5,true,true,true) RETURNING id`,
      [ADMIN_EMAIL, hash, ADMIN_NAME, "96171735478", "en"]
    );
    userId = ins.rows[0].id;
    console.log(`✅ Created admin user id=${userId}`);
  }

  // Get category id
  const cat = await pool.query("SELECT id FROM categories WHERE slug='fashion' OR id=1 LIMIT 1");
  const categoryId = cat.rows[0]?.id ?? null;

  // Get country id
  const country = await pool.query("SELECT id FROM countries WHERE code='LB' OR id=1 LIMIT 1");
  const countryId = country.rows[0]?.id ?? null;

  // Get city id
  const city = countryId
    ? await pool.query("SELECT id FROM cities WHERE country_id=$1 LIMIT 1", [countryId])
    : { rows: [] };
  const cityId = city.rows[0]?.id ?? null;

  // Upsert business
  const bizExisting = await pool.query("SELECT id FROM businesses WHERE user_id=$1", [userId]);
  let bizId;
  const trialEnd = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

  if (bizExisting.rows.length > 0) {
    bizId = bizExisting.rows[0].id;
    await pool.query(
      `UPDATE businesses SET name=$1, slug=$2, category_id=$3, country_id=$4, city_id=$5,
       whatsapp=$6, subscription_type='trial', trial_starts_at=NOW(), trial_ends_at=$7, is_active=true
       WHERE id=$8`,
      ["Saylora Demo Store", "saylora-demo", categoryId, countryId, cityId, "96171735478", trialEnd, bizId]
    );
    console.log(`✅ Updated existing business id=${bizId}`);
  } else {
    const bizIns = await pool.query(
      `INSERT INTO businesses (user_id, name, slug, category_id, country_id, city_id, whatsapp,
       subscription_type, trial_starts_at, trial_ends_at, is_active)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'trial',NOW(),$8,true) RETURNING id`,
      [userId, "Saylora Demo Store", "saylora-demo", categoryId, countryId, cityId, "96171735478", trialEnd]
    );
    bizId = bizIns.rows[0].id;
    console.log(`✅ Created business id=${bizId}`);
  }

  // Demo products
  const demoProducts = [
    { name: "Classic White T-Shirt", description: "Premium 100% cotton tee, perfect for everyday wear.", price: "19.99", image: null, available: true },
    { name: "Slim Fit Chinos", description: "Modern slim-fit trousers in versatile beige.", price: "49.99", image: null, available: true },
    { name: "Leather Sneakers", description: "Handcrafted genuine leather sneakers.", price: "89.99", image: null, available: true },
    { name: "Canvas Tote Bag", description: "Eco-friendly canvas bag with inside pocket.", price: "24.99", image: null, available: true },
    { name: "Minimalist Watch", description: "Clean dial stainless steel watch.", price: "129.99", image: null, available: false },
  ];

  // Delete old demo products for this business
  await pool.query("DELETE FROM products WHERE business_id=$1", [bizId]);
  for (const p of demoProducts) {
    await pool.query(
      "INSERT INTO products (business_id, name, description, price, image, available) VALUES ($1,$2,$3,$4,$5,$6)",
      [bizId, p.name, p.description, p.price, p.image, p.available]
    );
  }
  console.log(`✅ Inserted ${demoProducts.length} demo products`);

  console.log("\n🎉 Done! Admin credentials:");
  console.log(`   Email:    ${ADMIN_EMAIL}`);
  console.log(`   Password: ${ADMIN_PASSWORD}`);
  console.log(`   Store:    /store/saylora-demo`);

  await pool.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
