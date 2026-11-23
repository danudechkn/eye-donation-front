"use client";

import { PieChart as PieChartIcon } from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { LiaBookDeadSolid } from "react-icons/lia";

interface PieSlice {
  name: string;
  value: number;
  color: string;
}

interface BreakdownDonutChartsProps {
  isClient: boolean;
  totalCases: number;
  brainDeathCount: number;
  cardiacDeathCount: number;
  brainDeathPct: number;
  cardiacDeathPct: number;
  actualNegotiated: number;
  negotiateSuccCount: number;
  negotiateFailCount: number;
  notYetCount: number;
  deathTypePieData: PieSlice[];
  negotiationPieData: PieSlice[];
}

const PIE_TOOLTIP_STYLE = {
  backgroundColor: "#FFFFFF",
  borderRadius: "10px",
  border: "1px solid #E2E8F0",
  fontSize: "12px",
};

export function BreakdownDonutCharts({
  isClient,
  totalCases,
  brainDeathCount,
  cardiacDeathCount,
  brainDeathPct,
  cardiacDeathPct,
  actualNegotiated,
  negotiateSuccCount,
  negotiateFailCount,
  notYetCount,
  deathTypePieData,
  negotiationPieData,
}: BreakdownDonutChartsProps) {
  return (
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
                  data={deathTypePieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={46}
                  outerRadius={68}
                  paddingAngle={3}
                >
                  {deathTypePieData.map((entry, index) => (
                    <Cell key={`cell-death-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={PIE_TOOLTIP_STYLE} />
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
                  data={negotiationPieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={46}
                  outerRadius={68}
                  paddingAngle={3}
                >
                  {negotiationPieData.map((entry, index) => (
                    <Cell key={`cell-neg-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={PIE_TOOLTIP_STYLE} />
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
  );
}
