"use client";

import { useEffect, useState, useCallback, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
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
// AuthGuard
// ============================================================

export function AuthGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isClient = useIsClient();
  const { isAuthenticated, sessionExpiresAt } = useAuth();

  const [isProcessingCallback, setIsProcessingCallback] = useState(false);
  const [showExpiredModal, setShowExpiredModal] = useState(false);
  const [warningRemainingMs, setWarningRemainingMs] = useState<number | null>(null);

  const hasCallback = isClient && (hasAuthCallbackParams() || isProcessingCallback);
  const isWarningActive =
    warningRemainingMs !== null && warningRemainingMs <= WARNING_MS;

  // ---- จัดการ OAuth callback / ตรวจสอบสิทธิ์การเข้าใช้งาน ----
  useEffect(() => {
    if (!isClient) return;

    if (hasAuthCallbackParams()) {
      let mounted = true;
      void Promise.resolve().then(async () => {
        if (mounted) setIsProcessingCallback(true);
        await processAuthCallback({
          allowCodeOnlySession: true,
          context: "AuthGuard",
        });
        if (mounted) setIsProcessingCallback(false);
      });
      return () => {
        mounted = false;
      };
    }

    if (isAuthenticated || isProcessingCallback) {
      return;
    }

    if (!showExpiredModal) {
      router.replace("/login");
    }
  }, [isClient, pathname, isAuthenticated, isProcessingCallback, showExpiredModal, router]);

  // ---- ตรวจสอบวันหมดอายุของ Session และนับถอยหลังเตือนก่อนหมดอายุ ----
  useEffect(() => {
    if (!isClient || !isAuthenticated || sessionExpiresAt === null) return;

    let intervalId: ReturnType<typeof setInterval> | null = null;

    const evaluateSession = () => {
      const left = sessionExpiresAt - Date.now();
      if (left <= 0) {
        void logoutFromBackend();
        clearSession();
        notifyAuthChange();
        setWarningRemainingMs(null);
        setShowExpiredModal(true);
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
  }, [isClient, isAuthenticated, sessionExpiresAt, isWarningActive]);

  const handleExpiredRedirect = useCallback(() => {
    setShowExpiredModal(false);
    router.replace("/login");
  }, [router]);

  if (showExpiredModal) {
    return <SessionExpiredModal onRedirect={handleExpiredRedirect} />;
  }

  if (!isClient || hasCallback) {
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
      {children}
    </>
  );
}
