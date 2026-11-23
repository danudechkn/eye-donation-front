"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { MAIN_LOGIN_URL, processAuthCallback } from "@/lib/auth";
import { getDefaultHomeRoute, getEffectiveAppRole } from "@/lib/roles";
import { useAuth } from "@/context/AuthContext";
import { useIsClient } from "@/hooks/useIsClient";

export default function LoginPage() {
  const isClient = useIsClient();
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isClient) return;

    if (isAuthenticated) {
      router.push(getDefaultHomeRoute(getEffectiveAppRole(user)));
      return;
    }

    void processAuthCallback({ context: "Login" }).then((result) => {
      if (result.authenticated) {
        router.push(getDefaultHomeRoute(getEffectiveAppRole(result.user)));
      }
    });
  }, [isClient, isAuthenticated, user, router]);

  const handleLogin = () => {
    const loginUrl = new URL(MAIN_LOGIN_URL);
    loginUrl.searchParams.set("redirect_to", `${window.location.origin}/dashboard`);
    window.location.assign(loginUrl.toString());
  };

  if (!isClient) return null;

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-cyan-50 overflow-hidden font-sans">
      <div className="absolute top-[-10%] left-[-5%] w-[40vw] h-[40vw] rounded-full bg-cyan-200/20 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[50vw] h-[50vw] rounded-full bg-blue-300/10 blur-3xl pointer-events-none" />

      <div className="flex w-full max-w-6xl relative z-10 px-6 gap-8">
        <div className="hidden lg:flex flex-col justify-center flex-1 pr-12 relative">
          <h1 className="text-6xl font-light text-[#2C4B7E] leading-tight mb-4 tracking-wide">
            ให้...
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-teal-500">
              แสงสว่าง
            </span>
            <br />
            <span className="font-medium text-[#2C4B7E]">เป็นของขวัญ</span>
          </h1>
          <p className="text-[#4E7199] text-xl mb-16 font-light">
            การบริจาคดวงตา
            <br />
            คือการให้ชีวิตใหม่
          </p>

          <div className="absolute bottom-0 left-0 flex gap-8">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <div className="text-xs text-slate-500">
                More Sight
                <br />
                More Life
              </div>
            </div>
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <div className="text-xs text-slate-500">
                Donate Eyes
                <br />
                Save Lives
              </div>
            </div>
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <div className="text-xs text-slate-500">
                Together for
                <br />
                a Brighter Future
              </div>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-[480px] bg-white rounded-3xl shadow-2xl p-10 flex flex-col items-center border border-slate-100 relative z-20">
          <div className="mb-6 flex flex-col items-center w-full">
            <div className="w-24 h-24 mb-4 relative">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <defs>
                  <linearGradient id="eyeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#0284c7" />
                    <stop offset="100%" stopColor="#10b981" />
                  </linearGradient>
                </defs>
                <path d="M10 50 Q 50 10 90 50 Q 50 90 10 50" fill="none" stroke="url(#eyeGrad)" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="50" cy="50" r="16" fill="#0369a1" />
                <circle cx="55" cy="45" r="4" fill="white" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-[#006E8C] mb-1">Eye Donation</h2>
            <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em] font-bold">
              Registry &amp; Management System
            </p>
          </div>

          <div className="text-center text-sm text-slate-500 mb-8 leading-relaxed">
            ระบบบริหารจัดการการบริจาคดวงตา
            <br />
            เพื่อเพิ่มโอกาสในการมองเห็นให้กับผู้ป่วย
          </div>

          <div className="w-full px-4">
            <button
              type="button"
              onClick={handleLogin}
              className="w-full bg-gradient-to-r from-[#0284c7] to-[#10b981] text-white rounded-xl py-4 font-bold text-lg hover:shadow-lg hover:opacity-90 transition-all flex justify-center items-center group relative overflow-hidden cursor-pointer active:scale-[0.98]"
            >
              <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out" />
              <svg className="w-5 h-5 mr-2 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="relative z-10">PROVIDER ID LOGIN</span>
            </button>
          </div>

          <div className="mt-10 flex items-center w-full justify-center text-xs text-slate-400">
            <span className="w-16 h-px bg-slate-200" />
            <span className="mx-4 flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              Eye Donation v1.0.0
            </span>
            <span className="w-16 h-px bg-slate-200" />
          </div>
        </div>
      </div>
    </div>
  );
}
