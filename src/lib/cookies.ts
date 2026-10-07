// ============================================================
// Cookie Utilities
// ============================================================

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

/** Session duration in milliseconds (configurable via env, default 60 min) */
export const SESSION_DURATION_MS =
  Number(process.env.NEXT_PUBLIC_SESSION_DURATION_MS) || 30 * 60 * 1000;

/** Stamp an expiry timestamp (epoch ms) into a cookie right after login. */
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

/** Wipe every auth-related cookie and storage entry. */
export function clearSession(): void {
  deleteCookie("moph_token");
  deleteCookie("token");
  deleteCookie("eye_donation_user");
  deleteCookie("provider_profile");
  deleteCookie("eye_session_expires");
  if (typeof sessionStorage !== "undefined") sessionStorage.clear();
  if (typeof localStorage !== "undefined") localStorage.clear();
}

/** Build auth headers from cookie/URL token. */
export function getAuthHeaders(extraHeaders: Record<string, string> = {}): Record<string, string> {
  const headers: Record<string, string> = { ...extraHeaders };
  if (typeof window !== "undefined") {
    let token = getCookie("moph_token") || getCookie("token") || null;

    if (!token && window.location.hash) {
      const hashStr = window.location.hash.startsWith("#")
        ? window.location.hash.substring(1)
        : window.location.hash;
      const p = new URLSearchParams(hashStr);
      token = p.get("token") || p.get("moph_token") || p.get("access_token");
    }
    if (!token && window.location.search) {
      const p = new URLSearchParams(window.location.search);
      token =
        p.get("token") || p.get("moph_token") || p.get("access_token") || p.get("id_token");
    }

    if (token) headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}
