/**
 * Helpers de permissions partagés entre les Pages Functions.
 */

import { getSessionUser } from "./auth/me";

export interface PermsEnv {
  DB: D1Database;
}

export const PERMISSIONS = [
  "manage_users",
  "citizens.view",
  "citizens.edit",
  "donations.view",
  "donations.edit",
  "gains.view",
  "gains.edit",
  "expenses.view",
  "expenses.edit",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

/** Récupère toutes les permissions effectives d'un user (via ses rôles). */
export async function getUserPermissions(
  env: PermsEnv,
  userId: string,
): Promise<{ permissions: Set<string>; isSuper: boolean }> {
  const roles = await env.DB.prepare(
    `SELECT r.id, r.is_super
       FROM user_roles ur
       JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = ?`,
  )
    .bind(userId)
    .all<{ id: string; is_super: number }>();

  const roleIds = (roles.results ?? []).map((r) => r.id);
  const isSuper = (roles.results ?? []).some((r) => r.is_super === 1);

  if (roleIds.length === 0) return { permissions: new Set(), isSuper: false };

  const perms = await env.DB.prepare(
    `SELECT permission FROM role_permissions
      WHERE role_id IN (${roleIds.map(() => "?").join(",")})`,
  )
    .bind(...roleIds)
    .all<{ permission: string }>();

  const set = new Set((perms.results ?? []).map((p) => p.permission));
  return { permissions: set, isSuper };
}

/** Promeut le premier utilisateur connecté en Super Admin si aucun n'existe. */
export async function ensureBootstrapSuperAdmin(
  env: PermsEnv,
  userId: string,
): Promise<void> {
  const existing = await env.DB.prepare(
    `SELECT 1 FROM user_roles ur
       JOIN roles r ON r.id = ur.role_id
      WHERE r.is_super = 1 LIMIT 1`,
  ).first();
  if (existing) return;

  let superRole = await env.DB.prepare(
    "SELECT id FROM roles WHERE is_super = 1 LIMIT 1",
  ).first<{ id: string }>();

  if (!superRole) {
    const id = crypto.randomUUID();
    await env.DB.prepare(
      "INSERT INTO roles (id, name, is_super, created_at) VALUES (?, 'Super Admin', 1, ?)",
    )
      .bind(id, Date.now())
      .run();
    superRole = { id };
  }

  await env.DB.prepare(
    "INSERT OR IGNORE INTO user_roles (user_id, role_id, granted_at) VALUES (?, ?, ?)",
  )
    .bind(userId, superRole.id, Date.now())
    .run();
}

/** Garde : résout en { user, isSuper, permissions } ou renvoie Response 401/403. */
export async function requirePermission(
  env: PermsEnv,
  request: Request,
  permission: Permission,
): Promise<
  | Response
  | {
      user: { discord_id: string; username: string; avatar: string | null };
      isSuper: boolean;
      permissions: Set<string>;
    }
> {
  const user = await getSessionUser(env, request);
  if (!user) {
    return new Response(JSON.stringify({ error: "Non connecté" }), {
      status: 401,
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
  }
  const { permissions, isSuper } = await getUserPermissions(env, user.discord_id);
  if (!isSuper && !permissions.has(permission)) {
    return new Response(JSON.stringify({ error: "Permission insuffisante" }), {
      status: 403,
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
  }
  return { user, isSuper, permissions };
}
