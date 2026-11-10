/**
 * Catch-all Pages Function pour /api/* (hors /api/auth/*).
 *
 * Gère :
 *   - citoyens (GET/POST/PATCH/DELETE)
 *   - dons (GET/POST/PATCH/DELETE)
 *   - dépenses (GET/POST/PATCH/DELETE)
 *   - résumé (GET /api/summary)
 *   - admin : rôles + utilisateurs
 *
 * Permissions :
 *   manage_users, citizens.view, citizens.edit,
 *   donations.view, donations.edit, expenses.view, expenses.edit
 * Super Admin a tous les droits implicitement.
 */

import { getSessionUser } from "./auth/me";
import { getUserPermissions, PERMISSIONS, requirePermission } from "./_perms";

interface Env {
  DB: D1Database;
}

const JSON_HEADERS = { "Content-Type": "application/json; charset=utf-8" };
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }
  try {
    return await route(request, env, new URL(request.url));
  } catch (err) {
    return json({ error: String(err) }, 500);
  }
};

async function route(request: Request, env: Env, url: URL): Promise<Response> {
  if (!env.DB) return json({ error: "Base D1 non liée." }, 503);
  await ensureSchema(env);

  const parts = url.pathname.split("/").filter(Boolean); // ["api", ...]
  const section = parts[1];

  // GET /api/permissions — liste des permissions disponibles (pour l'admin)
  if (section === "permissions" && !parts[2] && request.method === "GET") {
    return json({ permissions: PERMISSIONS });
  }

  if (section === "citizens") return handleCitizens(request, env, parts);
  if (section === "donations") return handleDonations(request, env, parts);
  if (section === "expenses") return handleExpenses(request, env, parts);
  if (section === "summary") return handleSummary(request, env, parts);
  if (section === "admin") return handleAdmin(request, env, parts);

  return json({ error: "Route inconnue" }, 404);
}

/* =========================================================
   CITOYENS
   ========================================================= */

async function handleCitizens(
  request: Request,
  env: Env,
  parts: string[],
): Promise<Response> {
  // GET /api/citizens — liste
  if (!parts[2] && request.method === "GET") {
    const guard = await requirePermissionAny(env, request, [
      "citizens.view",
      "citizens.edit",
    ]);
    if (guard instanceof Response) return guard;
    const rows = await env.DB.prepare(
      "SELECT id, name, title, discord_id, notes, created_at, updated_at FROM citizens ORDER BY name COLLATE NOCASE",
    ).all();
    return json(rows.results ?? []);
  }

  // POST /api/citizens — crée
  if (!parts[2] && request.method === "POST") {
    const guard = await requirePermission(env, request, "citizens.edit");
    if (guard instanceof Response) return guard;
    const body = await readJsonBody(request);
    const name = str(body.name);
    if (!name) return json({ error: "Nom manquant" }, 400);
    const id = crypto.randomUUID();
    const now = Date.now();
    await env.DB.prepare(
      `INSERT INTO citizens (id, name, title, discord_id, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(id, name, str(body.title), str(body.discord_id), str(body.notes), now, now)
      .run();
    return json({ id });
  }

  // PATCH /api/citizens/:id — édite
  if (parts[2] && request.method === "PATCH") {
    const guard = await requirePermission(env, request, "citizens.edit");
    if (guard instanceof Response) return guard;
    const id = decodeURIComponent(parts[2]);
    const body = await readJsonBody(request);
    const existing = await env.DB.prepare(
      "SELECT id FROM citizens WHERE id = ?",
    )
      .bind(id)
      .first();
    if (!existing) return json({ error: "Citoyen inconnu" }, 404);
    const now = Date.now();
    await env.DB.prepare(
      `UPDATE citizens
          SET name       = COALESCE(?, name),
              title      = ?,
              discord_id = ?,
              notes      = ?,
              updated_at = ?
        WHERE id = ?`,
    )
      .bind(
        str(body.name) || null,
        str(body.title),
        str(body.discord_id),
        str(body.notes),
        now,
        id,
      )
      .run();
    return json({ ok: true });
  }

  // DELETE /api/citizens/:id
  if (parts[2] && request.method === "DELETE") {
    const guard = await requirePermission(env, request, "citizens.edit");
    if (guard instanceof Response) return guard;
    const id = decodeURIComponent(parts[2]);
    await env.DB.prepare("DELETE FROM citizens WHERE id = ?").bind(id).run();
    return json({ ok: true });
  }

  return json({ error: "Route inconnue" }, 404);
}

/* =========================================================
   DONS
   ========================================================= */

async function handleDonations(
  request: Request,
  env: Env,
  parts: string[],
): Promise<Response> {
  // GET /api/donations
  if (!parts[2] && request.method === "GET") {
    const guard = await requirePermissionAny(env, request, [
      "donations.view",
      "donations.edit",
    ]);
    if (guard instanceof Response) return guard;
    const rows = await env.DB.prepare(
      `SELECT d.id, d.citizen_id, d.citizen_label, d.amount, d.occurred_at,
              d.description, d.created_by, d.created_at,
              c.name AS citizen_name, c.title AS citizen_title
         FROM donations d
         LEFT JOIN citizens c ON c.id = d.citizen_id
        ORDER BY d.occurred_at DESC, d.created_at DESC`,
    ).all();
    return json(rows.results ?? []);
  }

  // POST /api/donations
  if (!parts[2] && request.method === "POST") {
    const guard = await requirePermission(env, request, "donations.edit");
    if (guard instanceof Response) return guard;
    const body = await readJsonBody(request);
    const amount = num(body.amount);
    if (amount === null || amount <= 0) {
      return json({ error: "Montant invalide" }, 400);
    }
    const citizenId = str(body.citizen_id);
    const citizenLabel = str(body.citizen_label);
    if (!citizenId && !citizenLabel) {
      return json({ error: "Donateur manquant" }, 400);
    }
    const occurred = num(body.occurred_at) ?? Date.now();
    const id = crypto.randomUUID();
    const now = Date.now();
    await env.DB.prepare(
      `INSERT INTO donations
         (id, citizen_id, citizen_label, amount, occurred_at, description, created_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        id,
        citizenId || null,
        citizenId ? null : citizenLabel,
        amount,
        occurred,
        str(body.description),
        guard.user.discord_id,
        now,
      )
      .run();
    return json({ id });
  }

  // PATCH /api/donations/:id
  if (parts[2] && request.method === "PATCH") {
    const guard = await requirePermission(env, request, "donations.edit");
    if (guard instanceof Response) return guard;
    const id = decodeURIComponent(parts[2]);
    const existing = await env.DB.prepare(
      "SELECT id FROM donations WHERE id = ?",
    )
      .bind(id)
      .first();
    if (!existing) return json({ error: "Don inconnu" }, 404);
    const body = await readJsonBody(request);
    const amount = num(body.amount);
    const occurred = num(body.occurred_at);
    const citizenId = str(body.citizen_id);
    const citizenLabel = str(body.citizen_label);
    await env.DB.prepare(
      `UPDATE donations
          SET citizen_id    = ?,
              citizen_label = ?,
              amount        = COALESCE(?, amount),
              occurred_at   = COALESCE(?, occurred_at),
              description   = ?
        WHERE id = ?`,
    )
      .bind(
        citizenId || null,
        citizenId ? null : citizenLabel,
        amount !== null && amount > 0 ? amount : null,
        occurred,
        str(body.description),
        id,
      )
      .run();
    return json({ ok: true });
  }

  // DELETE /api/donations/:id
  if (parts[2] && request.method === "DELETE") {
    const guard = await requirePermission(env, request, "donations.edit");
    if (guard instanceof Response) return guard;
    const id = decodeURIComponent(parts[2]);
    await env.DB.prepare("DELETE FROM donations WHERE id = ?").bind(id).run();
    return json({ ok: true });
  }

  return json({ error: "Route inconnue" }, 404);
}

/* =========================================================
   DÉPENSES
   ========================================================= */

async function handleExpenses(
  request: Request,
  env: Env,
  parts: string[],
): Promise<Response> {
  // GET /api/expenses
  if (!parts[2] && request.method === "GET") {
    const guard = await requirePermissionAny(env, request, [
      "expenses.view",
      "expenses.edit",
    ]);
    if (guard instanceof Response) return guard;
    const rows = await env.DB.prepare(
      `SELECT id, label, category, amount, occurred_at, description, created_by, created_at
         FROM expenses
        ORDER BY occurred_at DESC, created_at DESC`,
    ).all();
    return json(rows.results ?? []);
  }

  // POST /api/expenses
  if (!parts[2] && request.method === "POST") {
    const guard = await requirePermission(env, request, "expenses.edit");
    if (guard instanceof Response) return guard;
    const body = await readJsonBody(request);
    const label = str(body.label);
    if (!label) return json({ error: "Intitulé manquant" }, 400);
    const amount = num(body.amount);
    if (amount === null || amount <= 0) {
      return json({ error: "Montant invalide" }, 400);
    }
    const occurred = num(body.occurred_at) ?? Date.now();
    const id = crypto.randomUUID();
    const now = Date.now();
    await env.DB.prepare(
      `INSERT INTO expenses
         (id, label, category, amount, occurred_at, description, created_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        id,
        label,
        str(body.category),
        amount,
        occurred,
        str(body.description),
        guard.user.discord_id,
        now,
      )
      .run();
    return json({ id });
  }

  // PATCH /api/expenses/:id
  if (parts[2] && request.method === "PATCH") {
    const guard = await requirePermission(env, request, "expenses.edit");
    if (guard instanceof Response) return guard;
    const id = decodeURIComponent(parts[2]);
    const existing = await env.DB.prepare(
      "SELECT id FROM expenses WHERE id = ?",
    )
      .bind(id)
      .first();
    if (!existing) return json({ error: "Dépense inconnue" }, 404);
    const body = await readJsonBody(request);
    const amount = num(body.amount);
    const occurred = num(body.occurred_at);
    await env.DB.prepare(
      `UPDATE expenses
          SET label       = COALESCE(?, label),
              category    = ?,
              amount      = COALESCE(?, amount),
              occurred_at = COALESCE(?, occurred_at),
              description = ?
        WHERE id = ?`,
    )
      .bind(
        str(body.label) || null,
        str(body.category),
        amount !== null && amount > 0 ? amount : null,
        occurred,
        str(body.description),
        id,
      )
      .run();
    return json({ ok: true });
  }

  // DELETE /api/expenses/:id
  if (parts[2] && request.method === "DELETE") {
    const guard = await requirePermission(env, request, "expenses.edit");
    if (guard instanceof Response) return guard;
    const id = decodeURIComponent(parts[2]);
    await env.DB.prepare("DELETE FROM expenses WHERE id = ?").bind(id).run();
    return json({ ok: true });
  }

  return json({ error: "Route inconnue" }, 404);
}

/* =========================================================
   RÉSUMÉ (dashboard)
   ========================================================= */

async function handleSummary(
  request: Request,
  env: Env,
  _parts: string[],
): Promise<Response> {
  if (request.method !== "GET") return json({ error: "Route inconnue" }, 404);
  const user = await getSessionUser(env, request);
  if (!user) return json({ error: "Non connecté" }, 401);
  const { permissions, isSuper } = await getUserPermissions(env, user.discord_id);

  const canViewDon = isSuper || permissions.has("donations.view") || permissions.has("donations.edit");
  const canViewExp = isSuper || permissions.has("expenses.view") || permissions.has("expenses.edit");
  const canViewCit = isSuper || permissions.has("citizens.view") || permissions.has("citizens.edit");

  const [donRow, expRow, citRow] = await Promise.all([
    canViewDon
      ? env.DB.prepare(
          "SELECT COUNT(*) AS n, COALESCE(SUM(amount), 0) AS total FROM donations",
        ).first<{ n: number; total: number }>()
      : Promise.resolve({ n: 0, total: 0 }),
    canViewExp
      ? env.DB.prepare(
          "SELECT COUNT(*) AS n, COALESCE(SUM(amount), 0) AS total FROM expenses",
        ).first<{ n: number; total: number }>()
      : Promise.resolve({ n: 0, total: 0 }),
    canViewCit
      ? env.DB.prepare("SELECT COUNT(*) AS n FROM citizens").first<{ n: number }>()
      : Promise.resolve({ n: 0 }),
  ]);

  return json({
    donations: canViewDon ? donRow : null,
    expenses: canViewExp ? expRow : null,
    citizens: canViewCit ? citRow : null,
    balance:
      canViewDon && canViewExp
        ? (donRow?.total ?? 0) - (expRow?.total ?? 0)
        : null,
  });
}

/* =========================================================
   ADMIN (rôles & utilisateurs)
   ========================================================= */

async function handleAdmin(
  request: Request,
  env: Env,
  parts: string[],
): Promise<Response> {
  const guard = await requirePermission(env, request, "manage_users");
  if (guard instanceof Response) return guard;
  const { user, isSuper } = guard;

  // --- Rôles ---
  if (parts[2] === "roles") {
    if (!parts[3] && request.method === "GET") {
      const roles = await env.DB.prepare(
        "SELECT id, name, is_super FROM roles ORDER BY is_super DESC, name",
      ).all<{ id: string; name: string; is_super: number }>();
      const perms = await env.DB.prepare(
        "SELECT role_id, permission FROM role_permissions",
      ).all<{ role_id: string; permission: string }>();
      const permsByRole: Record<string, string[]> = {};
      for (const p of perms.results ?? []) {
        (permsByRole[p.role_id] ??= []).push(p.permission);
      }
      return json(
        (roles.results ?? []).map((r) => ({
          id: r.id,
          name: r.name,
          isSuper: r.is_super === 1,
          permissions: permsByRole[r.id] ?? [],
        })),
      );
    }

    if (!parts[3] && request.method === "POST") {
      const body = await readJsonBody(request);
      const name = str(body.name);
      if (!name) return json({ error: "Nom manquant" }, 400);
      const id = crypto.randomUUID();
      try {
        await env.DB.prepare(
          "INSERT INTO roles (id, name, is_super, created_at) VALUES (?, ?, 0, ?)",
        )
          .bind(id, name, Date.now())
          .run();
      } catch {
        return json({ error: "Nom déjà pris" }, 409);
      }
      const perms = Array.isArray(body.permissions)
        ? (body.permissions as unknown[]).filter(
            (p): p is string => typeof p === "string",
          )
        : [];
      for (const p of perms) {
        await env.DB.prepare(
          "INSERT OR IGNORE INTO role_permissions (role_id, permission) VALUES (?, ?)",
        )
          .bind(id, p)
          .run();
      }
      return json({ id });
    }

    if (parts[3] && request.method === "PATCH") {
      const roleId = decodeURIComponent(parts[3]);
      const role = await env.DB.prepare(
        "SELECT is_super FROM roles WHERE id = ?",
      )
        .bind(roleId)
        .first<{ is_super: number }>();
      if (!role) return json({ error: "Rôle inconnu" }, 404);
      if (role.is_super === 1) {
        return json({ error: "Le rôle Super Admin est verrouillé" }, 403);
      }
      const body = await readJsonBody(request);
      if (typeof body.name === "string" && body.name.trim()) {
        try {
          await env.DB.prepare("UPDATE roles SET name = ? WHERE id = ?")
            .bind(body.name.trim(), roleId)
            .run();
        } catch {
          return json({ error: "Nom déjà pris" }, 409);
        }
      }
      if (Array.isArray(body.permissions)) {
        await env.DB.prepare("DELETE FROM role_permissions WHERE role_id = ?")
          .bind(roleId)
          .run();
        for (const p of body.permissions) {
          if (typeof p !== "string") continue;
          await env.DB.prepare(
            "INSERT OR IGNORE INTO role_permissions (role_id, permission) VALUES (?, ?)",
          )
            .bind(roleId, p)
            .run();
        }
      }
      return json({ ok: true });
    }

    if (parts[3] && request.method === "DELETE") {
      const roleId = decodeURIComponent(parts[3]);
      const role = await env.DB.prepare(
        "SELECT is_super FROM roles WHERE id = ?",
      )
        .bind(roleId)
        .first<{ is_super: number }>();
      if (!role) return json({ error: "Rôle inconnu" }, 404);
      if (role.is_super === 1) {
        return json(
          { error: "Le rôle Super Admin ne peut pas être supprimé" },
          403,
        );
      }
      await env.DB.prepare("DELETE FROM role_permissions WHERE role_id = ?")
        .bind(roleId)
        .run();
      await env.DB.prepare("DELETE FROM user_roles WHERE role_id = ?")
        .bind(roleId)
        .run();
      await env.DB.prepare("DELETE FROM roles WHERE id = ?")
        .bind(roleId)
        .run();
      return json({ ok: true });
    }
  }

  // --- Utilisateurs ---
  if (parts[2] === "users") {
    if (!parts[3] && request.method === "GET") {
      const users = await env.DB.prepare(
        "SELECT discord_id, username, avatar, last_seen FROM users ORDER BY username COLLATE NOCASE",
      ).all<{
        discord_id: string;
        username: string;
        avatar: string | null;
        last_seen: number;
      }>();
      const roleAssign = await env.DB.prepare(
        "SELECT user_id, role_id FROM user_roles",
      ).all<{ user_id: string; role_id: string }>();
      const rolesByUser: Record<string, string[]> = {};
      for (const r of roleAssign.results ?? []) {
        (rolesByUser[r.user_id] ??= []).push(r.role_id);
      }
      return json(
        (users.results ?? []).map((u) => ({
          ...u,
          roles: rolesByUser[u.discord_id] ?? [],
        })),
      );
    }

    if (parts[3] && parts[4] === "roles" && request.method === "PUT") {
      const userId = decodeURIComponent(parts[3]);
      const body = await readJsonBody(request);
      if (!Array.isArray(body.roles)) {
        return json({ error: "body.roles manquant" }, 400);
      }
      // Empêche de retirer son propre rôle super admin
      if (userId === user.discord_id && isSuper) {
        const placeholders = (body.roles as string[]).map(() => "?").join(",") || "''";
        const stillSuper = await env.DB.prepare(
          `SELECT 1 FROM roles WHERE is_super = 1 AND id IN (${placeholders})`,
        )
          .bind(...(body.roles as string[]))
          .first();
        if (!stillSuper) {
          return json(
            { error: "Tu ne peux pas retirer ton propre rôle Super Admin." },
            403,
          );
        }
      }
      await env.DB.prepare("DELETE FROM user_roles WHERE user_id = ?")
        .bind(userId)
        .run();
      for (const rid of body.roles as string[]) {
        if (typeof rid !== "string") continue;
        await env.DB.prepare(
          "INSERT OR IGNORE INTO user_roles (user_id, role_id, granted_at) VALUES (?, ?, ?)",
        )
          .bind(userId, rid, Date.now())
          .run();
      }
      return json({ ok: true });
    }

    if (parts[3] && !parts[4] && request.method === "DELETE") {
      const userId = decodeURIComponent(parts[3]);
      if (userId === user.discord_id) {
        return json({ error: "Tu ne peux pas te supprimer toi-même." }, 403);
      }
      await env.DB.prepare("DELETE FROM user_roles WHERE user_id = ?")
        .bind(userId)
        .run();
      await env.DB.prepare("DELETE FROM sessions WHERE user_id = ?")
        .bind(userId)
        .run();
      await env.DB.prepare("DELETE FROM users WHERE discord_id = ?")
        .bind(userId)
        .run();
      return json({ ok: true });
    }
  }

  return json({ error: "Route inconnue" }, 404);
}

/* =========================================================
   Helpers
   ========================================================= */

async function requirePermissionAny(
  env: Env,
  request: Request,
  perms: readonly string[],
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
      headers: JSON_HEADERS,
    });
  }
  const { permissions, isSuper } = await getUserPermissions(env, user.discord_id);
  if (!isSuper && !perms.some((p) => permissions.has(p))) {
    return new Response(JSON.stringify({ error: "Permission insuffisante" }), {
      status: 403,
      headers: JSON_HEADERS,
    });
  }
  return { user, isSuper, permissions };
}

async function ensureSchema(env: Env) {
  const stmts = [
    `CREATE TABLE IF NOT EXISTS users (
       discord_id TEXT PRIMARY KEY, username TEXT NOT NULL, avatar TEXT,
       created_at INTEGER NOT NULL, last_seen INTEGER NOT NULL
     )`,
    `CREATE TABLE IF NOT EXISTS sessions (
       session_id TEXT PRIMARY KEY, user_id TEXT NOT NULL, expires_at INTEGER NOT NULL
     )`,
    `CREATE TABLE IF NOT EXISTS roles (
       id TEXT PRIMARY KEY, name TEXT NOT NULL UNIQUE,
       is_super INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL
     )`,
    `CREATE TABLE IF NOT EXISTS role_permissions (
       role_id TEXT NOT NULL, permission TEXT NOT NULL,
       PRIMARY KEY (role_id, permission)
     )`,
    `CREATE TABLE IF NOT EXISTS user_roles (
       user_id TEXT NOT NULL, role_id TEXT NOT NULL, granted_at INTEGER NOT NULL,
       PRIMARY KEY (user_id, role_id)
     )`,
    `CREATE TABLE IF NOT EXISTS citizens (
       id TEXT PRIMARY KEY, name TEXT NOT NULL, title TEXT, discord_id TEXT,
       notes TEXT, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL
     )`,
    `CREATE TABLE IF NOT EXISTS donations (
       id TEXT PRIMARY KEY, citizen_id TEXT, citizen_label TEXT,
       amount INTEGER NOT NULL, occurred_at INTEGER NOT NULL,
       description TEXT, created_by TEXT NOT NULL, created_at INTEGER NOT NULL
     )`,
    `CREATE TABLE IF NOT EXISTS expenses (
       id TEXT PRIMARY KEY, label TEXT NOT NULL, category TEXT,
       amount INTEGER NOT NULL, occurred_at INTEGER NOT NULL,
       description TEXT, created_by TEXT NOT NULL, created_at INTEGER NOT NULL
     )`,
  ];
  for (const s of stmts) await env.DB.prepare(s).run();
}

async function readJsonBody(
  request: Request,
): Promise<Record<string, unknown>> {
  try {
    const text = await request.text();
    if (!text) return {};
    return JSON.parse(text);
  } catch {
    return {};
  }
}

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...JSON_HEADERS, ...CORS_HEADERS },
  });
}

function str(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t ? t : null;
}

function num(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return Math.round(v);
  if (typeof v === "string" && v.trim()) {
    const n = Number(v);
    if (Number.isFinite(n)) return Math.round(n);
  }
  return null;
}
