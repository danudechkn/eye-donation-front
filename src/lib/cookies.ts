// ============================================================
// Cookie Utilities
// ============================================================

import { warnIfJwtMissingUserName } from "@/lib/jwt";

/**
 * เก็บ token ไว้เฉพาะในหน่วยความจำชั่วคราว (In-Memory) ระหว่างหน้าเว็บเปิดอยู่
 * เพื่อไม่ให้เก็บลง client cookie / storage ซ้ำกับ HttpOnly Cookie ของ Backend
 */
let inMemoryToken: string | null = null;

export function setInMemoryToken(token: string | null): void {
  inMemoryToken = token;
}

export function getInMemoryToken(): string | null {
  return inMemoryToken;
}

export function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(?:^|;\\s*)" + name + "=([^;]*)"));
  return match ? decodeURIComponent(match[1]) : null;
}

export function setCookie(name: string, value: string, days?: number): void {
  if (typeof document === "undefined") return;
  let expires = "";
  if (days) {
    const d = new Date();
    d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
    expires = `; expires=${d.toUTCString()}`;
  }
  document.cookie = `${name}=${encodeURIComponent(value)}${expires}; path=/; SameSite=Lax`;
}

export function deleteCookie(name: string): void {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
}

// ============================================================
// Session Expiry Helpers
// ============================================================

/** Session duration in milliseconds (default 12 hours to match Backend HttpOnly Cookie) */
export const SESSION_DURATION_MS =
  Number(process.env.NEXT_PUBLIC_SESSION_DURATION_MS) || 12 * 60 * 60 * 1000;

/** Stamp an expiry timestamp (epoch ms) into a Session Cookie right after login (หายเมื่อปิด Browser). */
export function setSessionExpiry(): void {
  const expiresAt = Date.now() + SESSION_DURATION_MS;
  setCookie("eye_session_expires", String(expiresAt));
}

/** Return the expiry timestamp (epoch ms), or null if not set. */
export function getSessionExpiry(): number | null {
  const raw = getCookie("eye_session_expires");
  if (!raw) return null;
  const parsed = Number(raw);
  return isNaN(parsed) ? null : parsed;
}

/** True if the session expiry exists AND has already passed. */
export function isSessionExpired(): boolean {
  const expiry = getSessionExpiry();
  if (expiry === null) return false;
  return Date.now() >= expiry;
}

const LEGACY_KEYS = [
  "moph_token",
  "token",
  "eye_donation_user",
  "provider_profile",
  "eye_session_expires",
  "code",
  "moph_code",
  "client_id",
  "moph_client_id",
  "client_secret",
  "moph_client_secret",
  "redirect_uri",
  "moph_redirect_uri",
  "eye_last_activity",
] as const;

/** ล้าง Cookie ฝั่ง Frontend และล้างค่าเก่าที่อาจค้างอยู่ใน storage ทั้งหมด */
export function clearSession(): void {
  inMemoryToken = null;

  for (const key of LEGACY_KEYS) {
    deleteCookie(key);
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.removeItem(key);
    }
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem(key);
    }
  }
}

/** Build auth headers (ใช้ควบคู่กับ HttpOnly Cookie ผ่าน credentials: "include") */
export function getAuthHeaders(
  extraHeaders: Record<string, string> = {},
): Record<string, string> {
  const headers: Record<string, string> = { ...extraHeaders };
  if (typeof window !== "undefined" && inMemoryToken) {
    warnIfJwtMissingUserName(inMemoryToken, "API Request");
    headers["Authorization"] = `Bearer ${inMemoryToken}`;
  }
  return headers;
}
