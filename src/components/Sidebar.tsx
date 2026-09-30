"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(true);

  const isCasesActive = pathname.startsWith("/cases");
  const isDashboardActive = pathname === "/dashborad";

  return (
    <aside
      className={`relative bg-white border-r border-slate-200/80 h-screen flex flex-col justify-between select-none shadow-
        [1px_0_10px_rgba(0,0,0,0.02)] shrink-0 z-30 transition-all duration-300 ease-in-out ${isOpen ? "w-72" : "w-[68px]"
        }`}
    >
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        title={isOpen ? "off" : "on"}
        className="absolute -right-3.5 top-[calc(80px/2-14px)] z-50 w-7 h-7 bg-white border border-slate-200 text-slate-500 
        hover:text-sky-600 hover:border-sky-300 rounded-full flex items-center justify-center shadow-md transition-all 
        hover:scale-110 active:scale-95"
      >
        {isOpen ? (
          <PanelLeftClose className="w-3.5 h-3.5" />
        ) : (
          <PanelLeftOpen className="w-3.5 h-3.5" />
        )}
      </button>

      <div className="flex flex-col h-full overflow-hidden">
        {/* Brand Header */}
        <div
          className={`h-20 flex items-center border-b border-slate-100 bg-gradient-to-r from-sky-50/50 via-white to-white shrink-0 transition-all duration-300 ${isOpen ? "px-6 gap-3.5" : "px-0 justify-center"
            }`}
        >
          <Image src="/logoppk.png" width={45} height={45} alt="EyeDonation PPK" />
          {isOpen && (
            <div className="overflow-hidden">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-900 text-base tracking-tight whitespace-nowrap">
                  EyeDonation PPK
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium whitespace-nowrap">
                ระบบบริหารการบริจาคดวงตา
              </p>
            </div>
          )}
        </div>

        {/* Main Navigation */}
        <nav className="p-3 space-y-1 overflow-y-auto flex-1">
          {/* Dashboard */}
          <Link
            href="/"
            title={!isOpen ? "Dashboard" : undefined}
            className={`flex items-center rounded-xl text-sm font-semibold transition-all duration-200 ${isOpen ? "px-3.5 py-2.5 gap-3" : "p-3 justify-center"
              } ${isDashboardActive
                ? "bg-sky-50 text-sky-700 shadow-sm shadow-sky-100 border border-sky-200/60"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
          >
            <LayoutDashboard
              className={`w-4 h-4 shrink-0 ${isDashboardActive ? "text-sky-600" : "text-slate-400"
                }`}
            />
            {isOpen && <span>Dashboard</span>}
          </Link>

          {/* Index - Donor Cases */}
          <Link
            href="/cases"
            title={!isOpen ? "บันทึกเคสบริจาค" : undefined}
            className={`flex items-center rounded-xl text-sm font-semibold transition-all duration-200 ${isOpen ? "px-3.5 py-2.5 gap-3" : "p-3 justify-center"
              } ${isCasesActive
                ? "bg-sky-50 text-sky-700 shadow-sm shadow-sky-100 border border-sky-200/60"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
          >
            <ClipboardList
              className={`w-4 h-4 shrink-0 ${isCasesActive ? "text-sky-600" : "text-slate-400"
                }`}
            />
            {isOpen && <span>บันทึกเคสบริจาค</span>}
          </Link>
        </nav>
      </div>

      {/* Footer / Profile */}
      <div
        className={`border-t border-slate-100 bg-slate-50/50 shrink-0 transition-all duration-300 ${isOpen ? "p-4" : "p-2"
          }`}
      >
        <div
          className={`flex items-center p-2 rounded-xl bg-white border border-slate-200/70 shadow-sm transition-all duration-300 ${isOpen ? "justify-between" : "justify-center"
            }`}
        >
          {isOpen && (
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-sky-600 text-white flex items-center justify-center font-bold text-xs shadow-sm shrink-0">
                TC
              </div>
              <div className="truncate">
                <p className="text-xs font-bold text-slate-800 truncate">
                  พยาบาลประสานงาน
                </p>
                <p className="text-[11px] text-slate-400 truncate">ศูนย์ดวงตา</p>
              </div>
            </div>
          )}
          <button
            title="ออกจากระบบ"
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
