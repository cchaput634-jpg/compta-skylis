/**
 * GET /api/auth/callback
 * Reçoit le code OAuth de Discord, l'échange contre un access token,
 * récupère le profil, crée/MAJ l'utilisateur et la session en D1,
 * puis pose un cookie de session et redirige vers l'app.
 */

interface Env {
  DB: D1Database;
  DISCORD_CLIENT_ID: string;
  DISCORD_CLIENT_SECRET: string;
  APP_URL: string;
}

const SESSION_DURATION_SEC = 60 * 60 * 24 * 30; // 30 jours

export const onRequestGet: PagesFunction<Env> = async ({ env, request }) => {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const stateParam = url.searchParams.get("state");

  const cookieHeader = request.headers.get("Cookie") ?? "";
  const stateCookie = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith("oauth_state="));

  let returnTo = "/";
  if (stateCookie) {
    try {
      const decoded = JSON.parse(
        decodeURIComponent(stateCookie.replace(/^oauth_state=/, "")),
      );
      if (decoded.state !== stateParam) {
        return errorRedirect(env.APP_URL, "state_mismatch");
      }
      if (typeof decoded.returnTo === "string") returnTo = decoded.returnTo;
    } catch {
      return errorRedirect(env.APP_URL, "state_invalid");
    }
  }

  if (!code) return errorRedirect(env.APP_URL, "no_code");

  const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: env.DISCORD_CLIENT_ID,
      client_secret: env.DISCORD_CLIENT_SECRET,
      grant_type: "authorization_code",
      code,
      redirect_uri: `${env.APP_URL}/api/auth/callback`,
    }),
  });
  if (!tokenRes.ok) return errorRedirect(env.APP_URL, "token_exchange_failed");
  const tokenData = (await tokenRes.json()) as { access_token?: string };
  if (!tokenData.access_token) return errorRedirect(env.APP_URL, "no_access_token");

  const userRes = await fetch("https://discord.com/api/users/@me", {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });
  if (!userRes.ok) return errorRedirect(env.APP_URL, "user_fetch_failed");
  const u = (await userRes.json()) as {
    id: string;
    username: string;
    avatar: string | null;
    global_name?: string | null;
  };

  const now = Date.now();
  const displayName = u.global_name || u.username;

  await env.DB.prepare(
    `INSERT INTO users (discord_id, username, avatar, created_at, last_seen)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(discord_id) DO UPDATE SET
       username  = excluded.username,
       avatar    = excluded.avatar,
       last_seen = excluded.last_seen`,
  )
    .bind(u.id, displayName, u.avatar, now, now)
    .run();

  const sessionId = crypto.randomUUID();
  const expiresAt = now + SESSION_DURATION_SEC * 1000;
  await env.DB.prepare(
    "INSERT INTO sessions (session_id, user_id, expires_at) VALUES (?, ?, ?)",
  )
    .bind(sessionId, u.id, expiresAt)
    .run();

  await env.DB.prepare("DELETE FROM sessions WHERE expires_at < ?")
    .bind(now)
    .run();

  const headers = new Headers({ Location: returnTo });
  headers.append(
    "Set-Cookie",
    `session=${sessionId}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_DURATION_SEC}`,
  );
  headers.append(
    "Set-Cookie",
    `oauth_state=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`,
  );
  return new Response(null, { status: 302, headers });
};

function errorRedirect(appUrl: string, reason: string): Response {
  return new Response(null, {
    status: 302,
    headers: { Location: `${appUrl}/?auth_error=${reason}` },
  });
}
