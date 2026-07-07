import { Router, type IRouter } from "express";
import { eq, and, gt } from "drizzle-orm";
import { db } from "@workspace/db";
import {
  usersTable,
  businessesTable,
  refreshTokensTable,
  otpCodesTable,
  passwordResetTokensTable,
  emailVerificationsTable,
} from "@workspace/db";
import { hashPassword, comparePassword } from "../lib/hash";
import {
  generateAccessToken,
  generateRefreshToken,
  generateResetToken,
  generateOtp,
  getRefreshTokenExpiry,
} from "../lib/jwt";
import { sendVerificationEmail, sendPasswordResetEmail } from "../lib/email";

const router: IRouter = Router();

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .substring(0, 50);
}

function makeUniqueSlug(base: string): string {
  const suffix = Date.now().toString(36);
  return `${slugify(base)}-${suffix}`;
}

router.post("/auth/register", async (req, res): Promise<void> => {
  const {
    email,
    password,
    name,
    whatsapp,
    language = "en",
    businessName,
    categoryId,
    countryId,
    cityId,
    acceptTerms,
  } = req.body;

  if (!email || !password || !name || !businessName || !acceptTerms) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  if (password.length < 8) {
    res.status(400).json({ error: "Password must be at least 8 characters" });
    return;
  }

  const existingUser = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email.toLowerCase().trim()))
    .limit(1);

  if (existingUser.length > 0) {
    res.status(409).json({ error: "Email already registered" });
    return;
  }

  const passwordHash = await hashPassword(password);
  const [user] = await db
    .insert(usersTable)
    .values({
      email: email.toLowerCase().trim(),
      passwordHash,
      name: name.trim(),
      whatsapp: whatsapp?.trim() ?? null,
      language,
      emailVerified: false,
    })
    .returning();

  const slug = makeUniqueSlug(businessName);
  const trialStartsAt = new Date();
  const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
  const [business] = await db
    .insert(businessesTable)
    .values({
      userId: user.id,
      name: businessName.trim(),
      slug,
      categoryId: categoryId ? Number(categoryId) : null,
      countryId: countryId ? Number(countryId) : null,
      cityId: cityId ? Number(cityId) : null,
      whatsapp: whatsapp?.trim() ?? null,
      subscriptionType: "trial",
      trialStartsAt,
      trialEndsAt,
      subscriptionExpiresAt: trialEndsAt,
      isActive: true,
    })
    .returning();

  const accessToken = generateAccessToken(user.id, user.email);
  const refreshToken = generateRefreshToken();
  const expiresAt = getRefreshTokenExpiry(false);

  await db.insert(refreshTokensTable).values({
    userId: user.id,
    token: refreshToken,
    expiresAt,
  });

  const otp = generateOtp();
  const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
  await db.insert(emailVerificationsTable).values({
    email: user.email,
    code: otp,
    expiresAt: otpExpiresAt,
  });

  try {
    await sendVerificationEmail(user.email, otp);
  } catch (emailErr) {
    req.log.warn({ emailErr }, "Failed to send verification email");
  }

  req.log.info({ userId: user.id }, "User registered");

  res.status(201).json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      whatsapp: user.whatsapp,
      language: user.language,
      emailVerified: user.emailVerified,
      isAdmin: user.isAdmin,
      businessId: business.id,
      businessName: business.name,
      businessSlug: business.slug,
      businessSubscriptionType: business.subscriptionType,
      businessIsActive: business.isActive,
      businessTrialEndsAt: business.trialEndsAt?.toISOString() ?? null,
      businessSubscriptionExpiresAt: business.subscriptionExpiresAt?.toISOString() ?? null,
    },
    accessToken,
    refreshToken,
  });
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const { email, password, rememberMe = false } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email.toLowerCase().trim()))
    .limit(1);

  if (!user) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const isValid = await comparePassword(password, user.passwordHash);
  if (!isValid) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const [business] = await db
    .select()
    .from(businessesTable)
    .where(eq(businessesTable.userId, user.id))
    .limit(1);

  const now = new Date();
  let businessIsActive = business?.isActive ?? true;
  if (business && businessIsActive) {
    const expiryDate =
      business.subscriptionType === "trial"
        ? business.trialEndsAt
        : business.subscriptionExpiresAt;
    if (expiryDate && expiryDate < now) {
      await db
        .update(businessesTable)
        .set({ isActive: false })
        .where(eq(businessesTable.id, business.id));
      businessIsActive = false;
    }
  }

  const accessToken = generateAccessToken(user.id, user.email);
  const refreshToken = generateRefreshToken();
  const expiresAt = getRefreshTokenExpiry(rememberMe);

  await db.insert(refreshTokensTable).values({
    userId: user.id,
    token: refreshToken,
    expiresAt,
  });

  req.log.info({ userId: user.id }, "User logged in");

  res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      whatsapp: user.whatsapp,
      language: user.language,
      emailVerified: user.emailVerified,
      isAdmin: user.isAdmin,
      businessId: business?.id ?? null,
      businessName: business?.name ?? null,
      businessSlug: business?.slug ?? null,
      businessSubscriptionType: business?.subscriptionType ?? null,
      businessIsActive,
      businessTrialEndsAt: business?.trialEndsAt?.toISOString() ?? null,
      businessSubscriptionExpiresAt:
        business?.subscriptionExpiresAt?.toISOString() ?? null,
    },
    accessToken,
    refreshToken,
  });
});

router.post("/auth/logout", async (req, res): Promise<void> => {
  const { refreshToken } = req.body;

  if (refreshToken) {
    await db
      .delete(refreshTokensTable)
      .where(eq(refreshTokensTable.token, refreshToken));
  }

  res.json({ message: "Logged out successfully" });
});

router.post("/auth/refresh", async (req, res): Promise<void> => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    res.status(401).json({ error: "Refresh token required" });
    return;
  }

  const [storedToken] = await db
    .select()
    .from(refreshTokensTable)
    .where(
      and(
        eq(refreshTokensTable.token, refreshToken),
        gt(refreshTokensTable.expiresAt, new Date())
      )
    )
    .limit(1);

  if (!storedToken) {
    res.status(401).json({ error: "Invalid or expired refresh token" });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, storedToken.userId))
    .limit(1);

  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }

  await db
    .delete(refreshTokensTable)
    .where(eq(refreshTokensTable.id, storedToken.id));

  const newAccessToken = generateAccessToken(user.id, user.email);
  const newRefreshToken = generateRefreshToken();
  const expiresAt = getRefreshTokenExpiry(false);

  await db.insert(refreshTokensTable).values({
    userId: user.id,
    token: newRefreshToken,
    expiresAt,
  });

  res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
});

router.post("/auth/forgot-password", async (req, res): Promise<void> => {
  const { email } = req.body;

  if (!email) {
    res.status(400).json({ error: "Email is required" });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email.toLowerCase().trim()))
    .limit(1);

  if (!user) {
    res.status(404).json({ error: "No account found with this email" });
    return;
  }

  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await db.insert(otpCodesTable).values({
    email: email.toLowerCase().trim(),
    code: otp,
    expiresAt,
  });

  try {
    await sendPasswordResetEmail(email.toLowerCase().trim(), otp);
    req.log.info({ email }, "Password reset OTP sent via email");
  } catch (emailErr) {
    req.log.warn({ emailErr }, "Failed to send reset email");
  }

  res.json({ message: `A password reset code has been sent to ${email}.` });
});

router.post("/auth/otp/verify", async (req, res): Promise<void> => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    res.status(400).json({ error: "Email and OTP are required" });
    return;
  }

  const [otpRecord] = await db
    .select()
    .from(otpCodesTable)
    .where(
      and(
        eq(otpCodesTable.email, email.toLowerCase().trim()),
        eq(otpCodesTable.code, otp),
        eq(otpCodesTable.used, "false"),
        gt(otpCodesTable.expiresAt, new Date())
      )
    )
    .limit(1);

  if (!otpRecord) {
    res.status(400).json({ error: "Invalid or expired OTP" });
    return;
  }

  await db
    .update(otpCodesTable)
    .set({ used: "true" })
    .where(eq(otpCodesTable.id, otpRecord.id));

  const resetToken = generateResetToken();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  await db.insert(passwordResetTokensTable).values({
    email: email.toLowerCase().trim(),
    token: resetToken,
    expiresAt,
  });

  res.json({ resetToken, message: "OTP verified. You may now reset your password." });
});

router.post("/auth/reset-password", async (req, res): Promise<void> => {
  const { resetToken, password, confirmPassword } = req.body;

  if (!resetToken || !password || !confirmPassword) {
    res.status(400).json({ error: "All fields are required" });
    return;
  }

  if (password !== confirmPassword) {
    res.status(400).json({ error: "Passwords do not match" });
    return;
  }

  if (password.length < 8) {
    res.status(400).json({ error: "Password must be at least 8 characters" });
    return;
  }

  const [tokenRecord] = await db
    .select()
    .from(passwordResetTokensTable)
    .where(
      and(
        eq(passwordResetTokensTable.token, resetToken),
        eq(passwordResetTokensTable.used, "false"),
        gt(passwordResetTokensTable.expiresAt, new Date())
      )
    )
    .limit(1);

  if (!tokenRecord) {
    res.status(400).json({ error: "Invalid or expired reset token" });
    return;
  }

  const passwordHash = await hashPassword(password);

  await db
    .update(usersTable)
    .set({ passwordHash })
    .where(eq(usersTable.email, tokenRecord.email));

  await db
    .update(passwordResetTokensTable)
    .set({ used: "true" })
    .where(eq(passwordResetTokensTable.id, tokenRecord.id));

  const [updatedUser] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, tokenRecord.email))
    .limit(1);

  if (updatedUser) {
    await db
      .delete(refreshTokensTable)
      .where(eq(refreshTokensTable.userId, updatedUser.id));
  }

  res.json({ message: "Password reset successfully. Please log in." });
});

router.post("/auth/verify-email", async (req, res): Promise<void> => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    res.status(400).json({ error: "Email and OTP are required" });
    return;
  }

  const [record] = await db
    .select()
    .from(emailVerificationsTable)
    .where(
      and(
        eq(emailVerificationsTable.email, email.toLowerCase().trim()),
        eq(emailVerificationsTable.code, otp),
        eq(emailVerificationsTable.used, "false"),
        gt(emailVerificationsTable.expiresAt, new Date())
      )
    )
    .limit(1);

  if (!record) {
    res.status(400).json({ error: "Invalid or expired verification code" });
    return;
  }

  await db
    .update(emailVerificationsTable)
    .set({ used: "true" })
    .where(eq(emailVerificationsTable.id, record.id));

  await db
    .update(usersTable)
    .set({ emailVerified: true })
    .where(eq(usersTable.email, email.toLowerCase().trim()));

  res.json({ message: "Email verified successfully." });
});

router.post("/auth/resend-verification", async (req, res): Promise<void> => {
  const { email } = req.body;

  if (!email) {
    res.status(400).json({ error: "Email is required" });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email.toLowerCase().trim()))
    .limit(1);

  if (!user) {
    res.status(400).json({ error: "Account not found" });
    return;
  }

  if (user.emailVerified) {
    res.status(400).json({ error: "Email is already verified" });
    return;
  }

  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await db.insert(emailVerificationsTable).values({
    email: user.email,
    code: otp,
    expiresAt,
  });

  try {
    await sendVerificationEmail(user.email, otp);
  } catch (emailErr) {
    req.log.warn({ emailErr }, "Failed to resend verification email");
  }

  res.json({ message: `Verification code sent to ${email}.` });
});

export default router;
