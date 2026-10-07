"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { getCookie, clearSession, setSessionExpiry } from "@/lib/cookies";
import type { AuthUser } from "@/types";

// ============================================================
// Types
// ============================================================

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  /** ตั้งค่า user หลัง login สำเร็จ */
  setUser: (user: AuthUser) => void;
  /** Logout: ล้าง session แล้ว redirect */
  logout: () => void;
  /** รีเซ็ต session clock (ต่ออายุ) */
  renewSession: () => void;
}

// ============================================================
// Context
// ============================================================

const AuthContext = createContext<AuthContextValue | null>(null);

// ============================================================
// Provider
// ============================================================

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // โหลด user จาก cookie เมื่อ mount
  useEffect(() => {
    const raw = getCookie("eye_donation_user");
    if (raw) {
      try {
        setUserState(JSON.parse(raw));
      } catch {
        setUserState(null);
      }
    }
    setIsLoading(false);

    // ฟัง storage event เผื่อ tab อื่น login/logout
    const onStorage = () => {
      const updated = getCookie("eye_donation_user");
      if (updated) {
        try { setUserState(JSON.parse(updated)); } catch { setUserState(null); }
      } else {
        setUserState(null);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setUser = useCallback((u: AuthUser) => {
    setUserState(u);
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setUserState(null);
    window.location.href = "/login";
  }, []);

  const renewSession = useCallback(() => {
    setSessionExpiry();
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, setUser, logout, renewSession }}>
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
