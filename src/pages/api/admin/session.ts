import type { APIRoute } from "astro";
import {
  clearAdminSession,
  getAdminUsername,
  isAdminAuthenticated,
  setAdminSession,
  validateAdminCredentials,
} from "@/lib/admin/auth";

export const prerender = false;

export const GET: APIRoute = async ({ cookies }) => {
  return new Response(
    JSON.stringify({
      ok: true,
      authenticated: isAdminAuthenticated(cookies),
      username: getAdminUsername(),
    }),
    {
      headers: { "Content-Type": "application/json" },
    },
  );
};

export const POST: APIRoute = async ({ request, cookies }) => {
  const payload = (await request.json().catch(() => null)) as { username?: string; password?: string } | null;
  const username = payload?.username?.trim() ?? "";
  const password = payload?.password ?? "";

  if (!validateAdminCredentials(username, password)) {
    return new Response(JSON.stringify({ ok: false, message: "Credenciales inválidas." }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  setAdminSession(cookies, username);

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
};

export const DELETE: APIRoute = async ({ cookies }) => {
  clearAdminSession(cookies);

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
};
