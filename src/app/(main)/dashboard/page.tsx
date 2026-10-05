"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  HeartHandshake,
  Plus,
  ClipboardList,
  TrendingUp,
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
import { useDonorCases, useStatistics, setCookie } from "@/hooks/useApi";
import { Select, ListBox } from "@heroui/react";
import { CiCalendar } from "react-icons/ci";
import { FaEye } from "react-icons/fa";
import { LuBrain } from "react-icons/lu";
import { LiaBookDeadSolid } from "react-icons/lia";

export default function Dashboard() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<string>(String(currentYear));
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [chartType, setChartType] = useState<"bar" | "area">("bar");

  const { cases, pagination, loading: casesLoading, refetch: refetchCases } = useDonorCases({ limit: 100 });
  const { stats, loading: statsLoading, refetch: refetchStats } = useStatistics({
    year: selectedYear,
    month: selectedMonth,
  });
  const loading = statsLoading && casesLoading;

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // ตรวจจับและเคลียร์ URL hash/query ที่ได้จากการล็อกอิน MOPH Provider (10.10.200.103:3577)
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (url.search || url.hash) {
        const searchParams = url.searchParams;
        const hashString = window.location.hash.startsWith("#")
          ? window.location.hash.substring(1)
          : window.location.hash;
        const hashParams = new URLSearchParams(hashString);

        // ดึงพารามิเตอร์ได้ทั้งจาก Query String (?) และ Hash (#)
        const getParam = (key: string) => searchParams.get(key) || hashParams.get(key);

        let token =
          getParam("token") ||
          getParam("moph_token") ||
          getParam("access_token") ||
          getParam("id_token") ||
          "";

        let providerProfile: any = null;

        // 1. ตรวจสอบ Profile จาก hash หรือ query (ที่ส่งมาจาก http://10.10.200.103:3577)
        const rawProfile =
          getParam("profile") ||
          getParam("provider_profile") ||
          getParam("data") ||
          getParam("user");

        if (rawProfile) {
          try {
            const unescaped = decodeURIComponent(rawProfile);
            if (unescaped.startsWith("{") || unescaped.startsWith("[")) {
              providerProfile = JSON.parse(unescaped);
            } else if (rawProfile.startsWith("{") || rawProfile.startsWith("[")) {
              providerProfile = JSON.parse(rawProfile);
            } else {
              const decodedStr = atob(rawProfile);
              providerProfile = JSON.parse(decodedStr);
            }
          } catch (e) {
            console.error("Error parsing provider profile:", e);
          }
        }

        // 2. ถ้ามี Token ให้ลองถอดรหัส JWT Payload เผื่อมีข้อมูลผู้ใช้ในนั้น
        let jwtPayload: any = null;
        if (token) {
          try {
            const base64Url = token.split(".")[1];
            if (base64Url) {
              const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
              const jsonPayload = decodeURIComponent(
                atob(base64)
                  .split("")
                  .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
                  .join("")
              );
              jwtPayload = JSON.parse(jsonPayload);
            }
          } catch { }
        }

        // 3. รวม Token: ถ้าใน URL ไม่มี token แต่ใน provider profile มี moph_access_token_idp ให้ดึงมาใช้
        if (!token && providerProfile?.organization?.[0]?.moph_access_token_idp) {
          token = providerProfile.organization[0].moph_access_token_idp;
        }

        // 4. ประกอบข้อมูลชื่อ-นามสกุล
        const firstName =
          providerProfile?.firstname_th ||
          providerProfile?.first_name_th ||
          providerProfile?.first_name ||
          "";
        const lastName =
          providerProfile?.lastname_th ||
          providerProfile?.last_name_th ||
          providerProfile?.last_name ||
          "";
        const title =
          providerProfile?.title_th ||
          providerProfile?.pre_name_th ||
          "";
        const providerFullName = [title, firstName, lastName].filter(Boolean).join(" ").trim();

        const name =
          providerFullName ||
          providerProfile?.name ||
          providerProfile?.fullname ||
          providerProfile?.display_name ||
          jwtPayload?.name ||
          jwtPayload?.fullname ||
          jwtPayload?.display_name ||
          jwtPayload?.thai_name ||
          getParam("name") ||
          getParam("fullname") ||
          "";

        const cid =
          providerProfile?.cid ||
          providerProfile?.provider_id ||
          jwtPayload?.cid ||
          jwtPayload?.pid ||
          jwtPayload?.sub ||
          getParam("cid") ||
          "";

        const role =
          providerProfile?.organization?.[0]?.position_type ||
          providerProfile?.profession_name_th ||
          providerProfile?.profession_name ||
          jwtPayload?.role ||
          jwtPayload?.position ||
          getParam("role") ||
          "พยาบาลประสานงาน";

        const hospcode =
          providerProfile?.organization?.[0]?.hcode ||
          providerProfile?.organization?.[0]?.hospcode ||
          providerProfile?.hospcode ||
          jwtPayload?.hospcode ||
          getParam("hospcode") ||
          "10664";

        // 5. บันทึกลง sessionStorage (ปิดแท็บหรือเบราว์เซอร์จะถูกล้างอัตโนมัติ เพื่อความปลอดภัยบนเครื่องส่วนรวมของ รพ.)
        // ถ้า MoPH ไม่ได้แนบ moph_access_token_idp มา แต่ยืนยันตัวตนสำเร็จมี Profile ให้สร้าง Token จาก Profile อัตโนมัติ
        if (!token && (cid || name || providerProfile)) {
          const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }))
            .replace(/=/g, "")
            .replace(/\+/g, "-")
            .replace(/\//g, "_");
          const payload = btoa(
            unescape(
              encodeURIComponent(
                JSON.stringify({
                  cid: cid || "unknown",
                  name: name || "เจ้าหน้าที่",
                  role: role || "staff",
                  hospcode: hospcode || "10664",
                  exp: Math.floor(Date.now() / 1000) + 86400 * 7,
                })
              )
            )
          )
            .replace(/=/g, "")
            .replace(/\+/g, "-")
            .replace(/\//g, "_");
          token = `${header}.${payload}.moph_session_sig`;
        }

        if (token) {
          setCookie("moph_token", token);
          sessionStorage.removeItem("moph_token");
          localStorage.removeItem("moph_token");
          // สั่งโหลดข้อมูลใหม่ทันทีที่มี Token เพื่อแก้ปัญหา Race Condition
          refetchCases();
          refetchStats();
        }
        if (providerProfile) {
          sessionStorage.setItem("provider_profile", JSON.stringify(providerProfile));
          localStorage.removeItem("provider_profile");
        }
        if (token || cid || name) {
          const userObj = {
            cid,
            name: name || "เจ้าหน้าที่",
            role,
            hospcode,
            providerId: providerProfile?.provider_id || "",
            loginAt: new Date().toISOString(),
          };
          setCookie("eye_donation_user", JSON.stringify(userObj));
          sessionStorage.setItem("eye_donation_user", JSON.stringify(userObj));
          localStorage.removeItem("eye_donation_user");

          // แจ้งเตือน Sidebar และส่วนอื่นๆ ให้อัปเดตข้อมูลผู้ใช้ทันที
          window.dispatchEvent(new Event("storage"));
        }

        // ลบ Query Parameters และ Hash ที่ยาวๆ ออกจากแถบ URL ให้เหลือแค่ /dashborad สะอาดตา
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, []);

  const monthOptions = [
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
  ];

  const yearOptions = useMemo(() => {
    const list = stats?.available_years && stats.available_years.length > 0
      ? stats.available_years
      : [currentYear];
    const set = new Set<number>([currentYear, ...list]);
    return Array.from(set).sort((a, b) => b - a);
  }, [stats?.available_years, currentYear]);

  // 1. เคสทั้งหมด (ใช้สถิติจาก backend สรุปตรงจากฐานข้อมูล)
  const totalCases = stats?.summary.total_cases ?? (pagination?.total || cases.length);

  // 2. ศักยภาพบริจาค (Potential)
  const potentialCount = stats?.summary.potential_cases ?? cases.filter((c) => c.potential === 1 || c.potential === 3).length;
  const potentialRate = stats?.summary.potential_rate ?? (totalCases > 0 ? Math.round((potentialCount / totalCases) * 100) : 0);

  // 3. การเจรจา (Negotiation)
  const negotiatedCount = stats?.summary.negotiated_cases ?? cases.filter((c) => c.negotiate === 1 || c.negotiate === 9).length;
  const negotiateSuccCount = stats?.summary.consented_cases ?? cases.filter((c) => c.negotiate_succ === 1 || c.negotiate_succ === 11).length;
  const negotiateFailCount = stats?.breakdown.negotiate_status.failed ?? cases.filter((c) => c.negotiate_succ === 2 || c.negotiate_succ === 12).length;
  const notYetCount = stats?.breakdown.negotiate_status.not_yet ?? 0;
  const outcomeTotal = negotiateSuccCount + negotiateFailCount;
  const actualNegotiated = Math.max(stats?.summary.negotiated_cases ?? 0, outcomeTotal);
  const successRate = stats?.summary.negotiate_success_rate ?? (actualNegotiated > 0 ? Math.round((negotiateSuccCount / actualNegotiated) * 100) : 0);

  // ฟังก์ชันคำนวณจำนวนดวงตาที่จัดเก็บจริงจากเคส
  // 17 หรือ 2 = 2 ดวง, 16 หรือ 1 = 1 ดวง, 15 หรือ 0 = ไม่ได้เก็บ (0 ดวง)
  const getEyeCount = (c: { geteye?: number; eyetotal?: number }) => {
    if (c.geteye !== 1 && c.geteye !== 13) return 0;
    if (c.eyetotal === 17 || c.eyetotal === 2) return 2;
    if (c.eyetotal === 16 || c.eyetotal === 1) return 1;
    return 0; // ค่า 15 หรืออื่นๆ คือไม่ได้เก็บ (0 ดวง)
  };

  // 4. การจัดเก็บดวงตา (Eyes Procured - Direct from Backend Statistics)
  const eyesCollectedTotal = stats?.summary.total_eyes_collected ?? cases.reduce((sum, c) => sum + getEyeCount(c), 0);
  const eyesCollectedCasesCount = stats?.summary.total_donors ?? cases.filter((c) => getEyeCount(c) > 0).length;

  // 5. ประเภทการเสียชีวิต (Brain Death vs Cardiac Death)
  const brainDeathCount = stats?.breakdown.death_type.brain_death ?? cases.filter((c) => c.braincardiac === 1).length;
  const cardiacDeathCount = stats?.breakdown.death_type.cardiac_death ?? cases.filter((c) => c.braincardiac === 2).length;
  const brainDeathPct = totalCases > 0 ? Math.round((brainDeathCount / totalCases) * 100) : 0;
  const cardiacDeathPct = totalCases > 0 ? Math.round((cardiacDeathCount / totalCases) * 100) : 0;

  // --------------------------------------------------------------------------
  // Data for Charts
  // --------------------------------------------------------------------------

  // Chart A: Monthly Trend Data (แสดงครบทั้งปี 12 เดือน ม.ค. - ธ.ค. จาก Backend)
  const thaiMonthNames = [
    "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
    "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."
  ];

  const monthlyChartData = useMemo(() => {
    let data = [];
    if (stats?.monthly_trend && stats.monthly_trend.length > 0) {
      data = stats.monthly_trend.map((item) => ({
        name: item.label || item.month_name,
        monthKey: item.month,
        monthNum: item.month_num || (item.month ? parseInt(item.month.split("-")[1], 10) : 0),
        cases: item.cases ?? item.total_cases ?? item.screened ?? 0,
        consented: item.consented ?? item.negotiate_succ ?? 0,
        eyes: item.eyes_collected ?? 0,
      }));
    } else {
      data = Array.from({ length: 12 }, (_, i) => ({
        name: thaiMonthNames[i],
        monthKey: `${selectedYear}-${String(i + 1).padStart(2, "0")}`,
        monthNum: i + 1,
        cases: 0,
        consented: 0,
        eyes: 0,
      }));
    }

    if (selectedMonth !== "all") {
      const targetMonthNum = parseInt(selectedMonth, 10);
      data = data.filter((item) => item.monthNum === targetMonthNum);
    }

    return data;
  }, [stats?.monthly_trend, selectedYear, selectedMonth]);

  // Chart B: Negotiation Outcome Pie Data
  const negotiationPieData = [
    { name: "ยินยอมบริจาค (สำเร็จ)", value: negotiateSuccCount, color: "#10B981" },
    { name: "ปฏิเสธ / ไม่ยินยอม", value: negotiateFailCount, color: "#F43F5E" },
    ...(notYetCount > 0 ? [{ name: "อยู่ระหว่างติดตาม", value: notYetCount, color: "#94A3B8" }] : []),
  ].filter((d) => d.value > 0);

  // Fallback if zero
  const safeNegotiationPieData = negotiationPieData.length > 0
    ? negotiationPieData
    : [{ name: "ไม่มีข้อมูล", value: 1, color: "#E2E8F0" }];

  // Chart C: Death Type Pie Data
  const deathTypePieData = [
    { name: "สมองตาย", value: brainDeathCount, color: "#29b6f6" },
    { name: "หัวใจหยุดเต้น", value: cardiacDeathCount, color: "#F59E0B" },
  ].filter((d) => d.value > 0);

  const safeDeathTypePieData = deathTypePieData.length > 0
    ? deathTypePieData
    : [{ name: "ไม่มีข้อมูล", value: 1, color: "#E2E8F0" }];

  const currentMonthLabel = monthOptions.find((m) => m.value === selectedMonth)?.label || "ทั้งปี";

  return (
    <div className="min-h-screen bg-slate-50/70 p-4 sm:p-6 md:p-8 space-y-6 md:space-y-8 w-full">
      {/* ============================================================ */}
      {/* 1. Header & Actions                                          */}
      {/* ============================================================ */}
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

        {/* Action Buttons & Filters */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Filter: เลือกปี */}
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

          {/* Filter: เลือกเดือน */}
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
                {monthOptions.map((m) => (
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

      {/* ============================================================ */}
      {/* 2. Top KPI Cards                                             */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: เคสทั้งหมด */}
        <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.02)] relative overflow-hidden group hover:shadow-[0_8px_20px_-3px_rgba(0,0,0,0.04)] transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">เคสคัดกรองทั้งหมด</span>
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

        {/* Card 2: มีศักยภาพบริจาค */}
        <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.02)] relative overflow-hidden group hover:shadow-[0_8px_20px_-3px_rgba(0,0,0,0.04)] transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">มีศักยภาพบริจาค</span>
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

        {/* Card 3: ญาติยินยอมบริจาค */}
        <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.02)] relative overflow-hidden group hover:shadow-[0_8px_20px_-3px_rgba(0,0,0,0.04)] transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">ญาติยินยอมบริจาค</span>
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

        {/* Card 4: ดวงตาจัดเก็บสำเร็จ (Clean Minimalist) */}
        <div className="p-5 rounded-2xl bg-white border border-[#29b6f6]/10 shadow-[0_2px_15px_-3px_rgba(41,182,246,0.06)] relative overflow-hidden group hover:shadow-[0_8px_25px_-3px_rgba(41,182,246,0.12)] transition-all">
          <div className="flex items-center justify-between mb-4 mt-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">ดวงตาจัดเก็บสำเร็จ</span>
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
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-[#29b6f6] shrink-0" />
              <span>ส่งต่อสภากาชาดไทย</span>
            </div>
            {stats?.summary?.procurement_success_rate !== undefined && (
              <span className="font-semibold text-slate-600">
                สำเร็จ <span className="text-[#29b6f6]">{Math.min(100, stats.summary.procurement_success_rate)}%</span>
              </span>
            )}
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

            {/* Switchers */}
            <div className="flex items-center gap-2.5 flex-wrap self-start sm:self-auto">

              {/* Chart Style Switcher */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-medium">
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
          </div>

          <div className="w-full flex-1 min-h-[380px] pt-2">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                {chartType === "bar" ? (
                  <BarChart data={monthlyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                    <Bar name="เคสคัดกรอง" dataKey="cases" fill="#94A3B8" radius={[4, 4, 0, 0]} maxBarSize={56} />
                    <Bar name="ยินยอมบริจาค" dataKey="consented" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={56} />
                    <Bar name="ดวงตาที่จัดเก็บ" dataKey="eyes" fill="#29b6f6" radius={[4, 4, 0, 0]} maxBarSize={56} />
                  </BarChart>
                ) : (
                  <AreaChart data={monthlyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                    <Legend
                      wrapperStyle={{ paddingTop: "12px", fontSize: "12px" }}
                      iconType="circle"
                    />
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

        {/* Donut Charts (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Card 1: ประเภทการเสียชีวิต (อยู่ข้างบน) */}
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
              {mounted ? (
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
              {/* Donut Center */}
              {/* <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xs text-slate-400 font-medium">ทั้งหมด</span>
                <span className="text-xl font-extrabold text-slate-900">{totalCases}</span>
              </div> */}
            </div>

            {/* Legend list */}
            <div className="grid grid-cols-2 gap-2 pt-2.5 border-t border-slate-100 text-center text-xs">
              <div className="p-1.5 rounded-lg bg-white-50/70">
                <span className="inline-block w-2 h-2 rounded-full bg-[#29b6f6] mr-1" />
                <span className="text-slate-600">สมองตาย: </span>
                <strong className="text-[#29b6f6] font-bold">{brainDeathCount} ({brainDeathPct}%)</strong>
              </div>
              <div className="p-1.5 rounded-lg bg-white-50/70">
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
                <PieChartIcon className="w-4 h-4 text-[#29b6f6]" />
                <span>สัดส่วนผลการเจรจา</span>
              </h3>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                สำเร็จ {successRate}%
              </span>
            </div>

            <div className="flex items-center justify-center h-44 relative my-1" style={{ overflow: "visible" }}>
              {mounted ? (
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
              {/* <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none ">
                <span className="text-xs text-slate-400 font-medium">ทั้งหมด</span>
                <span className="text-xl font-extrabold text-slate-900">{totalCases}</span>
              </div> */}
            </div>

            {/* Legend list */}
            <div className={`grid ${notYetCount > 0 ? "grid-cols-3" : "grid-cols-2"} gap-2 pt-2.5 border-t border-slate-100 text-center text-xs`}>
              <div className="p-1.5 rounded-lg bg-white-50/70">
                <span className="inline-block w-2 h-2 rounded-full bg-[#10B981] mr-1" />
                <span className="text-slate-600">ยินยอม: </span>
                <strong className="text-emerald-700 font-bold">{negotiateSuccCount} ({actualNegotiated > 0 ? Math.round((negotiateSuccCount / actualNegotiated) * 100) : 0}%)</strong>
              </div>
              <div className="p-1.5 rounded-lg bg-white-50/70">
                <span className="inline-block w-2 h-2 rounded-full bg-[#F43F5E] mr-1" />
                <span className="text-slate-600">ปฏิเสธ: </span>
                <strong className="text-rose-700 font-bold">{negotiateFailCount} ({actualNegotiated > 0 ? Math.round((negotiateFailCount / actualNegotiated) * 100) : 0}%)</strong>
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
