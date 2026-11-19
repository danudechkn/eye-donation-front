"use client";

import {
  createContext,
  useContext,
  useEffect,
  useCallback,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { clearSession, setCookie, setSessionExpiry } from "@/lib/cookies";
import {
  AUTH_UNAUTHORIZED_EVENT,
  getAuthSnapshot,
  getServerAuthSnapshot,
  logoutFromBackend,
  notifyAuthChange,
  subscribeAuthStore,
} from "@/lib/auth";
import { useIsClient } from "@/hooks/useIsClient";
import type { AuthUser } from "@/types";

// ============================================================
// Types
// ============================================================

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  sessionExpiresAt: number | null;
  isLoading: boolean;
  /** ตั้งค่า user หลัง login สำเร็จ */
  setUser: (user: AuthUser) => void;
  /** Logout: เรียก POST /api/auth/logout ล้าง HttpOnly Cookie + ล้าง session แล้ว redirect */
  logout: () => void;
  /** รีเซ็ต session clock (ต่ออายุ) */
  renewSession: () => void;
}

// ============================================================
// Context & Provider
// ============================================================

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const isClient = useIsClient();
  const { user, isAuthenticated, sessionExpiresAt } = useSyncExternalStore(
    subscribeAuthStore,
    getAuthSnapshot,
    getServerAuthSnapshot,
  );

  // รับสัญญาณ 401/403 จาก API layer เพื่อ redirect ด้วย Next.js Router
  useEffect(() => {
    const onUnauthorized = () => {
      if (window.location.pathname !== "/login") {
        router.replace("/login");
      }
    };
    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, onUnauthorized);
    return () => {
      window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, onUnauthorized);
    };
  }, [router]);

  const setUser = useCallback((u: AuthUser) => {
    setCookie("eye_donation_user", JSON.stringify(u), 1);
    notifyAuthChange();
  }, []);

  const logout = useCallback(() => {
    void logoutFromBackend();
    clearSession();
    notifyAuthChange();
    router.replace("/login");
  }, [router]);

  const renewSession = useCallback(() => {
    setSessionExpiry();
    notifyAuthChange();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        sessionExpiresAt,
        isLoading: !isClient,
        setUser,
        logout,
        renewSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ============================================================
// Hook
// ============================================================

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
