import { auth } from "@/auth";

export type SessionUser = {
  id?: string;
  email?: string | null;
  role?: string;
  repId?: string;
  tenantId?: string;
};

export async function getSession() {
  return auth();
}

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user || (session.user as SessionUser).role !== "admin") {
    throw new Response("Forbidden", { status: 403 });
  }
  return session;
}

export async function requireAuth() {
  const session = await auth();
  if (!session?.user) throw new Response("Unauthorized", { status: 401 });
  return session;
}

export async function getTenantIdOrThrow(tenantIdParam?: string | null): Promise<string> {
  const session = await auth();
  if (!session?.user) throw new Response("Unauthorized", { status: 401 });
  const u = session.user as SessionUser;
  if (u.role === "admin") {
    if (tenantIdParam) return tenantIdParam;
    const { prisma } = await import("@/lib/prisma");
    const first = await prisma.tenant.findFirst();
    if (!first) throw new Response("No tenant", { status: 404 });
    return first.id;
  }
  if (u.tenantId) return u.tenantId;
  throw new Response("Rep has no tenant", { status: 403 });
}
