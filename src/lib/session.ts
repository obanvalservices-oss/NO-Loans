import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { getAuthSecret, SESSION_COOKIE } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import type { CompanyScope } from "@/lib/company-scope";

export type SessionPayload = {
  sub: string;
  email: string;
  role: "admin" | "user";
};

const COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 7;

export async function signSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({
    email: payload.email,
    role: payload.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${COOKIE_MAX_AGE_SEC}s`)
    .sign(getAuthSecret());
}

export async function verifySessionToken(
  token: string,
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getAuthSecret());
    const sub = payload.sub;
    const email = typeof payload.email === "string" ? payload.email : "";
    const role =
      payload.role === "admin" || payload.role === "user" ? payload.role : null;
    if (!sub || !email || !role) return null;
    return { sub, email, role };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const jar = await cookies();
  const raw = jar.get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  return verifySessionToken(raw);
}

export async function setSessionCookie(token: string): Promise<void> {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE_SEC,
    secure: process.env.NODE_ENV === "production",
  });
}

export async function clearSessionCookie(): Promise<void> {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
    secure: process.env.NODE_ENV === "production",
  });
}

export async function getCompanyScope(): Promise<CompanyScope | null> {
  const session = await getSession();
  if (!session) return null;
  const userId = Number(session.sub);
  if (!Number.isInteger(userId)) return null;
  return loadCompanyScope(userId, session.role);
}

export async function loadCompanyScope(
  userId: number,
  role: "admin" | "user",
): Promise<CompanyScope> {
  if (role === "admin") {
    return { role: "admin", companyIds: null };
  }
  const rows = await prisma.userCompanyAccess.findMany({
    where: { user_id: userId },
    orderBy: { company_id: "asc" },
    select: { company_id: true },
  });
  return {
    role: "user",
    userId,
    companyIds: rows.map((r) => r.company_id),
  };
}
