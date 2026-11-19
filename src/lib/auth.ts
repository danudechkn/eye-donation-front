// ============================================================
// Auth Callback, HttpOnly Cookie Sync, Session Store & Events
// ============================================================

import {
  clearSession,
  getCookie,
   getInMemoryToken,
  setCookie,
  setInMemoryToken,
  setSessionExpiry,
  SESSION_DURATION_MS,
} from "@/lib/cookies";
import {
  createSessionJwt,
  extractNameFromJwtPayload,
  inspectJwtUserName,
  resolveCallbackAuth,
  warnIfJwtMissingUserName,
} from "@/lib/jwt";
import type { AuthUser } from "@/types";

export const AUTH_CHANGE_EVENT = "eye-auth-change";
export const AUTH_UNAUTHORIZED_EVENT = "eye-auth-unauthorized";

export const MAIN_LOGIN_URL =
  process.env.NEXT_PUBLIC_LOGIN_URL || "http://10.10.200.103:3578";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";
/** Base origin ของ Backend (เช่น http://172.16.46.64:3002) สำหรับเรียก /api/auth/* */
export const API_BASE_URL = API_URL.replace(/\/api\/eye\/?$/, "");

const AUTH_CALLBACK_KEYS = [
  "code",
  "auth_code",
  "token",
  "moph_token",
  "access_token",
  "id_token",
  "profile",
  "provider_profile",
  "data",
  "user",
] as const;

// ============================================================
// Backend HttpOnly Cookie Sync (/api/auth/login & /api/auth/logout)
// ============================================================

/**
 * ส่ง JWT Token ไปให้ Backend เซ็ตเป็น HttpOnly Cookie (token และ moph_token)
 */
export async function syncBackendAuthCookie(token: string): Promise<void> {
  if (!token || !API_BASE_URL) return;
  try {
    await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ token }),
    });
  } catch (err) {
    console.warn("[Auth] ไม่สามารถซิงค์ HttpOnly Cookie กับ Backend ได้:", err);
  }
}

/**
 * เรียก POST /api/auth/logout เพื่อให้ Backend ล้าง HttpOnly Cookie (token และ moph_token)
 */
export async function logoutFromBackend(): Promise<void> {
  if (!API_BASE_URL) return;
  try {
    await fetch(`${API_BASE_URL}/api/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
  } catch (err) {
    console.warn("[Auth] ไม่สามารถเรียก /api/auth/logout ที่ Backend ได้:", err);
  }
}

// ============================================================
// Event Helpers
// ============================================================

/** แจ้งทุก component ที่ subscribe auth state ให้โหลดข้อมูลใหม่ */
export function notifyAuthChange(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
  window.dispatchEvent(new Event("storage"));
}

/** แจ้ง AuthProvider เมื่อ API ตอบกลับ 401/403 เพื่อนำทางไปหน้า /login */
export function notifyUnauthorized(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(AUTH_UNAUTHORIZED_EVENT));
}

// ============================================================
// External Store Snapshot (for useSyncExternalStore)
// ============================================================

export interface AuthSnapshot {
  user: AuthUser | null;
  isAuthenticated: boolean;
  sessionExpiresAt: number | null;
}

const SERVER_SNAPSHOT: AuthSnapshot = {
  user: null,
  isAuthenticated: false,
  sessionExpiresAt: null,
};

let cachedSnapshotKey = "";
let cachedSnapshot: AuthSnapshot = SERVER_SNAPSHOT;

export function getServerAuthSnapshot(): AuthSnapshot {
  return SERVER_SNAPSHOT;
}

export function getAuthSnapshot(): AuthSnapshot {
  if (typeof window === "undefined") return SERVER_SNAPSHOT;

  const rawUser = getCookie("eye_donation_user");
  const rawExpiry = getCookie("eye_session_expires") || "";
  const memoryToken = getInMemoryToken();

  const key = `${rawUser ?? ""}\0${rawExpiry}\0${memoryToken ?? ""}`;
  if (key === cachedSnapshotKey) {
    return cachedSnapshot;
  }

  let parsedUser: AuthUser | null = null;
  if (rawUser) {
    try {
      parsedUser = JSON.parse(rawUser) as AuthUser;
    } catch {
      parsedUser = null;
    }
  }

  if (memoryToken) {
    const jwtCheck = inspectJwtUserName(memoryToken);
    const jwtName =
      jwtCheck.userName || extractNameFromJwtPayload(jwtCheck.payload);

    if (
      parsedUser &&
      jwtName &&
      (!parsedUser.name ||
        parsedUser.name.trim() === "" ||
        parsedUser.name.trim() === "-" ||
        parsedUser.name.trim() === "เจ้าหน้าที่")
    ) {
      parsedUser = { ...parsedUser, name: jwtName };
    }
  }

  const parsedExpiry = rawExpiry ? Number(rawExpiry) : NaN;
  const sessionExpiresAt = Number.isNaN(parsedExpiry) ? null : parsedExpiry;
  const isAuthenticated = Boolean(parsedUser);

  cachedSnapshotKey = key;
  cachedSnapshot = {
    user: parsedUser,
    isAuthenticated,
    sessionExpiresAt,
  };
  return cachedSnapshot;
}

export function subscribeAuthStore(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(AUTH_CHANGE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(AUTH_CHANGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

// ============================================================
// OAuth / Provider ID Callback Processor
// ============================================================

function getUrlParams(): {
  searchParams: URLSearchParams;
  hashParams: URLSearchParams;
  getParam: (key: string) => string | null;
} {
  const url = new URL(window.location.href);
  const searchParams = url.searchParams;
  const hashString = window.location.hash.startsWith("#")
    ? window.location.hash.substring(1)
    : window.location.hash;
  const hashParams = new URLSearchParams(hashString);
  const getParam = (key: string) => searchParams.get(key) || hashParams.get(key);
  return { searchParams, hashParams, getParam };
}

/** ตรวจสอบว่า URL ปัจจุบันมี query/hash parameters จากการ Login callback หรือไม่ */
export function hasAuthCallbackParams(): boolean {
  if (typeof window === "undefined") return false;
  if (!window.location.search && !window.location.hash) return false;
  const { searchParams, hashParams } = getUrlParams();
  return AUTH_CALLBACK_KEYS.some(
    (key) => Boolean(searchParams.get(key)) || Boolean(hashParams.get(key)),
  );
}

export interface ProcessAuthCallbackOptions {
  /** อนุญาตสร้าง session จาก auth code อย่างเดียว (ใช้ใน AuthGuard) */
  allowCodeOnlySession?: boolean;
  /** ป้ายชื่อ context สำหรับแจ้งเตือนใน console */
  context?: string;
}

export interface ProcessAuthCallbackResult {
  handled: boolean;
  authenticated: boolean;
  token: string;
  user: AuthUser | null;
}

let activeCallbackPromise: Promise<ProcessAuthCallbackResult> | null = null;

/**
 * ประมวลผล URL query/hash หลังกลับมาจากระบบ Login (MOPH Provider ID / Main Login)
 * - ส่ง Token ไปให้ Backend เซ็ตเป็น HttpOnly Cookie (POST /api/auth/login)
 * - เก็บเฉพาะ eye_donation_user และ eye_session_expires ใน Cookie ฝั่ง Frontend
 */
export async function processAuthCallback(
  options: ProcessAuthCallbackOptions = {},
): Promise<ProcessAuthCallbackResult> {
  if (typeof window === "undefined") {
    return { handled: false, authenticated: false, token: "", user: null };
  }

  if (activeCallbackPromise) {
    return activeCallbackPromise;
  }

  if (!window.location.search && !window.location.hash) {
    return { handled: false, authenticated: false, token: "", user: null };
  }

  const run = async (): Promise<ProcessAuthCallbackResult> => {
    const { allowCodeOnlySession = false, context = "Auth" } = options;
    const { getParam } = getUrlParams();

    const authCode = getParam("code") || getParam("auth_code") || "";

    const initialToken =
      getParam("token") ||
      getParam("moph_token") ||
      getParam("access_token") ||
      getParam("id_token") ||
      "";

    const rawProfile =
      getParam("profile") ||
      getParam("provider_profile") ||
      getParam("data") ||
      getParam("user");

    const resolved = resolveCallbackAuth(initialToken, rawProfile, getParam);
    let token = resolved.token;
    const { providerProfile, name, username, cid, role, hospcode, providerId } =
      resolved;

    const hasIdentity = Boolean(
      token || cid || name || providerProfile || (allowCodeOnlySession && authCode),
    );

    if (!hasIdentity) {
      return { handled: false, authenticated: false, token: "", user: null };
    }

    // 1. หากไม่มี token จาก Provider แต่ยืนยันตัวตนสำเร็จ ให้สร้าง Session JWT พร้อมฟิลด์ชื่อครบ
    if (!token) {
      token = createSessionJwt({
        cid,
        name,
        username,
        role,
        hospcode,
        expSeconds: Math.max(Math.ceil(SESSION_DURATION_MS / 1000), 12 * 3600),
      });
    }

    // 2. ล้าง cookie/storage เก่าที่อาจค้างอยู่ แล้วเก็บ token ไว้ใน memory + สั่ง Backend เซ็ต HttpOnly Cookie
    clearSession();
    warnIfJwtMissingUserName(token, context);
    setInMemoryToken(token);

    // ล้าง query/hash ออกจากแถบ URL ทันทีเพื่อไม่ให้ข้อมูลค้างบน URL
    window.history.replaceState({}, document.title, window.location.pathname);

    // รอให้ Backend เซ็ต HttpOnly Cookie (token และ moph_token) ให้เสร็จก่อนเริ่มยิง API อื่น
    await syncBackendAuthCookie(token);

    // 3. เก็บเฉพาะ Cookie สำหรับ UI (eye_donation_user และ eye_session_expires)
    const userObj: AuthUser = {
      cid,
      name: name || "เจ้าหน้าที่",
      role,
      hospcode,
      providerId,
      loginAt: new Date().toISOString(),
    };

    setCookie("eye_donation_user", JSON.stringify(userObj), 1);
    setSessionExpiry();
    notifyAuthChange();

    return {
      handled: true,
      authenticated: true,
      token,
      user: userObj,
    };
  };

  activeCallbackPromise = run().finally(() => {
    activeCallbackPromise = null;
  });

  return activeCallbackPromise;
}
