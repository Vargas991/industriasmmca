import { createHmac, timingSafeEqual } from "node:crypto";
import type { AstroCookies } from "astro";

const SESSION_COOKIE = "imm_admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 10;

function getSessionSecret() {
  return import.meta.env.ADMIN_SESSION_SECRET ?? "industriasmm-dev-secret";
}

export function getAdminUsername() {
  return import.meta.env.ADMIN_USERNAME ?? "admin";
}

function getAdminPassword() {
  return import.meta.env.ADMIN_PASSWORD ?? "cambiar-esto";
}

function sign(value: string) {
  return createHmac("sha256", getSessionSecret()).update(value).digest("hex");
}

export function validateAdminCredentials(username: string, password: string) {
  return username === getAdminUsername() && password === getAdminPassword();
}

export function createAdminSessionToken(username: string) {
  const expiresAt = Date.now() + SESSION_TTL_SECONDS * 1000;
  const payload = `${username}.${expiresAt}`;
  const signature = sign(payload);
  return `${payload}.${signature}`;
}

export function verifyAdminSessionToken(token?: string | null) {
  if (!token) return false;

  const parts = token.split(".");
  if (parts.length < 3) return false;

  const signature = parts.pop() as string;
  const expiresAt = Number(parts.pop());
  const username = parts.join(".");

  if (!username || Number.isNaN(expiresAt) || expiresAt < Date.now()) {
    return false;
  }

  const expected = sign(`${username}.${expiresAt}`);
  try {
    return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

function parseCookieHeader(cookieHeader: string | null, name: string) {
  if (!cookieHeader) return undefined;
  return cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.split("=")
    .slice(1)
    .join("=");
}

export function isAdminAuthenticated(cookiesOrRequest: AstroCookies | Request) {
  const token =
    typeof (cookiesOrRequest as AstroCookies).get === "function"
      ? (cookiesOrRequest as AstroCookies).get(SESSION_COOKIE)?.value
      : parseCookieHeader((cookiesOrRequest as Request).headers.get("cookie"), SESSION_COOKIE);
  return verifyAdminSessionToken(token);
}

export function setAdminSession(cookies: AstroCookies, username: string) {
  cookies.set(SESSION_COOKIE, createAdminSessionToken(username), {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: import.meta.env.PROD,
    maxAge: SESSION_TTL_SECONDS,
  });
}

export function clearAdminSession(cookies: AstroCookies) {
  cookies.set(SESSION_COOKIE, "", {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: import.meta.env.PROD,
    maxAge: 0,
  });
}
