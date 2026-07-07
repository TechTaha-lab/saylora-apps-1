import jwt from "jsonwebtoken";
import crypto from "crypto";

const JWT_SECRET = process.env.SESSION_SECRET;
if (!JWT_SECRET) {
  throw new Error("SESSION_SECRET environment variable is required but not set.");
}
const ACCESS_TOKEN_EXPIRY = "15m";

export function generateAccessToken(userId: number, email: string): string {
  return jwt.sign({ userId, email, type: "access" }, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });
}

export function generateRefreshToken(): string {
  return crypto.randomBytes(64).toString("hex");
}

export function generateResetToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function verifyAccessToken(token: string): { userId: number; email: string } {
  const decoded = jwt.verify(token, JWT_SECRET) as {
    userId: number;
    email: string;
    type: string;
  };
  if (decoded.type !== "access") {
    throw new Error("Invalid token type");
  }
  return { userId: decoded.userId, email: decoded.email };
}

export function getRefreshTokenExpiry(rememberMe: boolean): Date {
  const days = rememberMe ? 30 : 7;
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + days);
  return expiry;
}
