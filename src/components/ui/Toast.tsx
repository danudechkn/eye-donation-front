"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { CheckCircle2, AlertCircle, X } from "lucide-react";

export interface ToastNotification {
  type: "success" | "error";
  message: string;
}

/**
 * จัดการสถานะ Floating Toast Notification พร้อมอนิเมชันเข้า-ออก
 * ใช้ callback-based timers เพื่อหลีกเลี่ยง setState ใน useEffect
 */
export function useToast() {
  const [notification, setNotification] = useState<ToastNotification | null>(null);
  const [visible, setVisible] = useState(false);

  const enterTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const removeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (enterTimerRef.current) clearTimeout(enterTimerRef.current);
    if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
    if (removeTimerRef.current) clearTimeout(removeTimerRef.current);
    enterTimerRef.current = null;
    exitTimerRef.current = null;
    removeTimerRef.current = null;
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  const showToast = useCallback(
    (type: ToastNotification["type"], message: string) => {
      clearTimers();
      setNotification({ type, message });
      setVisible(false);

      enterTimerRef.current = setTimeout(() => setVisible(true), 20);
      exitTimerRef.current = setTimeout(() => setVisible(false), 2600);
      removeTimerRef.current = setTimeout(() => setNotification(null), 3000);
    },
    [clearTimers],
  );

  const dismissToast = useCallback(() => {
    clearTimers();
    setVisible(false);
    removeTimerRef.current = setTimeout(() => setNotification(null), 400);
  }, [clearTimers]);

  const clearToast = useCallback(() => {
    clearTimers();
    setVisible(false);
    setNotification(null);
  }, [clearTimers]);

  return { notification, visible, showToast, dismissToast, clearToast };
}

export function Toast({
  notification,
  visible,
  onClose,
}: {
  notification: ToastNotification | null;
  visible: boolean;
  onClose: () => void;
}) {
  if (!notification) return null;

  return (
    <div
      className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        visible
          ? "opacity-100 translate-y-0 scale-100"
          : "opacity-0 -translate-y-8 scale-95 pointer-events-none"
      }`}
    >
      <div className="bg-white border border-slate-100 shadow-[0_10px_35px_rgba(0,0,0,0.08)] rounded-full px-5 py-2.5 sm:px-6 sm:py-3 flex items-center gap-3.5 min-w-[280px] sm:min-w-[340px] justify-between">
        <div className="flex items-center gap-3 truncate">
          {notification.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-[#2e7d32] shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
          )}
          <span
            className={`text-sm font-medium tracking-tight truncate ${
              notification.type === "success" ? "text-[#1e5631]" : "text-rose-800"
            }`}
          >
            {notification.message}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors shrink-0 ml-3 cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
