"use client";

import { useState } from "react";
import type { Tenant } from "@prisma/client";

export function RepsForm({
  tenantId,
  tenantOptions,
}: {
  tenantId: string;
  tenantOptions: Tenant[];
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !tenantId) return;
    setLoading(true);
    try {
      const res = await fetch("/api/reps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim() || undefined, tenantId }),
      });
      if (res.ok) {
        setName("");
        setEmail("");
        window.location.reload();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap gap-2 items-end">
      <div>
        <label className="block text-xs text-zinc-500 mb-0.5">Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Rep name"
          className="px-3 py-2 border border-zinc-300 rounded-lg w-48"
        />
      </div>
      <div>
        <label className="block text-xs text-zinc-500 mb-0.5">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="optional"
          className="px-3 py-2 border border-zinc-300 rounded-lg w-48"
        />
      </div>
      <button
        type="submit"
        disabled={loading || !tenantId}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        Add rep
      </button>
    </form>
  );
}
