"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export async function logoutAction() {
  const store = await cookies();
  store.delete("revpro_session");
  redirect("/login");
}
