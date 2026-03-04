/**
 * Simple auth: users store, session cookie (signed), role-based access.
 * Users are persisted via the shared store (file or Postgres). Not dependent on Netlify Blobs.
 * Data is loaded on every request so it is always current.
 */

import { cookies } from "next/headers";
import { createHash, createHmac, timingSafeEqual } from "crypto";
import { storeGet, storeSet } from "@/lib/store";

export type UserRole = "account_manager" | "collaborator";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isAdministrator: boolean;
  /** Stored as hash (hex). */
  passwordHash: string;
}

const SESSION_COOKIE = "revpro_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days
const SECRET = process.env.SESSION_SECRET ?? "revpro-dev-secret-change-in-production";

function sign(payload: string): string {
  return createHmac("sha256", SECRET).update(payload).digest("hex");
}

function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

/** Seed user for first-run and local fallback. */
function seedUser(): User {
  return {
    id: "matt",
    email: "matt@revpro.io",
    name: "Matt",
    role: "account_manager",
    isAdministrator: true,
    passwordHash: hashPassword("revpro"),
  };
}

async function getUsersStore(): Promise<User[]> {
  const raw = await storeGet("users");
  if (!raw) {
    const initial = [seedUser()];
    await storeSet("users", JSON.stringify(initial));
    return initial;
  }
  try {
    return JSON.parse(raw) as User[];
  } catch {
    return [seedUser()];
  }
}

async function setUsersStore(users: User[]): Promise<void> {
  await storeSet("users", JSON.stringify(users));
}

export async function getUsers(): Promise<Omit<User, "passwordHash">[]> {
  const store = await getUsersStore();
  return store.map(({ passwordHash: _, ...u }) => u);
}

export async function addUser(params: {
  email: string;
  name: string;
  role: UserRole;
  isAdministrator: boolean;
  password: string;
}): Promise<User> {
  const store = await getUsersStore();
  const existing = store.find((u) => u.email.toLowerCase() === params.email.toLowerCase());
  if (existing) throw new Error("A user with this email already exists.");
  const id = params.email.toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 32) + "-" + Date.now().toString(36);
  const user: User = {
    id,
    email: params.email.toLowerCase(),
    name: params.name,
    role: params.role,
    isAdministrator: params.isAdministrator,
    passwordHash: hashPassword(params.password),
  };
  store.push(user);
  await setUsersStore(store);
  return user;
}

export async function updateUser(
  userId: string,
  updates: { role?: UserRole; isAdministrator?: boolean; name?: string }
): Promise<User | null> {
  const store = await getUsersStore();
  const user = store.find((u) => u.id === userId);
  if (!user) return null;
  if (updates.role !== undefined) user.role = updates.role;
  if (updates.isAdministrator !== undefined) user.isAdministrator = updates.isAdministrator;
  if (updates.name !== undefined) user.name = updates.name;
  await setUsersStore(store);
  return user;
}

export async function getUserById(id: string): Promise<User | null> {
  const store = await getUsersStore();
  return store.find((u) => u.id === id) ?? null;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const store = await getUsersStore();
  return store.find((u) => u.email.toLowerCase() === email.toLowerCase()) ?? null;
}

export async function removeUser(id: string): Promise<boolean> {
  const store = await getUsersStore();
  const idx = store.findIndex((u) => u.id === id);
  if (idx < 0) return false;
  store.splice(idx, 1);
  await setUsersStore(store);
  return true;
}

export interface Session {
  userId: string;
  role: UserRole;
  name: string;
  isAdministrator: boolean;
}

export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  const [payloadB64, sig] = raw.split(".");
  if (!payloadB64 || !sig) return null;
  const expectedSig = sign(payloadB64);
  if (expectedSig.length !== sig.length || !timingSafeEqual(Buffer.from(expectedSig), Buffer.from(sig)))
    return null;
  let payload: { userId: string; role: UserRole; exp: number };
  try {
    payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString());
  } catch {
    return null;
  }
  if (payload.exp < Date.now() / 1000) return null;
  const user = await getUserById(payload.userId);
  if (!user) return null;
  return { userId: user.id, role: user.role, name: user.name, isAdministrator: user.isAdministrator };
}

export function createSessionPayload(user: User): string {
  const payload = {
    userId: user.id,
    role: user.role,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE,
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = sign(payloadB64);
  return `${payloadB64}.${sig}`;
}

export function getSessionCookieMaxAge(): number {
  return SESSION_MAX_AGE;
}

export function verifyPassword(user: User, password: string): boolean {
  return timingSafeEqual(
    Buffer.from(user.passwordHash),
    Buffer.from(hashPassword(password))
  );
}

export { hashPassword };
