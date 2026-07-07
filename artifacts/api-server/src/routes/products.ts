import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db } from "@workspace/db";
import { productsTable, businessesTable } from "@workspace/db";
import { requireAuth } from "../lib/auth-middleware";

const router: IRouter = Router();

async function getBusinessId(userId: number): Promise<number | null> {
  const [business] = await db
    .select({ id: businessesTable.id })
    .from(businessesTable)
    .where(eq(businessesTable.userId, userId))
    .limit(1);
  return business?.id ?? null;
}

router.get("/products", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as unknown as { userId: number }).userId;
  const businessId = await getBusinessId(userId);

  if (!businessId) {
    res.status(404).json({ error: "No business found" });
    return;
  }

  const products = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.businessId, businessId))
    .orderBy(productsTable.createdAt);

  res.json(products.map((p) => ({ ...p, price: p.price?.toString() ?? "0" })));
});

router.post("/products", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as unknown as { userId: number }).userId;
  const businessId = await getBusinessId(userId);

  if (!businessId) {
    res.status(404).json({ error: "No business found" });
    return;
  }

  const { name, description, price, image, available = true } = req.body;

  if (!name || price === undefined || price === null || price === "") {
    res.status(400).json({ error: "Name and price are required" });
    return;
  }

  const [product] = await db
    .insert(productsTable)
    .values({
      businessId,
      name: name.trim(),
      description: description?.trim() ?? null,
      price: String(price),
      image: image?.trim() ?? null,
      available: Boolean(available),
    })
    .returning();

  res.status(201).json({ ...product, price: product.price?.toString() ?? "0" });
});

router.put("/products/:id", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as unknown as { userId: number }).userId;
  const productId = Number(req.params["id"]);
  const businessId = await getBusinessId(userId);

  if (!businessId) {
    res.status(404).json({ error: "No business found" });
    return;
  }

  const [existing] = await db
    .select()
    .from(productsTable)
    .where(and(eq(productsTable.id, productId), eq(productsTable.businessId, businessId)))
    .limit(1);

  if (!existing) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  const { name, description, price, image, available } = req.body;
  const updates: Partial<typeof productsTable.$inferInsert> = {};

  if (name !== undefined) updates.name = name.trim();
  if (description !== undefined) updates.description = description?.trim() ?? null;
  if (price !== undefined) updates.price = String(price);
  if (image !== undefined) updates.image = image?.trim() ?? null;
  if (available !== undefined) updates.available = Boolean(available);

  const [updated] = await db
    .update(productsTable)
    .set(updates)
    .where(eq(productsTable.id, productId))
    .returning();

  res.json({ ...updated, price: updated.price?.toString() ?? "0" });
});

router.delete("/products/:id", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as unknown as { userId: number }).userId;
  const productId = Number(req.params["id"]);
  const businessId = await getBusinessId(userId);

  if (!businessId) {
    res.status(404).json({ error: "No business found" });
    return;
  }

  const [existing] = await db
    .select()
    .from(productsTable)
    .where(and(eq(productsTable.id, productId), eq(productsTable.businessId, businessId)))
    .limit(1);

  if (!existing) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  await db.delete(productsTable).where(eq(productsTable.id, productId));

  res.json({ message: "Product deleted" });
});

export default router;
