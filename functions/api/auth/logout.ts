/**
 * POST /api/auth/logout — supprime la session courante.
 */

interface Env {
  DB: D1Database;
}

export const onRequestPost: PagesFunction<Env> = async ({ env, request }) => {
  const cookieHeader = request.headers.get("Cookie") ?? "";
  const sessionCookie = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith("session="));

  if (sessionCookie) {
    const sessionId = sessionCookie.replace(/^session=/, "");
    await env.DB.prepare("DELETE FROM sessions WHERE session_id = ?")
      .bind(sessionId)
      .run();
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Set-Cookie": `session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`,
    },
  });
};
