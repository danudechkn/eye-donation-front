"use client";

import { useState, useEffect, useMemo } from "react";
import { useDonorCases, useStatistics } from "@/hooks/useApi";
import { useCaseRealtime } from "@/hooks/useRealtime";
import { useIsClient } from "@/hooks/useIsClient";
import { processAuthCallback } from "@/lib/auth";
import {
  getEyeCount,
  isNegotiateFailed,
  isNegotiateSuccess,
  isPotentialCase,
} from "@/lib/caseHelpers";
import { MONTH_OPTIONS, THAI_MONTH_NAMES } from "@/components/dashboard/constants";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardKpiCards } from "@/components/dashboard/DashboardKpiCards";
import { MonthlyTrendChart } from "@/components/dashboard/MonthlyTrendChart";
import { BreakdownDonutCharts } from "@/components/dashboard/BreakdownDonutCharts";

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

  // อัปเดตสถิติและกราฟบน Dashboard แบบ Real-time เมื่อมีการเปลี่ยนแปลงเคส
  useCaseRealtime(() => {
    refetchCases();
    refetchStats();
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

  // ── KPI Calculations ──────────────────────────────────────────────────────
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
  const actualNegotiated = Math.max(stats?.summary.negotiated_cases ?? 0, outcomeTotal);
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

  // ── Chart Data ────────────────────────────────────────────────────────────
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
      <DashboardHeader
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
        yearOptions={yearOptions}
        onYearChange={setSelectedYear}
        onMonthChange={setSelectedMonth}
      />

      <DashboardKpiCards
        loading={loading}
        totalCases={totalCases}
        potentialCount={potentialCount}
        potentialRate={potentialRate}
        negotiateSuccCount={negotiateSuccCount}
        successRate={successRate}
        actualNegotiated={actualNegotiated}
        eyesCollectedTotal={eyesCollectedTotal}
        procurementSuccessRate={stats?.summary?.procurement_success_rate}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <MonthlyTrendChart
          isClient={isClient}
          selectedYear={selectedYear}
          selectedMonth={selectedMonth}
          currentMonthLabel={currentMonthLabel}
          chartType={chartType}
          onChartTypeChange={setChartType}
          data={monthlyChartData}
        />

        <BreakdownDonutCharts
          isClient={isClient}
          totalCases={totalCases}
          brainDeathCount={brainDeathCount}
          cardiacDeathCount={cardiacDeathCount}
          brainDeathPct={brainDeathPct}
          cardiacDeathPct={cardiacDeathPct}
          actualNegotiated={actualNegotiated}
          negotiateSuccCount={negotiateSuccCount}
          negotiateFailCount={negotiateFailCount}
          notYetCount={notYetCount}
          deathTypePieData={safeDeathTypePieData}
          negotiationPieData={safeNegotiationPieData}
        />
      </div>
    </div>
  );
}
