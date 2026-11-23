"use client";

// ============================================================
// Session Warning Toast
// ============================================================

export function SessionWarningToast({ remainingMs }: { remainingMs: number }) {
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

export function SessionExpiredModal({
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

export function IdleWarningModal({
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
