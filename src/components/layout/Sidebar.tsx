"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Eye,
  HeartPulse,
  Activity,
  ShieldCheck,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronsUpDown,
  UserRound,
} from "lucide-react";
import { Avatar, Badge, Dropdown, Label, Separator } from "@heroui/react";
import { useAuth } from "@/context/AuthContext";
import {
  APP_ROLE_BADGE_STYLES,
  APP_ROLE_LABELS,
  canAccessAdmin,
  canAccessEye,
  canAccessOrgan,
  getEffectiveAppRole,
} from "@/lib/roles";

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(true);

  const appRole = getEffectiveAppRole(user);
  const showEye = canAccessEye(appRole);
  const showOrgan = canAccessOrgan(appRole);
  const showAdmin = canAccessAdmin(appRole);
  const showSectionHeaders = isOpen && showEye && showOrgan;

  const isEyeDashboardActive = pathname === "/dashboard" || pathname === "/";
  const isEyeCasesActive = pathname === "/cases" || pathname.startsWith("/cases/");
  const isOrganDashboardActive = pathname === "/organs/dashboard";
  const isOrganCasesActive =
    pathname === "/organs/cases" || pathname.startsWith("/organs/cases/");
  const isAdminUsersActive = pathname === "/admin/users" || pathname.startsWith("/admin/");

  const navLinkClass = (active: boolean) =>
    `flex items-center rounded-xl text-sm font-semibold transition-all duration-200 ${
      isOpen ? "px-3.5 py-2.5 gap-3" : "p-3 justify-center"
    } ${
      active
        ? "bg-sky-50 text-sky-700 shadow-sm shadow-sky-100 border border-sky-200/60"
        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
    }`;

  const iconClass = (active: boolean) =>
    `w-4 h-4 shrink-0 ${active ? "text-sky-600" : "text-slate-400"}`;

  const brandTitle =
    appRole === "eye"
      ? "EyeDonation PPK"
      : appRole === "organ"
        ? "Organ Donation PPK"
        : "Organ Donation System";

  const brandSubtitle =
    appRole === "eye"
      ? "ระบบบริหารการบริจาคดวงตา"
      : appRole === "organ"
        ? "ระบบบริหารการบริจาคอวัยวะ"
        : "ระบบบริหารการบริจาคดวงตาและอวัยวะ";

  return (
    <aside
      className={`relative bg-white border-r border-slate-200/80 h-screen flex flex-col justify-between select-none shadow-[1px_0_10px_rgba(0,0,0,0.02)] shrink-0 z-30 transition-all duration-300 ease-in-out ${
        isOpen ? "w-72" : "w-[68px]"
      }`}
    >
      {/* Toggle Button */}
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        title={isOpen ? "ย่อแถบเมนู" : "ขยายแถบเมนู"}
        className="absolute -right-3.5 top-[calc(80px/2-14px)] z-50 w-7 h-7 bg-white border border-slate-200 text-slate-500 hover:text-sky-600 hover:border-sky-300 rounded-full flex items-center justify-center shadow-md transition-all hover:scale-110 active:scale-95 cursor-pointer"
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
          className={`h-20 flex items-center border-b border-slate-100 bg-gradient-to-r from-sky-50/50 via-white to-white shrink-0 transition-all duration-300 ${
            isOpen ? "px-6 gap-3.5" : "px-0 justify-center"
          }`}
        >
          <Image src="/logoppk.png" width={45} height={45} alt={brandTitle} />
          {isOpen && (
            <div className="overflow-hidden">
              <span className="block font-bold text-slate-900 text-base tracking-tight whitespace-nowrap truncate">
                {brandTitle}
              </span>
              <p className="text-xs text-slate-500 font-medium whitespace-nowrap truncate">
                {brandSubtitle}
              </p>
            </div>
          )}
        </div>

        {/* Main Navigation (แสดงตาม appRole: eye / organ / admin) */}
        <nav className="p-3 space-y-1 overflow-y-auto flex-1">
          {showEye && (
            <>
              {showSectionHeaders && (
                <p className="px-3 pt-1 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  บริจาคดวงตา
                </p>
              )}
              <Link
                href="/dashboard"
                title={!isOpen ? "EyeDonation Dashboard" : undefined}
                className={navLinkClass(isEyeDashboardActive)}
              >
                <LayoutDashboard className={iconClass(isEyeDashboardActive)} />
                {isOpen && <span>EyeDonation Dashboard</span>}
              </Link>

              <Link
                href="/cases"
                title={!isOpen ? "บันทึกเคสบริจาคดวงตา" : undefined}
                className={navLinkClass(isEyeCasesActive)}
              >
                <Eye className={iconClass(isEyeCasesActive)} />
                {isOpen && <span>บันทึกเคสบริจาคดวงตา</span>}
              </Link>
            </>
          )}

          {showOrgan && (
            <>
              {showSectionHeaders && (
                <p className="px-3 pt-4 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  บริจาคอวัยวะ
                </p>
              )}
              <Link
                href="/organs/dashboard"
                title={!isOpen ? "Organ Donation Dashboard" : undefined}
                className={navLinkClass(isOrganDashboardActive)}
              >
                <Activity className={iconClass(isOrganDashboardActive)} />
                {isOpen && <span>Organ Donation Dashboard</span>}
              </Link>

              <Link
                href="/organs/cases"
                title={!isOpen ? "บันทึกเคสบริจาคอวัยวะ" : undefined}
                className={navLinkClass(isOrganCasesActive)}
              >
                <HeartPulse className={iconClass(isOrganCasesActive)} />
                {isOpen && <span>บันทึกเคสบริจาคอวัยวะ</span>}
              </Link>
            </>
          )}

          {showAdmin && (
            <>
              {isOpen && (
                <p className="px-3 pt-4 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  ผู้ดูแลระบบ
                </p>
              )}
              <Link
                href="/admin/users"
                title={!isOpen ? "จัดการสิทธิ์ผู้ใช้งาน" : undefined}
                className={navLinkClass(isAdminUsersActive)}
              >
                <ShieldCheck className={iconClass(isAdminUsersActive)} />
                {isOpen && <span>จัดการสิทธิ์ผู้ใช้งาน</span>}
              </Link>
            </>
          )}
        </nav>
      </div>

      {/* Footer / Profile */}
      <div
        className={`border-t border-slate-100 bg-slate-50/40 shrink-0 transition-all duration-300 ${
          isOpen ? "p-3" : "p-2"
        }`}
      >
        <Dropdown>
          <Dropdown.Trigger
            aria-label="เมนูผู้ใช้งาน"
            className={`group w-full flex items-center rounded-2xl bg-white border border-slate-200/70 hover:border-sky-200 hover:bg-sky-50/30 shadow-xs hover:shadow-sm transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-sky-400/50 cursor-pointer ${
              isOpen ? "px-2.5 py-2 justify-between gap-2.5" : "p-1.5 justify-center"
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Badge.Anchor className="shrink-0">
                <Avatar size="sm" color="accent" variant="soft" className="w-9 h-9">
                  <Avatar.Fallback className="bg-gradient-to-br from-sky-500 to-teal-500 text-white font-bold text-xs tracking-wide flex items-center justify-center">
                    <UserRound className="w-4 h-4" />
                  </Avatar.Fallback>
                </Avatar>
                <Badge
                  color="success"
                  placement="bottom-right"
                  size="sm"
                  className="w-2.5 h-2.5 min-w-0 p-0 ring-2 ring-white"
                />
              </Badge.Anchor>

              {isOpen && (
                <div className="min-w-0 text-left">
                  <p className="text-xs font-bold text-slate-800 truncate leading-snug">
                    {user?.name || "พยาบาลประสานงาน"}
                  </p>
                  <p className="text-[11px] text-slate-400 truncate leading-snug">
                    {APP_ROLE_LABELS[appRole]}
                  </p>
                </div>
              )}
            </div>

            {isOpen && (
              <ChevronsUpDown className="w-4 h-4 text-slate-400 group-hover:text-sky-600 transition-colors shrink-0" />
            )}
          </Dropdown.Trigger>

          <Dropdown.Popover
            placement={isOpen ? "top start" : "right bottom"}
            offset={8}
            className="min-w-[244px] rounded-2xl border border-slate-200/80 bg-white shadow-xl p-1.5 z-50"
          >
            <div className="px-2.5 py-2 flex items-center gap-2.5">
              <Avatar size="sm" color="accent" variant="soft" className="w-9 h-9 shrink-0">
                <Avatar.Fallback className="bg-gradient-to-br from-sky-500 to-teal-500 text-white font-bold text-xs flex items-center justify-center">
                  <UserRound className="w-4 h-4" />
                </Avatar.Fallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-800 truncate">
                  {user?.name || "พยาบาลประสานงาน"}
                </p>
                <p className="text-[11px] text-slate-400 truncate">
                  {user?.role || APP_ROLE_LABELS[appRole]}
                </p>
                <span
                  className={`inline-flex items-center gap-1.5 mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${APP_ROLE_BADGE_STYLES[appRole].pill}`}
                >
                  <span className="flex items-center -space-x-0.5">
                    {APP_ROLE_BADGE_STYLES[appRole].dots.map((dotCls, idx) => (
                      <span key={idx} className={`w-1.5 h-1.5 rounded-full ${dotCls}`} />
                    ))}
                  </span>
                  <span>สิทธิ์: {APP_ROLE_LABELS[appRole]}</span>
                </span>
              </div>
            </div>

            <Separator className="my-1 bg-slate-100" />

            <Dropdown.Menu
              aria-label="การจัดการบัญชีผู้ใช้งาน"
              onAction={(key) => {
                if (key === "logout") logout();
              }}
            >
              <Dropdown.Item
                id="logout"
                textValue="ออกจากระบบ"
                variant="danger"
                className="rounded-xl px-2.5 py-2 text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer flex items-center gap-2.5 outline-none"
              >
                <LogOut className="w-4 h-4 text-rose-500 shrink-0" />
                <Label className="text-xs font-semibold text-rose-600 cursor-pointer">
                  ออกจากระบบ
                </Label>
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown.Popover>
        </Dropdown>
      </div>
    </aside>
  );
}
