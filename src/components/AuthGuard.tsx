"use client";

import { useEffect, useState, useCallback, useRef, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { clearSession } from "@/lib/cookies";
import {
  hasAuthCallbackParams,
  logoutFromBackend,
  notifyAuthChange,
  processAuthCallback,
} from "@/lib/auth";
import { useAuth } from "@/context/AuthContext";
import { useIsClient } from "@/hooks/useIsClient";

const WARNING_MS = 5 * 60 * 1000; // เตือนก่อน session หมดอายุ 5 นาที
const IDLE_TIMEOUT_MS =
  Number(process.env.NEXT_PUBLIC_IDLE_TIMEOUT_MS) || 15 * 60 * 1000; // ไม่ใช้งาน 15 นาที
const IDLE_COUNTDOWN_SEC = 60; // นับถอยหลัง 60 วินาทีก่อนออกจากระบบอัตโนมัติ
const LAST_ACTIVITY_KEY = "eye_last_activity";

// ============================================================
// Session Warning Toast
// ============================================================

function SessionWarningToast({ remainingMs }: { remainingMs: number }) {
  const minutes = Math.floor(remainingMs / 60000);
  const seconds = Math.floor((remainingMs % 60000) / 1000);
  const timeStr =
    minutes > 0 ? `${minutes} นาที ${seconds} วินาที` : `${seconds} วินาที`;

  return (
    <div
      role="alert"
      className="fixed top-0 left-0 right-0 z-[9999] flex items-center justify-between gap-3 bg-amber-500 text-white px-5 py-3 shadow-lg"
      style={{ fontFamily: "var(--font-prompt, sans-serif)" }}
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
          Session ของคุณจะหมดอายุใน <strong>{timeStr}</strong> — กรุณาบันทึกงานและ login ใหม่
        </span>
      </div>
      <span className="text-xs text-amber-100 font-light shrink-0">
        ระบบจะ logout อัตโนมัติ
      </span>
    </div>
  );
}

// ============================================================
// Session Expired Modal
// ============================================================

function SessionExpiredModal({
  reason,
  onRedirect,
}: {
  reason: "expired" | "idle";
  onRedirect: () => void;
}) {
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
        <h2 className="text-xl font-bold text-slate-800 mb-2">
          {reason === "idle" ? "ออกจากระบบอัตโนมัติ" : "Session หมดอายุ"}
        </h2>
        <p className="text-slate-500 text-sm mb-6 leading-relaxed">
          {reason === "idle"
            ? "ไม่มีการใช้งานระบบเกินเวลาที่กำหนด เพื่อความปลอดภัยของข้อมูลผู้ป่วย กรุณาเข้าสู่ระบบใหม่อีกครั้ง"
            : "Session ของคุณหมดอายุแล้ว กรุณา login ใหม่เพื่อใช้งานระบบต่อไป"}
        </p>
        <button
          type="button"
          onClick={onRedirect}
          className="w-full bg-gradient-to-r from-[#0284c7] to-[#10b981] text-white font-semibold py-3 rounded-xl hover:opacity-90 transition-opacity cursor-pointer"
        >
          ไปหน้า Login
        </button>
      </div>
    </div>
  );
}

// ============================================================
// Idle Warning Modal
// ============================================================

function IdleWarningModal({
  secondsLeft,
  onContinue,
  onLogoutNow,
}: {
  secondsLeft: number;
  onContinue: () => void;
  onLogoutNow: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div
        className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 text-center"
        style={{ fontFamily: "var(--font-prompt, sans-serif)" }}
      >
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">ไม่มีการใช้งานระบบ</h2>
        <p className="text-slate-500 text-sm mb-6 leading-relaxed">
          ระบบจะออกจากระบบอัตโนมัติใน{" "}
          <strong className="text-amber-600 text-base">{secondsLeft} วินาที</strong>{" "}
          เพื่อความปลอดภัยหากคุณลืมออกจากระบบ
        </p>
        <div className="flex flex-col sm:flex-row gap-2.5">
          <button
            type="button"
            onClick={onLogoutNow}
            className="w-full sm:w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold py-2.5 rounded-xl transition-colors cursor-pointer"
          >
            ออกจากระบบ
          </button>
          <button
            type="button"
            onClick={onContinue}
            className="w-full sm:w-1/2 bg-gradient-to-r from-[#0284c7] to-[#10b981] text-white font-semibold py-2.5 rounded-xl hover:opacity-90 transition-opacity cursor-pointer"
          >
            ใช้งานต่อ
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// AuthGuard
// ============================================================

export function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const isClient = useIsClient();
  const { isAuthenticated, sessionExpiresAt } = useAuth();

  const [expiredReason, setExpiredReason] = useState<"expired" | "idle" | null>(null);
  const [warningRemainingMs, setWarningRemainingMs] = useState<number | null>(null);
  const [idleCountdownSec, setIdleCountdownSec] = useState<number | null>(null);
  const lastActivityRef = useRef<number>(0);

  const showExpiredModal = expiredReason !== null;
  const hasCallbackParams = isClient && hasAuthCallbackParams();
  const isChecking = !isClient || hasCallbackParams;
  const isWarningActive =
    warningRemainingMs !== null && warningRemainingMs <= WARNING_MS;

  const performAutoLogout = useCallback((reason: "expired" | "idle") => {
    void logoutFromBackend();
    clearSession();
    notifyAuthChange();
    setWarningRemainingMs(null);
    setIdleCountdownSec(null);
    setExpiredReason(reason);
  }, []);

  // ---- จัดการ OAuth callback / ตรวจสอบสิทธิ์การเข้าใช้งาน ----
  useEffect(() => {
    if (!isClient) return;

    if (hasAuthCallbackParams()) {
      void processAuthCallback({
        allowCodeOnlySession: true,
        context: "AuthGuard",
      }).then((result) => {
        if (!result.authenticated && !showExpiredModal) {
          router.replace("/login");
        }
      });
      return;
    }

    if (!isAuthenticated && !showExpiredModal) {
      router.replace("/login");
    }
  }, [isClient, isAuthenticated, showExpiredModal, router]);

  // ---- ตรวจสอบวันหมดอายุของ Session และนับถอยหลังเตือนก่อนหมดอายุ ----
  useEffect(() => {
    if (!isClient || !isAuthenticated || sessionExpiresAt === null) return;

    let intervalId: ReturnType<typeof setInterval> | null = null;

    const evaluateSession = () => {
      const left = sessionExpiresAt - Date.now();
      if (left <= 0) {
        performAutoLogout("expired");
        if (intervalId) clearInterval(intervalId);
        return;
      }

      if (left <= WARNING_MS) {
        setWarningRemainingMs(left);
      } else {
        setWarningRemainingMs(null);
      }
    };

    const initialTimer = setTimeout(evaluateSession, 0);
    const tickMs = isWarningActive ? 1000 : 30_000;
    intervalId = setInterval(evaluateSession, tickMs);

    return () => {
      clearTimeout(initialTimer);
      if (intervalId) clearInterval(intervalId);
    };
  }, [isClient, isAuthenticated, sessionExpiresAt, isWarningActive, performAutoLogout]);

  // ---- ตรวจจับการไม่ใช้งาน (Idle Timeout 15 นาที → เตือน 60 วินาที → Logout อัตโนมัติ) ----
  useEffect(() => {
    if (!isClient || !isAuthenticated || showExpiredModal) return;

    const stampActivity = () => {
      const now = Date.now();
      if (now - lastActivityRef.current < 3000) return;
      lastActivityRef.current = now;
      try {
        localStorage.setItem(LAST_ACTIVITY_KEY, String(now));
      } catch {
        // ignore storage quota errors
      }
    };

    const initNow = Date.now();
    lastActivityRef.current = initNow;
    try {
      localStorage.setItem(LAST_ACTIVITY_KEY, String(initNow));
    } catch {
      // ignore
    }

    const events: (keyof WindowEventMap)[] = [
      "mousemove",
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
      "click",
    ];

    const onActivity = () => {
      // ขณะแสดง Modal เตือน ไม่ปิดอัตโนมัติจากการขยับเมาส์ ให้กดปุ่ม "ใช้งานต่อ"
      if (idleCountdownSec !== null) return;
      stampActivity();
    };

    events.forEach((ev) => window.addEventListener(ev, onActivity, { passive: true }));

    const intervalId = setInterval(() => {
      if (idleCountdownSec !== null) {
        setIdleCountdownSec((prev) => {
          if (prev === null) return null;
          if (prev <= 1) {
            performAutoLogout("idle");
            return null;
          }
          return prev - 1;
        });
        return;
      }

      let lastActive = lastActivityRef.current;
      try {
        const stored = Number(localStorage.getItem(LAST_ACTIVITY_KEY));
        if (!Number.isNaN(stored) && stored > lastActive) {
          lastActive = stored;
          lastActivityRef.current = stored;
        }
      } catch {
        // ignore
      }

      if (Date.now() - lastActive >= IDLE_TIMEOUT_MS) {
        setIdleCountdownSec(IDLE_COUNTDOWN_SEC);
      }
    }, 1000);

    return () => {
      events.forEach((ev) => window.removeEventListener(ev, onActivity));
      clearInterval(intervalId);
    };
  }, [isClient, isAuthenticated, showExpiredModal, idleCountdownSec, performAutoLogout]);

  const handleContinueSession = useCallback(() => {
    const now = Date.now();
    lastActivityRef.current = now;
    try {
      localStorage.setItem(LAST_ACTIVITY_KEY, String(now));
    } catch {
      // ignore
    }
    setIdleCountdownSec(null);
  }, []);

  const handleManualLogoutNow = useCallback(() => {
    void logoutFromBackend();
    clearSession();
    notifyAuthChange();
    setIdleCountdownSec(null);
    router.replace("/login");
  }, [router]);

  const handleExpiredRedirect = useCallback(() => {
    setExpiredReason(null);
    router.replace("/login");
  }, [router]);

  if (expiredReason) {
    return (
      <SessionExpiredModal
        reason={expiredReason}
        onRedirect={handleExpiredRedirect}
      />
    );
  }

  if (isChecking) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-slate-50/50">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="mt-3 text-sm text-slate-500 font-medium">
          กำลังตรวจสอบสิทธิ์การเข้าใช้งาน...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <>
      {warningRemainingMs !== null && warningRemainingMs > 0 && (
        <SessionWarningToast remainingMs={warningRemainingMs} />
      )}
      {idleCountdownSec !== null && (
        <IdleWarningModal
          secondsLeft={idleCountdownSec}
          onContinue={handleContinueSession}
          onLogoutNow={handleManualLogoutNow}
        />
      )}
      {children}
    </>
  );
}
