import { Router, type IRouter } from "express";
import { eq, count } from "drizzle-orm";
import { db } from "@workspace/db";
import {
  businessesTable,
  productsTable,
  categoriesTable,
  countriesTable,
  citiesTable,
} from "@workspace/db";

const router: IRouter = Router();

router.get("/stores", async (_req, res): Promise<void> => {
  const businesses = await db
    .select({
      id: businessesTable.id,
      name: businessesTable.name,
      slug: businessesTable.slug,
      logo: businessesTable.logo,
      category: categoriesTable.name,
    })
    .from(businessesTable)
    .leftJoin(categoriesTable, eq(businessesTable.categoryId, categoriesTable.id))
    .orderBy(businessesTable.createdAt);

  const result = await Promise.all(
    businesses.map(async (b) => {
      const [{ value: productCount }] = await db
        .select({ value: count() })
        .from(productsTable)
        .where(eq(productsTable.businessId, b.id));
      return {
        id: b.id,
        name: b.name,
        slug: b.slug,
        logo: b.logo ?? null,
        category: b.category ?? null,
        productCount: Number(productCount),
      };
    })
  );

  res.json(result);
});

router.get("/store/:slug", async (req, res): Promise<void> => {
  const { slug } = req.params;

  const [business] = await db
    .select({
      id: businessesTable.id,
      name: businessesTable.name,
      slug: businessesTable.slug,
      whatsapp: businessesTable.whatsapp,
      logo: businessesTable.logo,
      category: categoriesTable.name,
      country: countriesTable.name,
      city: citiesTable.name,
    })
    .from(businessesTable)
    .leftJoin(categoriesTable, eq(businessesTable.categoryId, categoriesTable.id))
    .leftJoin(countriesTable, eq(businessesTable.countryId, countriesTable.id))
    .leftJoin(citiesTable, eq(businessesTable.cityId, citiesTable.id))
    .where(eq(businessesTable.slug, slug))
    .limit(1);

  if (!business) {
    res.status(404).json({ error: "Store not found" });
    return;
  }

  const products = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.businessId, business.id))
    .orderBy(productsTable.createdAt);

  res.json({
    id: business.id,
    name: business.name,
    slug: business.slug,
    whatsapp: business.whatsapp ?? null,
    logo: business.logo ?? null,
    category: business.category ?? null,
    country: business.country ?? null,
    city: business.city ?? null,
    products: products.map((p) => ({ ...p, price: p.price?.toString() ?? "0" })),
  });
});

export default router;
