"use client";

import Link from "next/link";
import { Activity, HeartHandshake, HeartPulse, ClipboardList, ShieldCheck } from "lucide-react";

export default function OrganDashboardPage() {
  return (
    <div className="min-h-screen bg-slate-50/70 p-4 sm:p-6 md:p-8 space-y-6 w-full">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.02)]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">
            แดชบอร์ดภาพรวมการบริจาคอวัยวะ
          </h1>
          <p className="text-sm text-slate-500 mt-1.5 font-medium max-w-2xl">
            ติดตามภาพรวมเคสผู้บริจาคอวัยวะ การคัดกรอง การเจรจาขอความยินยอม และการจัดเก็บอวัยวะ
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Link
            href="/organs/cases"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#29b6f6] hover:bg-[#0288d1] text-white font-semibold text-sm rounded-xl shadow-2xs transition-all active:scale-[0.98]"
          >
            <HeartPulse className="w-4 h-4" />
            <span>ทะเบียนเคสบริจาคอวัยวะ</span>
          </Link>
        </div>
      </div>

      {/* KPI Placeholders */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          {
            title: "เคสคัดกรองทั้งหมด",
            unit: "เคส",
            sub: "ผู้ป่วยสมองตายที่รับแจ้ง",
            icon: ClipboardList,
            color: "bg-slate-50 text-slate-500 border-slate-100",
          },
          {
            title: "ผ่านเกณฑ์ประเมิน",
            unit: "ราย",
            sub: "มีศักยภาพบริจาคอวัยวะ",
            icon: ShieldCheck,
            color: "bg-indigo-50 text-indigo-600 border-indigo-100",
          },
          {
            title: "ญาติยินยอมบริจาค",
            unit: "ราย",
            sub: "เจรจาขอรับบริจาคสำเร็จ",
            icon: HeartHandshake,
            color: "bg-emerald-50 text-emerald-600 border-emerald-100",
          },
          {
            title: "อวัยวะที่จัดเก็บได้",
            unit: "อวัยวะ",
            sub: "ไต ตับ หัวใจ ปอด ลิ้นหัวใจ",
            icon: HeartPulse,
            color: "bg-sky-50 text-[#0288d1] border-sky-100",
          },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="p-5 rounded-2xl bg-white border border-slate-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.02)]"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {card.title}
                </span>
                <div
                  className={`w-9 h-9 rounded-xl border flex items-center justify-center ${card.color}`}
                >
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-slate-800 tracking-tight">0</span>
                <span className="text-xs font-medium text-slate-400">{card.unit}</span>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-50 text-xs text-slate-500 font-medium">
                {card.sub}
              </div>
            </div>
          );
        })}
      </div>

      {/* Info Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-10 text-center space-y-3 shadow-xs">
        <div className="w-14 h-14 rounded-2xl bg-sky-50 text-[#29b6f6] flex items-center justify-center mx-auto">
          <Activity className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-bold text-slate-800">
          พื้นที่แดชบอร์ดระบบบริจาคอวัยวะพร้อมใช้งานแล้ว
        </h2>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          สิทธิ์การเข้าถึงแยกจากระบบบริจาคดวงตาเรียบร้อยแล้ว สามารถเชื่อมต่อ API และกราฟสถิติของเคสบริจาคอวัยวะเพิ่มเติมในหน้านี้ได้ทันที
        </p>
      </div>
    </div>
  );
}
