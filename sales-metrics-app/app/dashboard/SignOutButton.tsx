"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="text-zinc-500 hover:text-zinc-700 text-sm"
    >
      Sign out
    </button>
  );
}
