---
name: Saylora Architecture
description: Key architecture decisions and quirks for the Saylora multi-tenant store platform rebuild
---

## App Overview
Saylora is a multi-tenant digital storefront platform. Businesses register, get a 14-day trial, manage products, and share a public store link. Orders come via WhatsApp.

## Stack
- API: Express + Drizzle ORM + PostgreSQL (Replit managed)
- Mobile: Expo (expo-router file-based routing)
- API client: orval-generated React Query hooks from OpenAPI spec

## Key Conventions
- All routes are mounted at `/api` prefix
- Auth: JWT access tokens (15m, signed with `SESSION_SECRET`) + random refresh tokens stored in DB
- JWT: `SESSION_SECRET` env var is REQUIRED — code throws at startup if missing (no fallback)
- Refresh tokens stored in `refresh_tokens` table; rotated on use
- Email (SMTP): optional — failures are logged but responses still succeed (graceful fallback)
- Image uploads: `/api/upload` via multer, stored in `artifacts/api-server/uploads/`, served at `/api/uploads/:filename`

## Route Groups (Mobile)
- `(auth)`: login, register, forgot-password, otp, reset-password, verify-email
- `(home)`: dashboard (index), products, orders
- `(store)`: public [slug] store page
- `(admin)`: admin user management

## Database Tables
users, businesses, categories, countries, cities, products, refresh_tokens, otp_codes, password_reset_tokens, email_verifications

## Seed Data
16 categories + 16 countries with 3 cities each — auto-seeded on first API server startup if categories table is empty.

## TypeScript Quirks
- `useListCities` with `enabled` option needs `as any` cast — TanStack Query v5 requires `queryKey` in `UseQueryOptions` but orval provides it internally
- `useColors.ts` dark palette access needs `as unknown as Record<string, ...>` cast due to `radius: number` in colors object

## SMTP Setup (not configured)
Set `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM_NAME`, `SMTP_FROM_EMAIL` env vars to enable email. Without these, OTP codes won't be sent via email.
