import { Router } from "express";
import { eq, desc, ne } from "drizzle-orm";
import { db } from "@workspace/db";
import { usersTable, businessesTable } from "@workspace/db";
import { requireAdmin } from "../lib/auth-middleware";

const router = Router();

router.get("/admin/users", requireAdmin, async (_req, res): Promise<void> => {
  const users = await db
    .select({
      id: usersTable.id,
      email: usersTable.email,
      name: usersTable.name,
      whatsapp: usersTable.whatsapp,
      isActive: usersTable.isActive,
      isAdmin: usersTable.isAdmin,
      emailVerified: usersTable.emailVerified,
      createdAt: usersTable.createdAt,
      businessId: businessesTable.id,
      businessName: businessesTable.name,
      businessSlug: businessesTable.slug,
      subscriptionType: businessesTable.subscriptionType,
      businessIsActive: businessesTable.isActive,
      trialEndsAt: businessesTable.trialEndsAt,
      subscriptionExpiresAt: businessesTable.subscriptionExpiresAt,
    })
    .from(usersTable)
    .leftJoin(businessesTable, eq(businessesTable.userId, usersTable.id))
    .where(ne(usersTable.isAdmin, true))
    .orderBy(desc(usersTable.createdAt));

  res.json(users);
});

router.post("/admin/users/:id/activate", requireAdmin, async (req, res): Promise<void> => {
  const id = Number(req.params["id"]);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid user id" });
    return;
  }
  await db.update(usersTable).set({ isActive: true }).where(eq(usersTable.id, id));
  await db.update(businessesTable).set({ isActive: true }).where(eq(businessesTable.userId, id));
  res.json({ message: "User activated successfully" });
});

router.post("/admin/users/:id/deactivate", requireAdmin, async (req, res): Promise<void> => {
  const id = Number(req.params["id"]);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid user id" });
    return;
  }
  await db.update(usersTable).set({ isActive: false }).where(eq(usersTable.id, id));
  await db.update(businessesTable).set({ isActive: false }).where(eq(businessesTable.userId, id));
  res.json({ message: "User deactivated successfully" });
});

router.post("/admin/users/:id/subscription", requireAdmin, async (req, res): Promise<void> => {
  const id = Number(req.params["id"]);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid user id" });
    return;
  }
  const { type } = req.body as { type: string };
  if (type !== "monthly" && type !== "yearly") {
    res.status(400).json({ error: "type must be monthly or yearly" });
    return;
  }

  const now = new Date();
  const days = type === "yearly" ? 365 : 30;
  const expiresAt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  await db
    .update(businessesTable)
    .set({ subscriptionType: type, subscriptionExpiresAt: expiresAt, isActive: true })
    .where(eq(businessesTable.userId, id));

  await db.update(usersTable).set({ isActive: true }).where(eq(usersTable.id, id));

  res.json({ message: `Subscription set to ${type}` });
});

export default router;
