"use client";

import { HeartHandshake, ClipboardList, ShieldCheck } from "lucide-react";
import { FaEye } from "react-icons/fa";
import { LuBrain } from "react-icons/lu";

interface DashboardKpiCardsProps {
  loading: boolean;
  totalCases: number;
  potentialCount: number;
  potentialRate: number;
  negotiateSuccCount: number;
  successRate: number;
  actualNegotiated: number;
  eyesCollectedTotal: number;
  procurementSuccessRate?: number;
}

export function DashboardKpiCards({
  loading,
  totalCases,
  potentialCount,
  potentialRate,
  negotiateSuccCount,
  successRate,
  actualNegotiated,
  eyesCollectedTotal,
  procurementSuccessRate,
}: DashboardKpiCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {/* 1. เคสคัดกรองทั้งหมด */}
      <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.02)] relative overflow-hidden group hover:shadow-[0_8px_20px_-3px_rgba(0,0,0,0.04)] transition-all">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            เคสคัดกรองทั้งหมด
          </span>
          <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 text-slate-600 flex items-center justify-center group-hover:scale-105 transition-transform">
            <ClipboardList className="w-4 h-4 text-slate-500" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-slate-800 tracking-tight">
            {loading ? "-" : totalCases}
          </span>
          <span className="text-xs font-medium text-slate-400">เคส</span>
        </div>
        <div className="mt-4 pt-3 border-t border-slate-50 flex items-center gap-1.5 text-xs text-slate-500 font-medium">
          <span>ผู้เสียชีวิตที่รับรายงานทั้งหมด</span>
        </div>
      </div>

      {/* 2. มีศักยภาพบริจาค */}
      <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.02)] relative overflow-hidden group hover:shadow-[0_8px_20px_-3px_rgba(0,0,0,0.04)] transition-all">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            มีศักยภาพบริจาค
          </span>
          <div className="w-9 h-9 rounded-xl bg-indigo-50/50 border border-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
            <LuBrain className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-slate-800 tracking-tight">
            {loading ? "-" : potentialCount}
          </span>
          <span className="text-xs font-medium text-slate-400">ราย</span>
          <span className="ml-auto text-xs font-medium text-indigo-600 bg-indigo-50/80 px-2 py-0.5 rounded-lg border border-indigo-100/50">
            {potentialRate}%
          </span>
        </div>
        <div className="mt-4 pt-3 border-t border-slate-50 flex items-center gap-1.5 text-xs text-slate-500 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <span>ผ่านเกณฑ์ประเมินทางการแพทย์</span>
        </div>
      </div>

      {/* 3. ญาติยินยอมบริจาค */}
      <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.02)] relative overflow-hidden group hover:shadow-[0_8px_20px_-3px_rgba(0,0,0,0.04)] transition-all">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            ญาติยินยอมบริจาค
          </span>
          <div className="w-9 h-9 rounded-xl bg-emerald-50/50 border border-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
            <HeartHandshake className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-slate-800 tracking-tight">
            {loading ? "-" : negotiateSuccCount}
          </span>
          <span className="text-xs font-medium text-slate-400">ราย</span>
          <span className="ml-auto text-xs font-medium text-emerald-600 bg-emerald-50/80 px-2 py-0.5 rounded-lg border border-emerald-100/50">
            {successRate}%
          </span>
        </div>
        <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span className="font-medium">เข้าเจรจาทั้งหมด:</span>
          <span className="font-semibold text-slate-700">{actualNegotiated} ราย</span>
        </div>
      </div>

      {/* 4. ดวงตาจัดเก็บสำเร็จ */}
      <div className="p-5 rounded-2xl bg-white border border-[#29b6f6]/10 shadow-[0_2px_15px_-3px_rgba(41,182,246,0.06)] relative overflow-hidden group hover:shadow-[0_8px_25px_-3px_rgba(41,182,246,0.12)] transition-all">
        <div className="flex items-center justify-between mb-4 mt-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            ดวงตาจัดเก็บสำเร็จ
          </span>
          <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100/50 text-[#29b6f6] flex items-center justify-center group-hover:scale-105 transition-transform">
            <FaEye className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-slate-800 tracking-tight">
            {loading ? "-" : eyesCollectedTotal}
          </span>
          <span className="text-xs font-medium text-slate-400">ดวงตา</span>
        </div>
        <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between text-xs text-slate-500 font-medium">
          {procurementSuccessRate !== undefined && (
            <span className="font-semibold text-slate-600">
              สำเร็จ{" "}
              <span className="text-[#29b6f6]">
                {Math.min(100, procurementSuccessRate)}%
              </span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
