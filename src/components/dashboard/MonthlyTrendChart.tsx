"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  CartesianGrid,
} from "recharts";
import type { MonthlyChartPoint } from "./constants";

interface MonthlyTrendChartProps {
  isClient: boolean;
  selectedYear: string;
  selectedMonth: string;
  currentMonthLabel: string;
  chartType: "bar" | "area";
  onChartTypeChange: (type: "bar" | "area") => void;
  data: MonthlyChartPoint[];
}

const TOOLTIP_STYLE = {
  backgroundColor: "#FFFFFF",
  borderRadius: "12px",
  border: "1px solid #E2E8F0",
  boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
  fontSize: "12px",
};

export function MonthlyTrendChart({
  isClient,
  selectedYear,
  selectedMonth,
  currentMonthLabel,
  chartType,
  onChartTypeChange,
  data,
}: MonthlyTrendChartProps) {
  const buddhistYear = Number(selectedYear) + 543;

  return (
    <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span>
              {selectedMonth === "all"
                ? `แนวโน้มการบริจาคและจัดเก็บดวงตา (รายเดือนทั้งปี พ.ศ. ${buddhistYear})`
                : `สถิติการบริจาคและจัดเก็บดวงตา (เดือน${currentMonthLabel} พ.ศ. ${buddhistYear})`}
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
            onClick={() => onChartTypeChange("bar")}
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
            onClick={() => onChartTypeChange("area")}
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
        {isClient ? (
          <ResponsiveContainer width="100%" height="100%">
            {chartType === "bar" ? (
              <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="name" tick={{ fill: "#64748B", fontSize: 12 }} stroke="#E2E8F0" />
                <YAxis allowDecimals={false} tick={{ fill: "#64748B", fontSize: 12 }} stroke="#E2E8F0" />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend wrapperStyle={{ paddingTop: "12px", fontSize: "12px" }} iconType="circle" />
                <Bar name="เคสคัดกรอง" dataKey="cases" fill="#94A3B8" radius={[4, 4, 0, 0]} maxBarSize={56} />
                <Bar name="ยินยอมบริจาค" dataKey="consented" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={56} />
                <Bar name="ดวงตาที่จัดเก็บ" dataKey="eyes" fill="#29b6f6" radius={[4, 4, 0, 0]} maxBarSize={56} />
              </BarChart>
            ) : (
              <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                <Tooltip contentStyle={TOOLTIP_STYLE} />
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
  );
}
