/**
 * GET /api/auth/login
 * Redirige vers Discord OAuth2.
 */

interface Env {
  DISCORD_CLIENT_ID: string;
  APP_URL: string;
}

export const onRequestGet: PagesFunction<Env> = async ({ env, request }) => {
  const redirectUri = `${env.APP_URL}/api/auth/callback`;
  const state = crypto.randomUUID();
  const url = new URL(request.url);
  const returnTo = url.searchParams.get("returnTo") ?? "/";

  const params = new URLSearchParams({
    client_id: env.DISCORD_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "identify",
    state,
  });

  const authUrl = `https://discord.com/oauth2/authorize?${params.toString()}`;
  const cookieValue = encodeURIComponent(JSON.stringify({ state, returnTo }));

  return new Response(null, {
    status: 302,
    headers: {
      Location: authUrl,
      "Set-Cookie": `oauth_state=${cookieValue}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=300`,
    },
  });
};
