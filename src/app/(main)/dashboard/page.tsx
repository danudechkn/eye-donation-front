"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  HeartHandshake,
  Plus,
  ClipboardList,
  ShieldCheck,
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
import { Select, ListBox } from "@heroui/react";
import { CiCalendar } from "react-icons/ci";
import { FaEye } from "react-icons/fa";
import { LuBrain } from "react-icons/lu";
import { LiaBookDeadSolid } from "react-icons/lia";
import { useDonorCases, useStatistics } from "@/hooks/useApi";
import { useIsClient } from "@/hooks/useIsClient";
import { processAuthCallback } from "@/lib/auth";
import {
  getEyeCount,
  isNegotiateFailed,
  isNegotiateSuccess,
  isPotentialCase,
} from "@/lib/caseHelpers";

const MONTH_OPTIONS = [
  { value: "all", label: "ทุกเดือน (ทั้งปี)" },
  { value: "1", label: "มกราคม (ม.ค.)" },
  { value: "2", label: "กุมภาพันธ์ (ก.พ.)" },
  { value: "3", label: "มีนาคม (มี.ค.)" },
  { value: "4", label: "เมษายน (เม.ย.)" },
  { value: "5", label: "พฤษภาคม (พ.ค.)" },
  { value: "6", label: "มิถุนายน (มิ.ย.)" },
  { value: "7", label: "กรกฎาคม (ก.ค.)" },
  { value: "8", label: "สิงหาคม (ส.ค.)" },
  { value: "9", label: "กันยายน (ก.ย.)" },
  { value: "10", label: "ตุลาคม (ต.ค.)" },
  { value: "11", label: "พฤศจิกายน (พ.ย.)" },
  { value: "12", label: "ธันวาคม (ธ.ค.)" },
] as const;

const THAI_MONTH_NAMES = [
  "ม.ค.",
  "ก.พ.",
  "มี.ค.",
  "เม.ย.",
  "พ.ค.",
  "มิ.ย.",
  "ก.ค.",
  "ส.ค.",
  "ก.ย.",
  "ต.ค.",
  "พ.ย.",
  "ธ.ค.",
] as const;

export default function Dashboard() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<string>(String(currentYear));
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [chartType, setChartType] = useState<"bar" | "area">("bar");

  const isClient = useIsClient();

  const {
    cases,
    pagination,
    loading: casesLoading,
    refetch: refetchCases,
  } = useDonorCases({ limit: 100 });

  const {
    stats,
    loading: statsLoading,
    refetch: refetchStats,
  } = useStatistics({
    year: selectedYear,
    month: selectedMonth,
  });

  const loading = statsLoading && casesLoading;

  useEffect(() => {
    void processAuthCallback({
      context: "Dashboard",
    }).then((result) => {
      if (result.authenticated) {
        refetchCases();
        refetchStats();
      }
    });
  }, [refetchCases, refetchStats]);

  const availableYears = stats?.available_years;
  const yearOptions = useMemo(() => {
    const list =
      availableYears && availableYears.length > 0 ? availableYears : [currentYear];
    return Array.from(new Set<number>([currentYear, ...list])).sort((a, b) => b - a);
  }, [availableYears, currentYear]);

  // ── KPI Calculations (ยึดค่าสรุปจาก Backend เป็นหลัก และ fallback จากรายการเคส) ──
  const totalCases = stats?.summary.total_cases ?? (pagination?.total || cases.length);

  const potentialCount =
    stats?.summary.potential_cases ??
    cases.filter((c) => isPotentialCase(c.potential)).length;
  const potentialRate =
    stats?.summary.potential_rate ??
    (totalCases > 0 ? Math.round((potentialCount / totalCases) * 100) : 0);

  const negotiateSuccCount =
    stats?.summary.consented_cases ??
    cases.filter((c) => isNegotiateSuccess(c.negotiate_succ)).length;
  const negotiateFailCount =
    stats?.breakdown.negotiate_status.failed ??
    cases.filter((c) => isNegotiateFailed(c.negotiate_succ)).length;
  const notYetCount = stats?.breakdown.negotiate_status.not_yet ?? 0;

  const outcomeTotal = negotiateSuccCount + negotiateFailCount;
  const actualNegotiated = Math.max(
    stats?.summary.negotiated_cases ?? 0,
    outcomeTotal,
  );
  const successRate =
    stats?.summary.negotiate_success_rate ??
    (actualNegotiated > 0
      ? Math.round((negotiateSuccCount / actualNegotiated) * 100)
      : 0);

  const eyesCollectedTotal =
    stats?.summary.total_eyes_collected ??
    cases.reduce((sum, c) => sum + getEyeCount(c), 0);

  const brainDeathCount =
    stats?.breakdown.death_type.brain_death ??
    cases.filter((c) => c.braincardiac === 1).length;
  const cardiacDeathCount =
    stats?.breakdown.death_type.cardiac_death ??
    cases.filter((c) => c.braincardiac === 2).length;
  const brainDeathPct =
    totalCases > 0 ? Math.round((brainDeathCount / totalCases) * 100) : 0;
  const cardiacDeathPct =
    totalCases > 0 ? Math.round((cardiacDeathCount / totalCases) * 100) : 0;

  // ── Chart Data ─────────────────────────────────────────────────────────────
  const monthlyTrend = stats?.monthly_trend;
  const monthlyChartData = useMemo(() => {
    let data =
      monthlyTrend && monthlyTrend.length > 0
        ? monthlyTrend.map((item) => ({
          name: item.label || item.month_name,
          monthKey: item.month,
          monthNum:
            item.month_num ||
            (item.month ? parseInt(item.month.split("-")[1], 10) : 0),
          cases: item.cases ?? item.total_cases ?? item.screened ?? 0,
          consented: item.consented ?? item.negotiate_succ ?? 0,
          eyes: item.eyes_collected ?? 0,
        }))
        : Array.from({ length: 12 }, (_, i) => ({
          name: THAI_MONTH_NAMES[i],
          monthKey: `${selectedYear}-${String(i + 1).padStart(2, "0")}`,
          monthNum: i + 1,
          cases: 0,
          consented: 0,
          eyes: 0,
        }));

    if (selectedMonth !== "all") {
      const targetMonthNum = parseInt(selectedMonth, 10);
      data = data.filter((item) => item.monthNum === targetMonthNum);
    }

    return data;
  }, [monthlyTrend, selectedYear, selectedMonth]);

  const negotiationPieData = [
    { name: "ยินยอมบริจาค (สำเร็จ)", value: negotiateSuccCount, color: "#10B981" },
    { name: "ปฏิเสธ / ไม่ยินยอม", value: negotiateFailCount, color: "#F43F5E" },
    ...(notYetCount > 0
      ? [{ name: "อยู่ระหว่างติดตาม", value: notYetCount, color: "#94A3B8" }]
      : []),
  ].filter((d) => d.value > 0);

  const safeNegotiationPieData =
    negotiationPieData.length > 0
      ? negotiationPieData
      : [{ name: "ไม่มีข้อมูล", value: 1, color: "#E2E8F0" }];

  const deathTypePieData = [
    { name: "สมองตาย", value: brainDeathCount, color: "#29b6f6" },
    { name: "หัวใจหยุดเต้น", value: cardiacDeathCount, color: "#F59E0B" },
  ].filter((d) => d.value > 0);

  const safeDeathTypePieData =
    deathTypePieData.length > 0
      ? deathTypePieData
      : [{ name: "ไม่มีข้อมูล", value: 1, color: "#E2E8F0" }];

  const currentMonthLabel =
    MONTH_OPTIONS.find((m) => m.value === selectedMonth)?.label || "ทั้งปี";

  return (
    <div className="min-h-screen bg-slate-50/70 p-4 sm:p-6 md:p-8 space-y-6 md:space-y-8 w-full">
      {/* 1. Header & Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.02)]">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">
              แดชบอร์ดภาพรวมการบริจาคดวงตา
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1.5 font-medium max-w-2xl">
            รายงานสถิติแบบเรียลไทม์ ติดตามกระบวนการคัดกรอง เจรจาขอความยินยอม และการจัดเก็บดวงตา
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Filter: ปี */}
          <Select
            aria-label="เลือกปี"
            selectedKey={selectedYear}
            onSelectionChange={(key) => {
              if (key != null) setSelectedYear(String(key));
            }}
            className="w-auto"
          >
            <Select.Trigger className="h-[42px] pl-3.5 pr-8 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 font-semibold text-sm rounded-xl shadow-2xs transition-all relative flex items-center gap-1.5 cursor-pointer active:scale-[0.98] data-[focus=true]:border-sky-400 data-[focus=true]:ring-2 data-[focus=true]:ring-sky-100">
              <div className="flex items-center gap-1.5 whitespace-nowrap">
                <CiCalendar className="w-4.5 h-4.5 text-slate-500 shrink-0" />
                <Select.Value className="text-sm font-semibold text-slate-700" />
              </div>
              <Select.Indicator className="text-slate-400 shrink-0 absolute right-2.5 inset-y-0 my-auto" />
            </Select.Trigger>
            <Select.Popover className="z-50 min-w-[140px] max-h-72 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg p-1">
              <ListBox className="outline-none">
                {yearOptions.map((y) => (
                  <ListBox.Item
                    key={String(y)}
                    id={String(y)}
                    textValue={`พ.ศ. ${y + 543}`}
                    className="px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg cursor-pointer outline-none data-[selected=true]:bg-sky-50 data-[selected=true]:text-[#0288d1] data-[selected=true]:font-bold transition-colors"
                  >
                    พ.ศ. {y + 543}
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>

          {/* Filter: เดือน */}
          <Select
            aria-label="เลือกเดือน"
            selectedKey={selectedMonth}
            onSelectionChange={(key) => {
              if (key != null) setSelectedMonth(String(key));
            }}
            className="w-auto"
          >
            <Select.Trigger className="h-[42px] pl-3.5 pr-8 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 font-semibold text-sm rounded-xl shadow-2xs transition-all relative flex items-center gap-1.5 cursor-pointer active:scale-[0.98] data-[focus=true]:border-sky-400 data-[focus=true]:ring-2 data-[focus=true]:ring-sky-100">
              <div className="flex items-center gap-1.5 whitespace-nowrap">
                <span className="text-xs font-bold text-slate-500 shrink-0">เดือน :</span>
                <Select.Value className="text-sm font-semibold text-slate-700" />
              </div>
              <Select.Indicator className="text-slate-400 shrink-0 absolute right-2.5 inset-y-0 my-auto" />
            </Select.Trigger>
            <Select.Popover className="z-50 min-w-[180px] max-h-72 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg p-1">
              <ListBox className="outline-none">
                {MONTH_OPTIONS.map((m) => (
                  <ListBox.Item
                    key={m.value}
                    id={m.value}
                    textValue={m.label}
                    className="px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg cursor-pointer outline-none data-[selected=true]:bg-sky-50 data-[selected=true]:text-[#0288d1] data-[selected=true]:font-bold transition-colors"
                  >
                    {m.label}
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>

          <Link
            href="/cases"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-semibold text-sm rounded-xl shadow-2xs transition-all hover:bg-slate-50 cursor-pointer active:scale-[0.98]"
          >
            <ClipboardList className="w-4 h-4 text-slate-500" />
            <span>ทะเบียนเคส</span>
          </Link>

          <Link
            href="/cases/form"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#29b6f6] hover:bg-[#0288d1] text-white font-semibold text-sm rounded-xl shadow-2xs transition-all active:scale-[0.98] cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>บันทึกเคสใหม่</span>
          </Link>
        </div>
      </div>

      {/* 2. Top KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
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
            {stats?.summary?.procurement_success_rate !== undefined && (
              <span className="font-semibold text-slate-600">
                สำเร็จ{" "}
                <span className="text-[#29b6f6]">
                  {Math.min(100, stats.summary.procurement_success_rate)}%
                </span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 3. Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Main Chart: Monthly Trends */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between h-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>
                  {selectedMonth === "all"
                    ? `แนวโน้มการบริจาคและจัดเก็บดวงตา (รายเดือนทั้งปี พ.ศ. ${Number(selectedYear) + 543})`
                    : `สถิติการบริจาคและจัดเก็บดวงตา (เดือน${currentMonthLabel} พ.ศ. ${Number(selectedYear) + 543})`}
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {selectedMonth === "all"
                  ? "เปรียบเทียบเคสคัดกรอง, เคสยินยอมบริจาค และจำนวนดวงตาที่จัดเก็บได้ตลอด 12 เดือน"
                  : `เปรียบเทียบเคสคัดกรอง, เคสยินยอมบริจาค และจำนวนดวงตาที่จัดเก็บได้ ประจำเดือน${currentMonthLabel}`}
              </p>
            </div>

            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-medium self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setChartType("bar")}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${chartType === "bar"
                  ? "bg-white text-slate-900 shadow-2xs font-semibold"
                  : "text-slate-600 hover:text-slate-900"
                  }`}
              >
                กราฟแท่ง
              </button>
              <button
                type="button"
                onClick={() => setChartType("area")}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${chartType === "area"
                  ? "bg-white text-slate-900 shadow-2xs font-semibold"
                  : "text-slate-600 hover:text-slate-900"
                  }`}
              >
                กราฟพื้นที่
              </button>
            </div>
          </div>

          <div className="w-full flex-1 min-h-[380px] pt-2">
            {isClient ? (
              <ResponsiveContainer width="100%" height="100%">
                {chartType === "bar" ? (
                  <BarChart
                    data={monthlyChartData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
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
                    <Legend wrapperStyle={{ paddingTop: "12px", fontSize: "12px" }} iconType="circle" />
                    <Bar name="เคสคัดกรอง" dataKey="cases" fill="#94A3B8" radius={[4, 4, 0, 0]} maxBarSize={56} />
                    <Bar name="ยินยอมบริจาค" dataKey="consented" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={56} />
                    <Bar name="ดวงตาที่จัดเก็บ" dataKey="eyes" fill="#29b6f6" radius={[4, 4, 0, 0]} maxBarSize={56} />
                  </BarChart>
                ) : (
                  <AreaChart
                    data={monthlyChartData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
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
                        <stop offset="5%" stopColor="#29b6f6" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#29b6f6" stopOpacity={0.0} />
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
                    <Legend wrapperStyle={{ paddingTop: "12px", fontSize: "12px" }} iconType="circle" />
                    <Area type="monotone" name="เคสคัดกรอง" dataKey="cases" stroke="#94A3B8" fillOpacity={1} fill="url(#colorCases)" strokeWidth={2} />
                    <Area type="monotone" name="ยินยอมบริจาค" dataKey="consented" stroke="#10B981" fillOpacity={1} fill="url(#colorConsent)" strokeWidth={2} />
                    <Area type="monotone" name="ดวงตาที่จัดเก็บ" dataKey="eyes" stroke="#29b6f6" fillOpacity={1} fill="url(#colorEyes)" strokeWidth={2.5} />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full bg-slate-50 animate-pulse rounded-xl" />
            )}
          </div>
        </div>

        {/* Donut Charts */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Card 1: สัดส่วนประเภทการเสียชีวิต */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between flex-1">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <LiaBookDeadSolid className="w-6.5 h-6.5 text-[#29b6f6] shrink-0" />
                <span>สัดส่วนประเภทการเสียชีวิต</span>
              </h3>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                รวม {totalCases} เคส
              </span>
            </div>

            <div className="flex items-center justify-center h-44 relative my-1" style={{ overflow: "visible" }}>
              {isClient ? (
                <ResponsiveContainer width="100%" height="100%" style={{ overflow: "visible" }}>
                  <PieChart style={{ overflow: "visible" }}>
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
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2.5 border-t border-slate-100 text-center text-xs">
              <div className="p-1.5 rounded-lg">
                <span className="inline-block w-2 h-2 rounded-full bg-[#29b6f6] mr-1" />
                <span className="text-slate-600">สมองตาย: </span>
                <strong className="text-[#29b6f6] font-bold">
                  {brainDeathCount} ({brainDeathPct}%)
                </strong>
              </div>
              <div className="p-1.5 rounded-lg">
                <span className="inline-block w-2 h-2 rounded-full bg-[#F59E0B] mr-1" />
                <span className="text-slate-600">หัวใจหยุดเต้น: </span>
                <strong className="text-amber-700 font-bold">
                  {cardiacDeathCount} ({cardiacDeathPct}%)
                </strong>
              </div>
            </div>
          </div>

          {/* Card 2: สัดส่วนผลการเจรจาขอรับบริจาค */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between flex-1">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <PieChartIcon className="w-4.5 h-4.5 text-emerald-500 shrink-0" />
                <span>สัดส่วนผลการเจรจาขอรับบริจาค</span>
              </h3>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                เจรจา {actualNegotiated} ราย
              </span>
            </div>

            <div className="flex items-center justify-center h-44 relative my-1" style={{ overflow: "visible" }}>
              {isClient ? (
                <ResponsiveContainer width="100%" height="100%" style={{ overflow: "visible" }}>
                  <PieChart style={{ overflow: "visible" }}>
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
                        <Cell key={`cell-neg-${index}`} fill={entry.color} />
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
            </div>

            <div
              className={`grid ${notYetCount > 0 ? "grid-cols-3" : "grid-cols-2"} gap-2 pt-2.5 border-t border-slate-100 text-center text-xs`}
            >
              <div className="p-1.5 rounded-lg">
                <span className="inline-block w-2 h-2 rounded-full bg-[#10B981] mr-1" />
                <span className="text-slate-600">ยินยอม: </span>
                <strong className="text-emerald-700 font-bold">
                  {negotiateSuccCount} (
                  {actualNegotiated > 0
                    ? Math.round((negotiateSuccCount / actualNegotiated) * 100)
                    : 0}
                  %)
                </strong>
              </div>
              <div className="p-1.5 rounded-lg">
                <span className="inline-block w-2 h-2 rounded-full bg-[#F43F5E] mr-1" />
                <span className="text-slate-600">ปฏิเสธ: </span>
                <strong className="text-rose-700 font-bold">
                  {negotiateFailCount} (
                  {actualNegotiated > 0
                    ? Math.round((negotiateFailCount / actualNegotiated) * 100)
                    : 0}
                  %)
                </strong>
              </div>
              {notYetCount > 0 && (
                <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="inline-block w-2 h-2 rounded-full bg-[#94A3B8] mr-1" />
                  <span className="text-slate-600">ติดตาม: </span>
                  <strong className="text-slate-700 font-bold">{notYetCount}</strong>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
