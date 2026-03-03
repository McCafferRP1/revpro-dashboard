"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export async function logoutAction() {
  const store = await cookies();
  const path = process.env.NEXT_PUBLIC_BASE_PATH || "/";
  store.set("revpro_session", "", { path, maxAge: 0 });
  redirect("/login");
}
