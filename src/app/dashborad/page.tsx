"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Eye,
  HeartHandshake,
  Activity,
  Plus,
  ClipboardList,
  TrendingUp,
  RefreshCw,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  ChevronRight,
  Layers,
  Heart,
  BarChart3,
  PieChart as PieChartIcon,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  CartesianGrid,
} from "recharts";
import { useDonorCases } from "@/hooks/useApi";

export default function Dashboard() {
  const { cases, pagination, loading, refetch } = useDonorCases({ limit: 100 });
  const totalCases = pagination?.total || cases.length;

  const [mounted, setMounted] = useState(false);
  const [chartType, setChartType] = useState<"bar" | "area">("bar");

  useEffect(() => {
    setMounted(true);
  }, []);

  // 1. ศักยภาพบริจาค (Potential)
  const potentialCases = cases.filter((c) => c.potential === 1);
  const potentialCount = potentialCases.length;
  const potentialRate = totalCases > 0 ? Math.round((potentialCount / totalCases) * 100) : 0;

  // 2. การเจรจา (Negotiation)
  const negotiatedCases = cases.filter((c) => c.negotiate === 1);
  const negotiatedCount = negotiatedCases.length;
  const nonNegotiatedCount = cases.filter((c) => c.negotiate === 2).length;

  // 3. ผลการยินยอม (Consent Success)
  const negotiateSuccCount = cases.filter((c) => c.negotiate_succ === 1 || c.negotiate_succ === 11).length;
  const negotiateFailCount = cases.filter((c) => c.negotiate_succ === 2).length;
  const actualNegotiated = Math.max(negotiatedCount, negotiateSuccCount + negotiateFailCount);
  const successRate = actualNegotiated > 0 ? Math.min(100, Math.round((negotiateSuccCount / actualNegotiated) * 100)) : 0;

  // 4. การจัดเก็บดวงตา (Eyes Procured)
  const eyesCollectedCases = cases.filter((c) => c.geteye === 1);
  const eyesCollectedCasesCount = eyesCollectedCases.length;
  const eyesCollectedTotal = cases.reduce((sum, c) => sum + (c.geteye === 1 ? Number(c.eyetotal || 0) : 0), 0);
  const twoEyesCount = cases.filter((c) => c.geteye === 1 && Number(c.eyetotal) === 2).length;
  const oneEyeCount = cases.filter((c) => c.geteye === 1 && Number(c.eyetotal) === 1).length;

  // 5. ประเภทการเสียชีวิต (Brain Death vs Cardiac Death)
  const brainDeathCount = cases.filter((c) => c.braincardiac === 1).length;
  const cardiacDeathCount = cases.filter((c) => c.braincardiac === 2).length;
  const brainDeathPct = totalCases > 0 ? Math.round((brainDeathCount / totalCases) * 100) : 0;
  const cardiacDeathPct = totalCases > 0 ? Math.round((cardiacDeathCount / totalCases) * 100) : 0;

  // 6. เคสล่าสุด 5 รายการ
  const recentCases = [...cases].slice(0, 5);

  // --------------------------------------------------------------------------
  // Data for Charts
  // --------------------------------------------------------------------------

  // Chart A: Monthly Trend Data (Last 6 Months)
  const thaiMonthNames = [
    "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
    "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."
  ];

  const now = new Date();
  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return {
      monthKey: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      name: thaiMonthNames[d.getMonth()],
      cases: 0,
      consented: 0,
      eyes: 0,
    };
  });

  // Aggregate cases by month
  cases.forEach((c) => {
    const rawDate = c.createdAt || c.updatedAt || c.fristtime;
    if (rawDate) {
      const d = new Date(rawDate);
      if (!isNaN(d.getTime())) {
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        const match = last6Months.find((m) => m.monthKey === key);
        if (match) {
          match.cases += 1;
          if (c.negotiate_succ === 1 || c.negotiate_succ === 11) {
            match.consented += 1;
          }
          if (c.geteye === 1) {
            match.eyes += Number(c.eyetotal || 0);
          }
        }
      }
    }
  });

  // If no date distributed, populate current month with current sums
  const totalInChart = last6Months.reduce((acc, m) => acc + m.cases, 0);
  if (totalInChart === 0 && totalCases > 0) {
    const lastItem = last6Months[last6Months.length - 1];
    lastItem.cases = totalCases;
    lastItem.consented = negotiateSuccCount;
    lastItem.eyes = eyesCollectedTotal;
  }

  // Chart B: Negotiation Outcome Pie Data
  const negotiationPieData = [
    { name: "ยินยอมบริจาค (สำเร็จ)", value: negotiateSuccCount, color: "#10B981" },
    { name: "ปฏิเสธ / ไม่ยินยอม", value: negotiateFailCount, color: "#F43F5E" },
  ].filter((d) => d.value > 0);

  // Fallback if zero
  const safeNegotiationPieData = negotiationPieData.length > 0
    ? negotiationPieData
    : [{ name: "ไม่มีข้อมูล", value: 1, color: "#E2E8F0" }];

  // Chart C: Death Type Pie Data
  const deathTypePieData = [
    { name: "สมองตาย", value: brainDeathCount, color: "#0066FF" },
    { name: "หัวใจหยุดเต้น", value: cardiacDeathCount, color: "#F59E0B" },
  ].filter((d) => d.value > 0);

  const safeDeathTypePieData = deathTypePieData.length > 0
    ? deathTypePieData
    : [{ name: "ไม่มีข้อมูล", value: 1, color: "#E2E8F0" }];

  return (
    <div className="min-h-screen bg-slate-50/70 p-4 sm:p-6 md:p-8 space-y-6 md:space-y-8 w-full">
      {/* ============================================================ */}
      {/* 1. Header & Actions                                          */}
      {/* ============================================================ */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            แดชบอร์ดภาพรวมการบริจาคดวงตา
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">
            รายงานสถิติแบบเรียลไทม์ ติดตามกระบวนการคัดกรอง เจรจาขอความยินยอม และการจัดเก็บดวงตาส่งสภากาชาดไทย
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <Link
            href="/cases"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-medium text-sm rounded-xl shadow-xs transition-all hover:bg-slate-50 cursor-pointer"
          >
            <ClipboardList className="w-4 h-4 text-slate-500" />
            <span>ทะเบียนเคส</span>
          </Link>

          <Link
            href="/cases/form"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#0066FF] hover:bg-[#0052cc] text-white font-semibold text-sm rounded-xl shadow-md shadow-[#0066FF]/25 transition-all hover:scale-[1.01] active:scale-[0.98] cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>บันทึกเคสใหม่</span>
          </Link>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. Top KPI Cards                                             */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: เคสทั้งหมด */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">เคสคัดกรองทั้งหมด</span>
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center group-hover:scale-105 transition-transform">
              <ClipboardList className="w-5 h-5 text-slate-600" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {loading ? "-" : totalCases}
            </span>
            <span className="text-xs font-semibold text-slate-500">เคส</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <ClipboardList className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>ผู้เสียชีวิตที่รับรายงานทั้งหมด</span>
          </div>
        </div>

        {/* Card 2: มีศักยภาพบริจาค */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">มีศักยภาพบริจาค</span>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-indigo-600 tracking-tight">
              {loading ? "-" : potentialCount}
            </span>
            <span className="text-xs font-semibold text-indigo-500">ราย</span>
            <span className="ml-auto text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">
              {potentialRate}%
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-xs text-indigo-600 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            <span>ผ่านเกณฑ์ประเมินทางการแพทย์</span>
          </div>
        </div>

        {/* Card 3: ญาติยินยอมบริจาค */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">ญาติยินยอมบริจาค</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <HeartHandshake className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-600 tracking-tight">
              {loading ? "-" : negotiateSuccCount}
            </span>
            <span className="text-xs font-semibold text-emerald-500">ราย</span>
            <span className="ml-auto text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              {successRate}% ยินยอม
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>เข้าเจรจาทั้งหมด:</span>
            <span className="font-semibold text-slate-800">{actualNegotiated} ราย</span>
          </div>
        </div>

        {/* Card 4: ดวงตาจัดเก็บสำเร็จ (Hero Color #0066FF) */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-[#0066FF] to-sky-500 text-white shadow-lg shadow-[#0066FF]/20 relative overflow-hidden group hover:shadow-xl transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-100">ดวงตาจัดเก็บสำเร็จ</span>
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs text-white flex items-center justify-center group-hover:scale-105 transition-transform">
              <Eye className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white tracking-tight">
              {loading ? "-" : eyesCollectedTotal}
            </span>
            <span className="text-xs font-semibold text-blue-100">ดวงตา</span>
            <span className="ml-auto text-xs font-semibold text-white bg-white/20 px-2 py-0.5 rounded-full">
              {eyesCollectedCasesCount} ผู้บริจาค
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-white/20 flex items-center gap-1.5 text-xs text-blue-100">
            <TrendingUp className="w-3.5 h-3.5 shrink-0" />
            <span>ส่งต่อศูนย์ดวงตาสภากาชาดไทย</span>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 3. CHARTS SECTION                                            */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Main Chart: Monthly Trends (7 Cols) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between h-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-[#0066FF]" />
                <span>แนวโน้มการบริจาคและจัดเก็บดวงตา (6 เดือนย้อนหลัง)</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                เปรียบเทียบเคสคัดกรอง, เคสยินยอมบริจาค และจำนวนดวงตาที่จัดเก็บได้
              </p>
            </div>

            {/* Chart Style Switcher */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl self-start sm:self-auto text-xs font-medium">
              <button
                type="button"
                onClick={() => setChartType("bar")}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                  chartType === "bar"
                    ? "bg-white text-slate-900 shadow-2xs font-semibold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                กราฟแท่ง
              </button>
              <button
                type="button"
                onClick={() => setChartType("area")}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                  chartType === "area"
                    ? "bg-white text-slate-900 shadow-2xs font-semibold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                กราฟพื้นที่
              </button>
            </div>
          </div>

          <div className="w-full flex-1 min-h-[380px] pt-2">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                {chartType === "bar" ? (
                  <BarChart data={last6Months} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis dataKey="name" tick={{ fill: "#64748B", fontSize: 12 }} stroke="#E2E8F0" />
                    <YAxis allowDecimals={false} tick={{ fill: "#64748B", fontSize: 12 }} stroke="#E2E8F0" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#FFFFFF",
                        borderRadius: "12px",
                        border: "1px solid #E2E8F0",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                        fontSize: "12px",
                      }}
                    />
                    <Legend
                      wrapperStyle={{ paddingTop: "12px", fontSize: "12px" }}
                      iconType="circle"
                    />
                    <Bar name="เคสคัดกรอง" dataKey="cases" fill="#94A3B8" radius={[4, 4, 0, 0]} />
                    <Bar name="ยินยอมบริจาค" dataKey="consented" fill="#10B981" radius={[4, 4, 0, 0]} />
                    <Bar name="ดวงตาที่จัดเก็บ" dataKey="eyes" fill="#0066FF" radius={[4, 4, 0, 0]} />
                  </BarChart>
                ) : (
                  <AreaChart data={last6Months} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorCases" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#94A3B8" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#94A3B8" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="colorConsent" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="colorEyes" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0066FF" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#0066FF" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis dataKey="name" tick={{ fill: "#64748B", fontSize: 12 }} stroke="#E2E8F0" />
                    <YAxis allowDecimals={false} tick={{ fill: "#64748B", fontSize: 12 }} stroke="#E2E8F0" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#FFFFFF",
                        borderRadius: "12px",
                        border: "1px solid #E2E8F0",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                        fontSize: "12px",
                      }}
                    />
                    <Legend
                      wrapperStyle={{ paddingTop: "12px", fontSize: "12px" }}
                      iconType="circle"
                    />
                    <Area type="monotone" name="เคสคัดกรอง" dataKey="cases" stroke="#94A3B8" fillOpacity={1} fill="url(#colorCases)" strokeWidth={2} />
                    <Area type="monotone" name="ยินยอมบริจาค" dataKey="consented" stroke="#10B981" fillOpacity={1} fill="url(#colorConsent)" strokeWidth={2} />
                    <Area type="monotone" name="ดวงตาที่จัดเก็บ" dataKey="eyes" stroke="#0066FF" fillOpacity={1} fill="url(#colorEyes)" strokeWidth={2.5} />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full bg-slate-50 animate-pulse rounded-xl" />
            )}
          </div>
        </div>

        {/* Donut Charts (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Card 1: ประเภทการเสียชีวิต (อยู่ข้างบน) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between flex-1">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#0066FF]" />
                <span>สัดส่วนประเภทการเสียชีวิต</span>
              </h3>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                รวม {totalCases} เคส
              </span>
            </div>

            <div className="flex items-center justify-center h-44 relative my-1">
              {mounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={safeDeathTypePieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={46}
                      outerRadius={68}
                      paddingAngle={3}
                    >
                      {safeDeathTypePieData.map((entry, index) => (
                        <Cell key={`cell-death-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#FFFFFF",
                        borderRadius: "10px",
                        border: "1px solid #E2E8F0",
                        fontSize: "12px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-32 h-32 rounded-full border-4 border-slate-100 animate-pulse" />
              )}
              {/* Donut Center */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xs text-slate-400 font-medium">ทั้งหมด</span>
                <span className="text-xl font-extrabold text-slate-900">{totalCases}</span>
              </div>
            </div>

            {/* Legend list */}
            <div className="grid grid-cols-2 gap-2 pt-2.5 border-t border-slate-100 text-center text-xs">
              <div className="p-1.5 rounded-lg bg-blue-50/70 border border-blue-100/50">
                <span className="inline-block w-2 h-2 rounded-full bg-[#0066FF] mr-1" />
                <span className="text-slate-600">สมองตาย: </span>
                <strong className="text-[#0066FF] font-bold">{brainDeathCount} ({brainDeathPct}%)</strong>
              </div>
              <div className="p-1.5 rounded-lg bg-amber-50/70 border border-amber-100/50">
                <span className="inline-block w-2 h-2 rounded-full bg-[#F59E0B] mr-1" />
                <span className="text-slate-600">หัวใจหยุดเต้น: </span>
                <strong className="text-amber-700 font-bold">{cardiacDeathCount} ({cardiacDeathPct}%)</strong>
              </div>
            </div>
          </div>

          {/* Card 2: ผลการเจรจา (อยู่ข้างล่าง) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between flex-1">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <PieChartIcon className="w-4 h-4 text-[#0066FF]" />
                <span>สัดส่วนผลการเจรจา</span>
              </h3>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                สำเร็จ {successRate}%
              </span>
            </div>

            <div className="flex items-center justify-center h-44 relative my-1">
              {mounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={safeNegotiationPieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={46}
                      outerRadius={68}
                      paddingAngle={3}
                    >
                      {safeNegotiationPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#FFFFFF",
                        borderRadius: "10px",
                        border: "1px solid #E2E8F0",
                        fontSize: "12px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-32 h-32 rounded-full border-4 border-slate-100 animate-pulse" />
              )}
              {/* Donut Center */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xs text-slate-400 font-medium">ยินยอม</span>
                <span className="text-xl font-extrabold text-slate-900">{negotiateSuccCount}</span>
              </div>
            </div>

            {/* Legend list */}
            <div className="grid grid-cols-2 gap-2 pt-2.5 border-t border-slate-100 text-center text-xs">
              <div className="p-1.5 rounded-lg bg-emerald-50/70 border border-emerald-100/50">
                <span className="inline-block w-2 h-2 rounded-full bg-[#10B981] mr-1" />
                <span className="text-slate-600">ยินยอม: </span>
                <strong className="text-emerald-700 font-bold">{negotiateSuccCount} ({actualNegotiated > 0 ? Math.round((negotiateSuccCount / actualNegotiated) * 100) : 0}%)</strong>
              </div>
              <div className="p-1.5 rounded-lg bg-rose-50/70 border border-rose-100/50">
                <span className="inline-block w-2 h-2 rounded-full bg-[#F43F5E] mr-1" />
                <span className="text-slate-600">ปฏิเสธ: </span>
                <strong className="text-rose-700 font-bold">{negotiateFailCount} ({actualNegotiated > 0 ? Math.round((negotiateFailCount / actualNegotiated) * 100) : 0}%)</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
