/**
 * Client API — Trésor de Skylis.
 */

import type {
  AdminUser,
  Citizen,
  Donation,
  Expense,
  Gain,
  MeResponse,
  Role,
  Summary,
  TopDonor,
} from "@/types";

async function apiJson<T>(path: string, init?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(path, init);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

async function apiJsonOrError<T>(
  path: string,
  init?: RequestInit,
): Promise<{ data?: T; error?: string }> {
  try {
    const res = await fetch(path, init);
    const text = await res.text();
    const parsed = text ? (JSON.parse(text) as unknown) : null;
    if (!res.ok) {
      const err =
        (parsed && typeof parsed === "object" && "error" in parsed
          ? String((parsed as { error: unknown }).error)
          : null) ?? `HTTP ${res.status}`;
      return { error: err };
    }
    return { data: parsed as T };
  } catch (e) {
    return { error: String(e) };
  }
}

/* ===== Auth ===== */

export async function fetchMe(): Promise<MeResponse> {
  const data = await apiJson<MeResponse>("/api/auth/me");
  return data ?? { user: null, permissions: [], isSuper: false };
}

export function loginWithDiscord() {
  const returnTo = window.location.pathname + window.location.search;
  window.location.href = `/api/auth/login?returnTo=${encodeURIComponent(returnTo)}`;
}

export async function logoutDiscord(): Promise<void> {
  await fetch("/api/auth/logout", { method: "POST" });
}

/* ===== Summary ===== */

export async function fetchSummary(): Promise<Summary | null> {
  return apiJson<Summary>("/api/summary");
}

export async function fetchTopDonors(limit = 10): Promise<TopDonor[]> {
  return (await apiJson<TopDonor[]>(`/api/stats/top-donors?limit=${limit}`)) ?? [];
}

/* ===== Options (dropdowns) ===== */

export interface UserOption {
  discord_id: string;
  username: string;
  avatar: string | null;
}
export interface RoleOption {
  id: string;
  name: string;
}

export async function fetchUserOptions(): Promise<UserOption[]> {
  return (await apiJson<UserOption[]>("/api/options/users")) ?? [];
}

export async function fetchRoleOptions(): Promise<RoleOption[]> {
  return (await apiJson<RoleOption[]>("/api/options/roles")) ?? [];
}

/* ===== Citoyens ===== */

export async function fetchCitizens(): Promise<Citizen[]> {
  return (await apiJson<Citizen[]>("/api/citizens")) ?? [];
}

export async function createCitizen(data: {
  name: string;
  title?: string;
  discord_id?: string;
  notes?: string;
}): Promise<{ id: string } | { error: string }> {
  const res = await apiJsonOrError<{ id: string }>("/api/citizens", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.data ?? { error: res.error ?? "Erreur inconnue" };
}

export async function updateCitizen(
  id: string,
  patch: { name?: string; title?: string; discord_id?: string; notes?: string },
): Promise<void> {
  await apiJson<{ ok: boolean }>(`/api/citizens/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
}

export async function deleteCitizen(id: string): Promise<void> {
  await apiJson<{ ok: boolean }>(`/api/citizens/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

/* ===== Dons ===== */

export async function fetchDonations(): Promise<Donation[]> {
  return (await apiJson<Donation[]>("/api/donations")) ?? [];
}

export async function createDonation(data: {
  citizen_id?: string;
  citizen_label?: string;
  amount: number;
  occurred_at?: number;
  description?: string;
}): Promise<{ id: string } | { error: string }> {
  const res = await apiJsonOrError<{ id: string }>("/api/donations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.data ?? { error: res.error ?? "Erreur inconnue" };
}

export async function updateDonation(
  id: string,
  patch: {
    citizen_id?: string;
    citizen_label?: string;
    amount?: number;
    occurred_at?: number;
    description?: string;
    in_vault?: boolean;
  },
): Promise<void> {
  await apiJson<{ ok: boolean }>(`/api/donations/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
}

export async function deleteDonation(id: string): Promise<void> {
  await apiJson<{ ok: boolean }>(`/api/donations/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

/* ===== Gains ===== */

export async function fetchGains(): Promise<Gain[]> {
  return (await apiJson<Gain[]>("/api/gains")) ?? [];
}

export async function createGain(data: {
  label: string;
  category?: string;
  amount: number;
  occurred_at?: number;
  description?: string;
}): Promise<{ id: string } | { error: string }> {
  const res = await apiJsonOrError<{ id: string }>("/api/gains", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.data ?? { error: res.error ?? "Erreur inconnue" };
}

export async function updateGain(
  id: string,
  patch: {
    label?: string;
    category?: string;
    amount?: number;
    occurred_at?: number;
    description?: string;
  },
): Promise<void> {
  await apiJson<{ ok: boolean }>(`/api/gains/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
}

export async function deleteGain(id: string): Promise<void> {
  await apiJson<{ ok: boolean }>(`/api/gains/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

/* ===== Dépenses ===== */

export async function fetchExpenses(): Promise<Expense[]> {
  return (await apiJson<Expense[]>("/api/expenses")) ?? [];
}

export async function createExpense(data: {
  label: string;
  category?: string;
  amount: number;
  occurred_at?: number;
  description?: string;
}): Promise<{ id: string } | { error: string }> {
  const res = await apiJsonOrError<{ id: string }>("/api/expenses", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.data ?? { error: res.error ?? "Erreur inconnue" };
}

export async function updateExpense(
  id: string,
  patch: {
    label?: string;
    category?: string;
    amount?: number;
    occurred_at?: number;
    description?: string;
  },
): Promise<void> {
  await apiJson<{ ok: boolean }>(`/api/expenses/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
}

export async function deleteExpense(id: string): Promise<void> {
  await apiJson<{ ok: boolean }>(`/api/expenses/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

/* ===== Admin : rôles ===== */

export async function fetchRoles(): Promise<Role[]> {
  return (await apiJson<Role[]>("/api/admin/roles")) ?? [];
}

export async function createRole(
  name: string,
  permissions: string[],
): Promise<string | null> {
  const data = await apiJson<{ id: string }>("/api/admin/roles", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, permissions }),
  });
  return data?.id ?? null;
}

export async function updateRole(
  roleId: string,
  patch: { name?: string; permissions?: string[] },
): Promise<void> {
  await apiJson<{ ok: boolean }>(
    `/api/admin/roles/${encodeURIComponent(roleId)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    },
  );
}

export async function deleteRole(roleId: string): Promise<void> {
  await apiJson<{ ok: boolean }>(
    `/api/admin/roles/${encodeURIComponent(roleId)}`,
    { method: "DELETE" },
  );
}

/* ===== Admin : utilisateurs ===== */

export async function fetchUsers(): Promise<AdminUser[]> {
  return (await apiJson<AdminUser[]>("/api/admin/users")) ?? [];
}

export async function setUserRoles(
  userId: string,
  roleIds: string[],
): Promise<void> {
  await apiJson<{ ok: boolean }>(
    `/api/admin/users/${encodeURIComponent(userId)}/roles`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roles: roleIds }),
    },
  );
}

export async function deleteUser(userId: string): Promise<void> {
  await apiJson<{ ok: boolean }>(
    `/api/admin/users/${encodeURIComponent(userId)}`,
    { method: "DELETE" },
  );
}
