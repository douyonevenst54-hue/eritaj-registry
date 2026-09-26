import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

const SESSION_COOKIE = "eritaj_session";
const LOGIN_TOKEN_TTL_MS = 15 * 60 * 1000; // 15 minutes
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const MAX_LINKS_PER_WINDOW = 3; // per email, per 15 minutes

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function newToken(): string {
  return randomBytes(32).toString("base64url");
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Always build links from our own configured URL, never from the request's
// Host header — otherwise an attacker could make us email links to their site.
export function appUrl(): string {
  return (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

// ── Login tokens ──

/** Returns a raw token to email, or null if this email hit the rate limit. */
export async function createLoginToken(email: string): Promise<string | null> {
  const since = new Date(Date.now() - LOGIN_TOKEN_TTL_MS);
  const recent = await prisma.loginToken.count({
    where: { email, createdAt: { gte: since } },
  });
  if (recent >= MAX_LINKS_PER_WINDOW) return null;

  const token = newToken();
  await prisma.loginToken.create({
    data: {
      email,
      tokenHash: sha256(token),
      expiresAt: new Date(Date.now() + LOGIN_TOKEN_TTL_MS),
    },
  });
  return token;
}

/** Marks the token used (single-use, atomic) and returns its email, or null. */
export async function consumeLoginToken(token: string): Promise<string | null> {
  const tokenHash = sha256(token);
  const claimed = await prisma.loginToken.updateMany({
    where: { tokenHash, usedAt: null, expiresAt: { gt: new Date() } },
    data: { usedAt: new Date() },
  });
  if (claimed.count !== 1) return null;

  const row = await prisma.loginToken.findUnique({ where: { tokenHash } });
  return row?.email ?? null;
}

// ── Users ──

function adminEmails(): Set<string> {
  return new Set(
    (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map(normalizeEmail)
      .filter(Boolean),
  );
}

export async function upsertUserByEmail(email: string) {
  const now = new Date();
  const admin = adminEmails().has(email) ? { role: "ADMIN" as const } : {};
  return prisma.user.upsert({
    where: { email },
    create: { email, emailVerifiedAt: now, ...admin },
    update: { emailVerifiedAt: now, ...admin },
  });
}

// ── Sessions ──

export async function createSession(userId: string): Promise<void> {
  const token = newToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await prisma.session.create({
    data: { userId, tokenHash: sha256(token), expiresAt },
  });

  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function getCurrentUser() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { tokenHash: sha256(token) },
    include: { user: true },
  });
  if (!session || session.expiresAt < new Date()) return null;
  return session.user;
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { tokenHash: sha256(token) } });
  }
  jar.delete(SESSION_COOKIE);
}
