"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { logServerException } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { clearSessionCookie, setSessionCookie, signSessionToken } from "@/lib/session";

export async function loginAction(
  _prev: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  const emailRaw = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const fromRaw = String(formData.get("from") ?? "/");

  if (!emailRaw || !password) {
    return { error: "Email and password are required" };
  }

  const emailNorm = emailRaw.toLowerCase();

  let row: {
    id: number;
    email: string;
    password_hash: string;
    role: string;
  } | null = null;
  try {
    row = await prisma.user.findUnique({
      where: { email: emailNorm },
      select: {
        id: true,
        email: true,
        password_hash: true,
        role: true,
      },
    });
  } catch (e) {
    logServerException("loginAction.lookup", e);
    return {
      error: "Sign-in is temporarily unavailable. Please try again later.",
    };
  }

  if (!row || !bcrypt.compareSync(password, row.password_hash)) {
    return { error: "Invalid email or password" };
  }

  if (row.role !== "admin" && row.role !== "user") {
    return { error: "Invalid account" };
  }

  try {
    const token = await signSessionToken({
      sub: String(row.id),
      email: row.email,
      role: row.role,
    });
    await setSessionCookie(token);
  } catch (e) {
    logServerException("loginAction.session", e);
    return { error: "Could not start a session. Please try again." };
  }

  const dest =
    fromRaw.startsWith("/") && !fromRaw.startsWith("//") ? fromRaw : "/";
  redirect(dest);
}

export async function logoutAction(): Promise<void> {
  await clearSessionCookie();
  redirect("/login");
}
