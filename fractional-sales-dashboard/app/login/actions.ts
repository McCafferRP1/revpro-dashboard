"use server";

import { redirect } from "next/navigation";
import {
  getUserByEmail,
  verifyPassword,
  createSessionPayload,
  getSessionCookieMaxAge,
} from "@/lib/auth";

export async function loginAction(
  email: string,
  password: string,
  callbackUrl: string
): Promise<{ error?: string }> {
  const user = getUserByEmail(email);
  if (!user) return { error: "Invalid email or password." };
  if (!verifyPassword(user, password)) return { error: "Invalid email or password." };
  const value = createSessionPayload(user);
  const maxAge = getSessionCookieMaxAge();
  const { cookies } = await import("next/headers");
  const store = await cookies();
  store.set("revpro_session", value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge,
    path: process.env.NEXT_PUBLIC_BASE_PATH || "/",
  });
  redirect(callbackUrl);
}
