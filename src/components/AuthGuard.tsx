"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  getCookie,
  setCookie,
  setSessionExpiry,
  getSessionExpiry,
  isSessionExpired,
  clearSession,
} from "@/lib/cookies";
import { useAuth } from "@/context/AuthContext";
import type { AuthUser } from "@/types";

// ============================================================
// Session Toast — แสดงแถบเตือนที่ด้านบนเมื่อ session ใกล้หมด
// ============================================================

const WARNING_MS = 5 * 60 * 1000; // เตือนก่อน 5 นาที

function SessionWarningToast({
  expiresAt,
  onExpired,
}: {
  expiresAt: number;
  onExpired: () => void;
}) {
  const [remaining, setRemaining] = useState<number>(expiresAt - Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      const left = expiresAt - Date.now();
      if (left <= 0) {
        clearInterval(interval);
        onExpired();
      } else {
        setRemaining(left);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt, onExpired]);

  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  const timeStr =
    minutes > 0
      ? `${minutes} นาที ${seconds} วินาที`
      : `${seconds} วินาที`;

  return (
    <div
      role="alert"
      className="fixed top-0 left-0 right-0 z-[9999] flex items-center justify-between gap-3 bg-amber-500 text-white px-5 py-3 shadow-lg"
      style={{ fontFamily: "var(--font-prompt, sans-serif)", animation: "slideDown 0.3s ease" }}
    >
      <div className="flex items-center gap-2 text-sm font-medium">
        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
          />
        </svg>
        <span>
          Session ของคุณจะหมดอายุใน{" "}
          <strong>{timeStr}</strong>
          {" "}— กรุณาบันทึกงานและ login ใหม่
        </span>
      </div>
      <span className="text-xs text-amber-100 font-light shrink-0">ระบบจะ logout อัตโนมัติ</span>
    </div>
  );
}

// ============================================================
// Expired Modal — แสดงเมื่อ session หมดอายุแล้ว
// ============================================================

function SessionExpiredModal({ onRedirect }: { onRedirect: () => void }) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div
        className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 text-center"
        style={{ fontFamily: "var(--font-prompt, sans-serif)" }}
      >
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Session หมดอายุ</h2>
        <p className="text-slate-500 text-sm mb-6 leading-relaxed">
          Session ของคุณหมดอายุแล้ว กรุณา login ใหม่เพื่อใช้งานระบบต่อไป
        </p>
        <button
          onClick={onRedirect}
          className="w-full bg-gradient-to-r from-[#0284c7] to-[#10b981] text-white font-semibold py-3 rounded-xl hover:opacity-90 transition-opacity"
        >
          ไปหน้า Login
        </button>
      </div>
    </div>
  );
}

// ============================================================
// AuthGuard
// ============================================================

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { setUser } = useAuth();
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [showWarning, setShowWarning] = useState(false);
  const [showExpiredModal, setShowExpiredModal] = useState(false);
  const [expiresAt, setExpiresAt] = useState<number>(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ---- session expiry polling (ทุก 30 วินาที) ----
  useEffect(() => {
    if (!authorized) return;

    const checkSession = () => {
      const expiry = getSessionExpiry();
      if (expiry === null) return;

      if (Date.now() >= expiry) {
        setShowWarning(false);
        clearSession();
        setShowExpiredModal(true);
        if (intervalRef.current) clearInterval(intervalRef.current);
        return;
      }

      const left = expiry - Date.now();
      if (left <= WARNING_MS) {
        setExpiresAt(expiry);
        setShowWarning(true);
      } else {
        setShowWarning(false);
      }
    };

    checkSession();
    intervalRef.current = setInterval(checkSession, 30_000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [authorized]);

  // ---- initial auth check ----
  useEffect(() => {
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      const searchParams = url.searchParams;
      const hashString = window.location.hash.startsWith("#")
        ? window.location.hash.substring(1)
        : window.location.hash;
      const hashParams = new URLSearchParams(hashString);

      const checkParams = (params: URLSearchParams) => {
        return !!(
          params.get("token") ||
          params.get("moph_token") ||
          params.get("access_token") ||
          params.get("id_token") ||
          params.get("profile") ||
          params.get("provider_profile") ||
          params.get("data") ||
          params.get("user")
        );
      };

      const hasAuthParams = checkParams(hashParams) || checkParams(searchParams);

      if (hasAuthParams) {
        const getParam = (key: string) => searchParams.get(key) || hashParams.get(key);
        let token =
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

        let providerProfile: any = null;
        if (rawProfile) {
          try {
            const unescaped = decodeURIComponent(rawProfile);
            if (unescaped.startsWith("{") || unescaped.startsWith("[")) {
              providerProfile = JSON.parse(unescaped);
            } else if (rawProfile.startsWith("{") || rawProfile.startsWith("[")) {
              providerProfile = JSON.parse(rawProfile);
            } else {
              providerProfile = JSON.parse(atob(rawProfile));
            }
          } catch (e) {
            console.error("Error parsing provider profile in AuthGuard:", e);
          }
        }

        if (!token && providerProfile?.organization?.[0]?.moph_access_token_idp) {
          token = providerProfile.organization[0].moph_access_token_idp;
        }

        const firstName =
          providerProfile?.firstname_th ||
          providerProfile?.first_name_th ||
          providerProfile?.first_name ||
          "";
        const lastName =
          providerProfile?.lastname_th ||
          providerProfile?.last_name_th ||
          providerProfile?.last_name ||
          "";
        const title =
          providerProfile?.title_th ||
          providerProfile?.pre_name_th ||
          "";
        const providerFullName = [title, firstName, lastName].filter(Boolean).join(" ").trim();

        const name =
          providerFullName ||
          providerProfile?.name ||
          providerProfile?.fullname ||
          providerProfile?.display_name ||
          getParam("name") ||
          "";

        const cid =
          providerProfile?.cid ||
          providerProfile?.provider_id ||
          getParam("cid") ||
          "";

        const role =
          providerProfile?.organization?.[0]?.position_type ||
          providerProfile?.profession_name_th ||
          providerProfile?.profession_name ||
          getParam("role") ||
          "พยาบาลประสานงาน";

        const hospcode =
          providerProfile?.organization?.[0]?.hcode ||
          providerProfile?.organization?.[0]?.hospcode ||
          providerProfile?.hospcode ||
          getParam("hospcode") ||
          "10664";

        if (!token && (cid || name || providerProfile)) {
          const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }))
            .replace(/=/g, "")
            .replace(/\+/g, "-")
            .replace(/\//g, "_");
          const payload = btoa(
            unescape(
              encodeURIComponent(
                JSON.stringify({
                  cid: cid || "unknown",
                  name: name || "เจ้าหน้าที่",
                  role: role || "staff",
                  hospcode: hospcode || "10664",
                  exp: Math.floor(Date.now() / 1000) + 3600,
                })
              )
            )
          )
            .replace(/=/g, "")
            .replace(/\+/g, "-")
            .replace(/\//g, "_");
          token = `${header}.${payload}.moph_session_sig`;
        }

        if (token) {
          setCookie("moph_token", token);
          sessionStorage.removeItem("moph_token");
          localStorage.removeItem("moph_token");
        }

        if (providerProfile) {
          sessionStorage.setItem("provider_profile", JSON.stringify(providerProfile));
          localStorage.removeItem("provider_profile");
        }

        if (token || cid || name) {
          const userObj: AuthUser = {
            cid,
            name: name || "เจ้าหน้าที่",
            role,
            hospcode,
            providerId: providerProfile?.provider_id || "",
            loginAt: new Date().toISOString(),
          };
          setCookie("eye_donation_user", JSON.stringify(userObj));
          setSessionExpiry(); // ← รีเซ็ต session clock เมื่อ auth callback ใหม่
          setUser(userObj); // ← อัปเดต AuthContext
          sessionStorage.setItem("eye_donation_user", JSON.stringify(userObj));
          localStorage.removeItem("eye_donation_user");
          window.dispatchEvent(new Event("storage"));
        }

        window.history.replaceState({}, document.title, window.location.pathname);
        setAuthorized(true);
        return;
      }

      // ตรวจสอบ cookie
      const token =
        getCookie("moph_token") ||
        getCookie("token");

      if (token) {
        if (isSessionExpired()) {
          clearSession();
          setAuthorized(false);
          setShowExpiredModal(true);
        } else {
          setAuthorized(true);
        }
      } else {
        setAuthorized(false);
        router.replace("/login");
      }
    }
  }, [pathname, router]);

  const handleExpiredRedirect = useCallback(() => {
    setShowExpiredModal(false);
    router.replace("/login");
  }, [router]);

  if (showExpiredModal) {
    return <SessionExpiredModal onRedirect={handleExpiredRedirect} />;
  }

  if (authorized === false) return null;

  if (authorized === null) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-slate-50/50">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-3 text-sm text-slate-500 font-medium">กำลังตรวจสอบสิทธิ์การเข้าใช้งาน...</p>
      </div>
    );
  }

  return (
    <>
      {showWarning && expiresAt > 0 && (
        <SessionWarningToast
          expiresAt={expiresAt}
          onExpired={() => {
            clearSession();
            setShowWarning(false);
            setShowExpiredModal(true);
          }}
        />
      )}
      {children}
    </>
  );
}

