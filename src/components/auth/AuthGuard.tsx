"use client";

import { useEffect, useState, useCallback, useRef, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { clearSession, setCookie } from "@/lib/cookies";
import {
  fetchCurrentAuthRole,
  hasAuthCallbackParams,
  logoutFromBackend,
  notifyAuthChange,
  processAuthCallback,
} from "@/lib/auth";
import {
  canAccessPathname,
  getDefaultHomeRoute,
  getEffectiveAppRole,
} from "@/lib/roles";
import { useAuth } from "@/context/AuthContext";
import { useIsClient } from "@/hooks/useIsClient";
import { useRoleRealtime } from "@/hooks/useRealtime";
import {
  IdleWarningModal,
  SessionExpiredModal,
  SessionWarningToast,
} from "./SessionModals";
import { PendingApprovalScreen } from "./PendingApprovalScreen";

const WARNING_MS = 5 * 60 * 1000; // เตือนก่อน session หมดอายุ 5 นาที
const IDLE_TIMEOUT_MS =
  Number(process.env.NEXT_PUBLIC_IDLE_TIMEOUT_MS) || 15 * 60 * 1000; // ไม่ใช้งาน 15 นาที
const IDLE_COUNTDOWN_SEC = 60; // นับถอยหลัง 60 วินาทีก่อนออกจากระบบอัตโนมัติ
const LAST_ACTIVITY_KEY = "eye_last_activity";

export function AuthGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isClient = useIsClient();
  const { user, isAuthenticated, sessionExpiresAt } = useAuth();

  const [expiredReason, setExpiredReason] = useState<"expired" | "idle" | null>(null);
  const [warningRemainingMs, setWarningRemainingMs] = useState<number | null>(null);
  const [idleCountdownSec, setIdleCountdownSec] = useState<number | null>(null);
  const [roleSynced, setRoleSynced] = useState(false);
  const [recheckingRole, setRecheckingRole] = useState(false);
  const [pendingNotice, setPendingNotice] = useState<string | null>(null);
  const lastActivityRef = useRef<number>(0);

  const showExpiredModal = expiredReason !== null;
  const hasCallbackParams = isClient && hasAuthCallbackParams();
  const isChecking = !isClient || hasCallbackParams;
  const isAccessKnown =
    roleSynced ||
    (user?.appRole !== undefined &&
      user?.userStatus !== undefined &&
      user?.isActive !== undefined);
  const effectiveStatus =
    user?.userStatus ?? (user?.isActive ? "active" : "pending");
  const isAccountActive = effectiveStatus === "active";
  const appRole = getEffectiveAppRole(user);
  const isRouteAllowed = canAccessPathname(pathname, appRole);
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

  // ---- ซิงค์ appRole และ userStatus ล่าสุดจากฐานข้อมูล Backend (GET /api/auth/me) ----
  useEffect(() => {
    if (!isClient || !isAuthenticated || hasCallbackParams || !user) return;

    let cancelled = false;
    void fetchCurrentAuthRole().then((res) => {
      if (cancelled) return;
      if (
        res &&
        (res.appRole !== user.appRole ||
          res.userStatus !== user.userStatus ||
          res.isActive !== user.isActive)
      ) {
        setCookie(
          "eye_donation_user",
          JSON.stringify({
            ...user,
            appRole: res.appRole,
            userStatus: res.userStatus,
            isActive: res.isActive,
          }),
        );
        notifyAuthChange();
      }
      setRoleSynced(true);
    });

    return () => {
      cancelled = true;
    };
  }, [isClient, isAuthenticated, hasCallbackParams, user]);

  // ---- รับแจ้งเตือนแบบ Real-time เมื่อ Admin เปลี่ยนสิทธิ์หรืออนุมัติบัญชีนี้ ----
  const currentProviderId = user?.providerId || user?.cid;
  useRoleRealtime(
    currentProviderId,
    () => {
      if (!user) return;
      void fetchCurrentAuthRole().then((res) => {
        if (
          res &&
          (res.appRole !== user.appRole ||
            res.userStatus !== user.userStatus ||
            res.isActive !== user.isActive)
        ) {
          setCookie(
            "eye_donation_user",
            JSON.stringify({
              ...user,
              appRole: res.appRole,
              userStatus: res.userStatus,
              isActive: res.isActive,
            }),
          );
          notifyAuthChange();
        }
        setRoleSynced(true);
      });
    },
    isClient && isAuthenticated && !hasCallbackParams && Boolean(user),
  );

  // ---- ล็อกเส้นทาง URL ไม่ให้ข้ามสิทธิ์ (eye / organ / admin) ----
  useEffect(() => {
    if (!isClient || !isAuthenticated || hasCallbackParams || showExpiredModal) return;
    if (!isAccessKnown || !isAccountActive) return;

    if (!isRouteAllowed) {
      router.replace(getDefaultHomeRoute(appRole));
    }
  }, [
    isClient,
    isAuthenticated,
    hasCallbackParams,
    showExpiredModal,
    isAccessKnown,
    isAccountActive,
    isRouteAllowed,
    appRole,
    router,
  ]);

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

  const handleRecheckRole = useCallback(async () => {
    if (!user) return;
    setRecheckingRole(true);
    setPendingNotice(null);
    try {
      const res = await fetchCurrentAuthRole();
      if (res) {
        setCookie(
          "eye_donation_user",
          JSON.stringify({
            ...user,
            appRole: res.appRole,
            userStatus: res.userStatus,
            isActive: res.isActive,
          }),
        );
        notifyAuthChange();
        if (res.isActive) {
          router.replace(getDefaultHomeRoute(res.appRole));
        } else {
          setPendingNotice(
            res.userStatus === "suspended"
              ? "บัญชีของคุณยังคงถูกระงับสิทธิ์ชั่วคราว กรุณาติดต่อผู้ดูแลระบบ"
              : "บัญชีของคุณยังรอการอนุมัติสิทธิ์จากผู้ดูแลระบบ",
          );
        }
      } else {
        setPendingNotice("ไม่สามารถเชื่อมต่อเพื่อตรวจสอบสิทธิ์ได้ กรุณาลองใหม่");
      }
    } finally {
      setRecheckingRole(false);
    }
  }, [user, router]);

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

  // รอซิงค์สิทธิ์และสถานะการอนุมัติจากฐานข้อมูลก่อนแสดงเนื้อหาใดๆ
  if (!isAccessKnown) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-slate-50/50">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="mt-3 text-sm text-slate-500 font-medium">
          กำลังตรวจสอบสิทธิ์การเข้าใช้งาน...
        </p>
      </div>
    );
  }

  // ยังไม่ได้รับการอนุมัติ (pending) หรือถูกระงับสิทธิ์ (suspended) → บล็อกไม่ให้เห็น Sidebar และข้อมูลใดๆ
  if (!isAccountActive) {
    return (
      <PendingApprovalScreen
        user={user}
        status={effectiveStatus === "suspended" ? "suspended" : "pending"}
        checking={recheckingRole}
        notice={pendingNotice}
        onRecheck={() => void handleRecheckRole()}
        onLogout={handleManualLogoutNow}
      />
    );
  }

  if (!isRouteAllowed) return null;

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
