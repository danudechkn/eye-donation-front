"use client";

import { Clock, LogOut, RefreshCw, ShieldAlert, ShieldOff } from "lucide-react";
import type { AuthUser, UserStatus } from "@/types";

interface PendingApprovalScreenProps {
  user: AuthUser | null;
  status: Exclude<UserStatus, "active">;
  checking: boolean;
  notice?: string | null;
  onRecheck: () => void;
  onLogout: () => void;
}

export function PendingApprovalScreen({
  user,
  status,
  checking,
  notice,
  onRecheck,
  onLogout,
}: PendingApprovalScreenProps) {
  const providerId = user?.providerId || user?.cid || "-";
  const isSuspended = status === "suspended";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-sky-50/70 p-4">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200/80 shadow-xl p-8 text-center space-y-6">
        <div
          className={`w-16 h-16 rounded-2xl border flex items-center justify-center mx-auto ${
            isSuspended
              ? "bg-rose-50 border-rose-200/70 text-rose-500"
              : "bg-amber-50 border-amber-200/70 text-amber-500"
          }`}
        >
          {isSuspended ? (
            <ShieldOff className="w-8 h-8" />
          ) : (
            <Clock className="w-8 h-8" />
          )}
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-bold text-slate-800">
            {isSuspended
              ? "บัญชีของคุณถูกระงับสิทธิ์ชั่วคราว"
              : "รอผู้ดูแลระบบอนุมัติสิทธิ์การใช้งาน"}
          </h1>
          <p className="text-sm text-slate-500 leading-relaxed">
            {isSuspended ? (
              <>
                ผู้ดูแลระบบได้ปิดสิทธิ์การเข้าใช้งานของบัญชีนี้ชั่วคราว
                หากต้องการกลับมาใช้งานระบบ กรุณาติดต่อผู้ดูแลระบบ
              </>
            ) : (
              <>
                บัญชีของคุณถูกบันทึกเข้าสู่ระบบแล้ว แต่ยังไม่ได้รับการเปิดสิทธิ์เข้าถึงข้อมูล{" "}
                <strong className="text-slate-700">บริจาคดวงตา</strong> หรือ{" "}
                <strong className="text-slate-700">บริจาคอวัยวะ</strong>{" "}
                กรุณาแจ้งผู้ดูแลระบบเพื่อกำหนดสิทธิ์
              </>
            )}
          </p>
        </div>

        {/* User Info Box */}
        <div className="bg-slate-50 rounded-2xl border border-slate-200/70 p-4 text-left space-y-2 text-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-slate-400">ชื่อ-สกุล</span>
            <span className="font-semibold text-slate-800 truncate">
              {user?.name || "-"}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-slate-400">Provider ID</span>
            <span className="font-mono text-xs font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200/60">
              {providerId}
            </span>
          </div>
          {user?.role && (
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-slate-400">ตำแหน่ง</span>
              <span className="text-xs font-medium text-slate-600 truncate">
                {user.role}
              </span>
            </div>
          )}
        </div>

        {notice && (
          <div
            className={`flex items-center justify-center gap-1.5 text-xs font-medium border rounded-xl px-3 py-2 ${
              isSuspended
                ? "text-rose-600 bg-rose-50/80 border-rose-200/70"
                : "text-amber-600 bg-amber-50/80 border-amber-200/70"
            }`}
          >
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{notice}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
          <button
            type="button"
            onClick={onRecheck}
            disabled={checking}
            className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#29b6f6] hover:bg-[#0288d1] shadow-xs transition-all disabled:opacity-50 cursor-pointer active:scale-[0.98]"
          >
            <RefreshCw className={`w-4 h-4 ${checking ? "animate-spin" : ""}`} />
            <span>
              {checking
                ? "กำลังตรวจสอบ..."
                : isSuspended
                  ? "ตรวจสอบสถานะอีกครั้ง"
                  : "ตรวจสอบสิทธิ์อีกครั้ง"}
            </span>
          </button>

          <button
            type="button"
            onClick={onLogout}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>ออกจากระบบ</span>
          </button>
        </div>
      </div>
    </div>
  );
}
