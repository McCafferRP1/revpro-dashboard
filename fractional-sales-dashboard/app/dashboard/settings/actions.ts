"use server";

import { revalidatePath } from "next/cache";
import { addClient, removeClient, clearAccountManagerFromClients } from "@/lib/funnel/mockData";
import { addUser, removeUser, updateUser, getUsers } from "@/lib/auth";
import type { UserRole } from "@/lib/auth";

export async function addClientAction(params: {
  clientName: string;
  clientId?: string;
  accountManagerId?: string;
  accountManagerName?: string;
}) {
  const config = addClient(params);
  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/clients");
  revalidatePath(`/dashboard/clients/${config.clientId}`);
  return { clientId: config.clientId };
}

export async function removeClientAction(clientId: string) {
  removeClient(clientId);
  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/clients");
}

export async function addUserAction(params: {
  email: string;
  name: string;
  role: UserRole;
  isAdministrator: boolean;
  password: string;
}) {
  await addUser(params);
  revalidatePath("/dashboard/settings");
}

export async function updateUserAction(
  userId: string,
  updates: { role?: UserRole; isAdministrator?: boolean; name?: string }
) {
  await updateUser(userId, updates);
  revalidatePath("/dashboard/settings");
}

export async function removeUserAction(userId: string) {
  const users = await getUsers();
  const user = users.find((u) => u.id === userId);
  if (user?.isAdministrator && users.filter((u) => u.isAdministrator).length <= 1) {
    throw new Error("Cannot remove the last administrator.");
  }
  clearAccountManagerFromClients(userId);
  await removeUser(userId);
  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/clients");
}
