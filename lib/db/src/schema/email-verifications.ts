import {
  pgTable,
  text,
  serial,
  timestamp,
} from "drizzle-orm/pg-core";

export const emailVerificationsTable = pgTable("email_verifications", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  code: text("code").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  used: text("used").notNull().default("false"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type EmailVerification = typeof emailVerificationsTable.$inferSelect;
