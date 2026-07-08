import bcrypt from "bcryptjs";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  const ADMIN_EMAIL = "92130352@students.liu.edu.lb";
  const ADMIN_PASSWORD = "Taha@#$2003";

  const hash = await bcrypt.hash(ADMIN_PASSWORD, 12);

  // Upsert user
  const existing = await pool.query(
    "SELECT id FROM users WHERE email = $1",
    [ADMIN_EMAIL]
  );

  let userId: number;
  if (existing.rows.length > 0) {
    userId = existing.rows[0].id;
    await pool.query(
      "UPDATE users SET password_hash=$1, is_admin=true, email_verified=true, is_active=true WHERE id=$2",
      [hash, userId]
    );
    console.log(`Updated user id=${userId}`);
  } else {
    const ins = await pool.query(
      `INSERT INTO users (email, password_hash, name, whatsapp, language, email_verified, is_active, is_admin)
       VALUES ($1,$2,$3,$4,$5,true,true,true) RETURNING id`,
      [ADMIN_EMAIL, hash, "Taha Kourani", "96171735478", "en"]
    );
    userId = ins.rows[0].id;
    console.log(`Created user id=${userId}`);
  }

  // Get country/city
  const ctry = await pool.query("SELECT id FROM countries WHERE code='LB' LIMIT 1");
  const countryId = ctry.rows[0]?.id ?? null;
  const cty = countryId
    ? await pool.query("SELECT id FROM cities WHERE country_id=$1 LIMIT 1", [countryId])
    : { rows: [] };
  const cityId = (cty as any).rows[0]?.id ?? null;

  // Upsert business
  const trialEnd = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
  const bizExisting = await pool.query(
    "SELECT id FROM businesses WHERE user_id=$1",
    [userId]
  );

  let bizId: number;
  if (bizExisting.rows.length > 0) {
    bizId = bizExisting.rows[0].id;
    await pool.query(
      `UPDATE businesses SET name=$1,slug=$2,country_id=$3,city_id=$4,whatsapp=$5,
       subscription_type='trial',trial_starts_at=NOW(),trial_ends_at=$6,is_active=true WHERE id=$7`,
      ["Saylora Demo Store", "saylora-demo", countryId, cityId, "96171735478", trialEnd, bizId]
    );
    console.log(`Updated business id=${bizId}`);
  } else {
    const b = await pool.query(
      `INSERT INTO businesses (user_id,name,slug,country_id,city_id,whatsapp,subscription_type,trial_starts_at,trial_ends_at,is_active)
       VALUES ($1,$2,$3,$4,$5,$6,'trial',NOW(),$7,true) RETURNING id`,
      [userId, "Saylora Demo Store", "saylora-demo", countryId, cityId, "96171735478", trialEnd]
    );
    bizId = b.rows[0].id;
    console.log(`Created business id=${bizId}`);
  }

  // Seed products
  await pool.query("DELETE FROM products WHERE business_id=$1", [bizId]);
  const products = [
    ["Classic White T-Shirt", "Premium 100% cotton tee, perfect for everyday wear.", "19.99", true],
    ["Slim Fit Chinos", "Modern slim-fit trousers in versatile beige.", "49.99", true],
    ["Leather Sneakers", "Handcrafted genuine leather sneakers.", "89.99", true],
    ["Canvas Tote Bag", "Eco-friendly canvas bag with inside pocket.", "24.99", true],
    ["Minimalist Watch", "Clean dial stainless steel watch.", "129.99", false],
  ];
  for (const [name, desc, price, avail] of products) {
    await pool.query(
      "INSERT INTO products (business_id, name, description, price, available) VALUES ($1,$2,$3,$4,$5)",
      [bizId, name, desc, price, avail]
    );
  }
  console.log(`Inserted ${products.length} demo products`);
  console.log(`\n✅ Admin: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  console.log(`   Store: /store/saylora-demo`);
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
