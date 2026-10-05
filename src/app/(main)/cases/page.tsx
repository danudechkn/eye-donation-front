"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  X,
  Filter,
  Ellipsis,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Popover, Button } from "@heroui/react";
import { api, useDonorCases, DonorCaseItem } from "@/hooks/useApi";

const getGender = (item: DonorCaseItem) => {
  const anyItem = item as unknown as Record<string, unknown>;
  const rawSex = anyItem.sex ?? anyItem.gender;
  if (rawSex === "1" || rawSex === 1 || rawSex === "M" || rawSex === "ชาย") return "ชาย";
  if (rawSex === "2" || rawSex === 2 || rawSex === "F" || rawSex === "หญิง") return "หญิง";
  const name = item.fullname || "";
  if (name.startsWith("นาย") || name.startsWith("ด.ช.")) return "ชาย";
  if (name.startsWith("นางสาว") || name.startsWith("น.ส.") || name.startsWith("นาง") || name.startsWith("ด.ญ.")) return "หญิง";
  return rawSex ? String(rawSex) : "-";
};

const getStorageStatus = (item: DonorCaseItem) => {
  const g = Number(item.geteye);
  if (g === 13 || g === 1) return "จัดเก็บได้";
  if (g === 14 || g === 2) return "จัดเก็บไม่ได้";
  return "-";
};

// Component ดวงตาที่ลูกตาดำเลื่อนกลอกซ้าย-ขวาได้จริง พร้อมกะพริบตา
const AnimatedPupilEyes = ({ className = "w-14 h-14 text-slate-400" }: { className?: string }) => (
  <svg viewBox="0 0 256 256" className={className} fill="currentColor">
    <defs>
      <clipPath id="left-eye-clip">
        <ellipse cx="80" cy="128" rx="38" ry="60" />
      </clipPath>
      <clipPath id="right-eye-clip">
        <ellipse cx="176" cy="128" rx="38" ry="60" />
      </clipPath>
    </defs>
    <g className="animate-blink">
      {/* ตาขาวซ้าย-ขวา */}
      <ellipse cx="80" cy="128" rx="38" ry="60" fill="#f8fafc" stroke="currentColor" strokeWidth="12" />
      <ellipse cx="176" cy="128" rx="38" ry="60" fill="#f8fafc" stroke="currentColor" strokeWidth="12" />

      {/* ลูกตาดำข้างซ้าย (เลื่อนมองซ้าย-ขวา) */}
      <g clipPath="url(#left-eye-clip)">
        <g className="animate-pupil">
          <circle cx="80" cy="128" r="20" fill="currentColor" />
          <circle cx="73" cy="120" r="6" fill="#ffffff" />
        </g>
      </g>

      {/* ลูกตาดำข้างขวา (เลื่อนมองซ้าย-ขวา) */}
      <g clipPath="url(#right-eye-clip)">
        <g className="animate-pupil">
          <circle cx="176" cy="128" r="20" fill="currentColor" />
          <circle cx="169" cy="120" r="6" fill="#ffffff" />
        </g>
      </g>
    </g>
  </svg>
);

export default function CasesIndexPage() {
  const router = useRouter();

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filterNegotiate, setFilterNegotiate] = useState<string>("all");
  const [filterStorage, setFilterStorage] = useState<string>("all");
  const [filterGender, setFilterGender] = useState<string>("all");

  // Pagination
  const [page, setPage] = useState<number>(1);
  const limit = 10;

  // Use custom hook
  const { cases, pagination, loading, error, refetch } = useDonorCases({
    search: searchTerm,
    page,
    limit,
  });
  const total = pagination?.total || 0;
  const totalPages = Math.max(1, pagination?.totalPages || Math.ceil(total / limit) || 1);

  // Delete Modal state
  const [deleteTarget, setDeleteTarget] = useState<DonorCaseItem | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [toastVisible, setToastVisible] = useState(false);

  // ควบคุม Animation เด้งลงมาแสดง และเด้งกลับขึ้นไปข้างบนก่อนหายไป
  useEffect(() => {
    if (!notification) {
      setToastVisible(false);
      return;
    }
    const enterTimer = setTimeout(() => {
      setToastVisible(true);
    }, 20);

    const exitTimer = setTimeout(() => {
      setToastVisible(false);
    }, 2600);

    const removeTimer = setTimeout(() => {
      setNotification(null);
    }, 3000);

    return () => {
      clearTimeout(enterTimer);
      clearTimeout(exitTimer);
      clearTimeout(removeTimer);
    };
  }, [notification]);

  const handleCloseNotification = () => {
    setToastVisible(false);
    setTimeout(() => {
      setNotification(null);
    }, 400);
  };

  // Handle Delete
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      await api.deleteCase(deleteTarget.id);
      setNotification({ type: "success", message: `ลบข้อมูลเคส HN: ${deleteTarget.hn} สำเร็จแล้ว` });
      setDeleteTarget(null);
      refetch();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "ไม่สามารถลบได้";
      setNotification({ type: "error", message: "เกิดข้อผิดพลาดในการลบ: " + msg });
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter client-side for additional tags
  const filteredCases = cases.filter((item) => {
    if (filterNegotiate === "success" && !(item.negotiate_succ === 1 || item.negotiate_succ === 11)) return false;
    if (filterNegotiate === "failed" && (item.negotiate_succ === 1 || item.negotiate_succ === 11)) return false;
    if (filterStorage === "stored") {
      const g = Number(item.geteye);
      if (g !== 13 && g !== 1) return false;
    }
    if (filterStorage === "not_stored") {
      const g = Number(item.geteye);
      if (g !== 14 && g !== 2) return false;
    }
    if (filterGender !== "all") {
      const g = getGender(item);
      if (filterGender === "male" && g !== "ชาย") return false;
      if (filterGender === "female" && g !== "หญิง") return false;
    }
    return true;
  });

  const activeFilterCount =
    (filterNegotiate !== "all" ? 1 : 0) +
    (filterStorage !== "all" ? 1 : 0) +
    (filterGender !== "all" ? 1 : 0);

  const handleResetFilters = () => {
    setFilterNegotiate("all");
    setFilterStorage("all");
    setFilterGender("all");
  };

  return (
    <div className="min-h-screen bg-slate-50/60 p-6 md:p-8">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <span>ทะเบียนเคสบริจาคดวงตา</span>
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            รายการเคสผู้เสียชีวิตและข้อมูลการประสานงานขอรับบริจาคดวงตา
          </p>
        </div>

        {/* Action Button: เพิ่มเคสใหม่ */}
        <div className="flex items-center gap-3">
          <Link
            href="/cases/form"
            className="inline-flex items-center gap-2 px-4 py-3 bg-[#29b6f6] hover:bg-[#0288d1] text-white font-semibold text-sm rounded-xl shadow-sm transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span className="text-base">บันทึกเคสใหม่</span>
          </Link>
        </div>
      </div>

      {/* ── Floating Pill Notification (Toast with Enter & Exit Spring Animation) ── */}
      {notification && (
        <div
          className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] ${toastVisible
            ? "opacity-100 translate-y-0 scale-100"
            : "opacity-0 -translate-y-8 scale-95 pointer-events-none"
            }`}
        >
          <div className="bg-white border border-slate-100 shadow-[0_10px_35px_rgba(0,0,0,0.08)] rounded-full px-5 py-2.5 sm:px-6 sm:py-3 flex items-center gap-3.5 min-w-[280px] sm:min-w-[340px] justify-between">
            <div className="flex items-center gap-3 truncate">
              {notification.type === "success" ? (
                <CheckCircle2 className="w-5 h-5 text-[#2e7d32] shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
              )}
              <span
                className={`text-sm font-medium tracking-tight truncate ${notification.type === "success" ? "text-[#1e5631]" : "text-rose-800"
                  }`}
              >
                {notification.message}
              </span>
            </div>
            <button
              type="button"
              onClick={handleCloseNotification}
              className="w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors shrink-0 ml-3 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}



      {/* Cases Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {/* Table Toolbar: Search (Left) & Filters (Right) */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white">
          {/* Search (Left) */}
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ค้นหา HN, ชื่อ-สกุล . . . "
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && refetch()}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
            />
          </div>

          {/* Filters (Right) */}
          <div className="flex items-center gap-2.5">
            <Popover>
              <Button
                className={`inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-xl border transition-all cursor-pointer ${activeFilterCount > 0
                  ? "bg-sky-50 border-sky-300 text-sky-700 shadow-xs"
                  : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                  }`}
                variant="outline"
              >
                <Filter className="w-4 h-4 text-slate-500" />
                <span>ตัวกรอง</span>
                {activeFilterCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-sky-600 text-white text-[11px] font-bold flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </Button>

              <Popover.Content className="w-72 p-4 shadow-xl border border-slate-200/90 rounded-2xl bg-white z-50" offset={8}>
                <Popover.Dialog className="outline-none focus:outline-none">
                  <Popover.Arrow />
                  <div className="flex flex-col gap-3.5">
                    {/* Header */}
                    <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-sky-600" />
                        <span className="font-semibold text-sm text-slate-800">ตัวกรองข้อมูล</span>
                      </div>
                      {activeFilterCount > 0 && (
                        <button
                          type="button"
                          onClick={handleResetFilters}
                          className="text-xs text-sky-600 hover:text-sky-700 font-semibold hover:underline cursor-pointer"
                        >
                          ล้างตัวกรอง
                        </button>
                      )}
                    </div>

                    {/* Filter 1: ผลเจรจา */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                        ผลเจรจา
                      </label>
                      <select
                        value={filterNegotiate}
                        onChange={(e) => setFilterNegotiate(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 font-medium cursor-pointer"
                      >
                        <option value="all">ทั้งหมด</option>
                        <option value="success">สำเร็จ</option>
                        <option value="failed">ไม่สำเร็จ</option>
                      </select>
                    </div>

                    {/* Filter: สถานะการจัดเก็บ */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                        สถานะการจัดเก็บ
                      </label>
                      <select
                        value={filterStorage}
                        onChange={(e) => setFilterStorage(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 font-medium cursor-pointer"
                      >
                        <option value="all">ทั้งหมด</option>
                        <option value="stored">จัดเก็บได้</option>
                        <option value="not_stored">จัดเก็บไม่ได้</option>
                      </select>
                    </div>
                    {/* Filter 3: เพศ */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                        เพศ
                      </label>
                      <select
                        value={filterGender}
                        onChange={(e) => setFilterGender(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 font-medium cursor-pointer"
                      >
                        <option value="all">ทั้งหมด</option>
                        <option value="male">ชาย</option>
                        <option value="female">หญิง</option>
                      </select>
                    </div>
                  </div>
                </Popover.Dialog>
              </Popover.Content>
            </Popover>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200/80 text-base font-bold text-slate-700">
                <th className="py-4 px-6 text-center">HN</th>
                <th className="py-4 px-6 text-center">ชื่อ-สกุล</th>
                <th className="py-4 px-6 text-center">เพศ</th>
                <th className="py-4 px-6 text-center">เลขบัตรประชาชน</th>
                <th className="py-4 px-6 text-center">ผลเจรจา</th>
                <th className="py-4 px-6 text-center">สถานะการจัดเก็บ</th>
                <th className="py-4 px-6 text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-base">
              {loading ? (
                <tr key="loading">
                  <td colSpan={7} className="py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-sky-600" />
                      <span className="text-base font-medium">กำลังโหลดข้อมูลเคส...</span>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr key="error">
                  <td colSpan={7} className="py-12 text-center text-rose-500 text-base">
                    <p className="font-semibold">{error}</p>
                    <button
                      onClick={() => refetch()}
                      className="mt-2 text-base text-sky-600 hover:underline font-semibold"
                    >
                      ลองใหม่อีกครั้ง
                    </button>
                  </td>
                </tr>
              ) : filteredCases.length === 0 ? (
                <tr key="empty">
                  <td colSpan={7} className="py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-14 h-14 flex items-center justify-center text-slate-400">
                        <AnimatedPupilEyes className="w-14 h-14" />
                      </div>
                      <p className="text-base font-semibold text-slate-700">ไม่พบข้อมูลเคสบริจาค</p>
                      <p className="text-base text-slate-400">
                        กดปุ่ม &quot;บันทึกเคสใหม่&quot; ด้านบนเพื่อเพิ่มข้อมูลเข้าระบบ
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCases.map((item, index) => {
                  const isNegotiateSucc = item.negotiate_succ === 1 || item.negotiate_succ === 11;

                  return (
                    <tr
                      key={`${item.id}-${index}`}
                      className="hover:bg-slate-50/80 transition-colors group text-base font-normal text-slate-700"
                    >
                      {/* 1. HN */}
                      <td className="py-4 px-6 text-center font-mono font-medium text-slate-700 text-sm">
                        <span className="inline-block px-2.5 py-1 bg-slate-100/90 rounded-lg text-slate-700 font-semibold">
                          {item.hn}
                        </span>
                      </td>

                      {/* 2. ชื่อ-สกุล */}
                      <td className="py-4 px-6 font-medium text-slate-800 text-base text-center">
                        {item.fullname || "ไม่ระบุชื่อ"}
                      </td>

                      {/* 3. เพศ */}
                      <td className="py-4 px-6 text-center">
                        {(() => {
                          const gender = getGender(item);
                          if (gender === "ชาย") {
                            return (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200/60">
                                ชาย
                              </span>
                            );
                          }
                          if (gender === "หญิง") {
                            return (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-pink-50 text-pink-700 border border-pink-200/60">
                                หญิง
                              </span>
                            );
                          }
                          return <span className="text-slate-500 text-sm">{gender}</span>;
                        })()}
                      </td>

                      {/* 4. เลขบัตรประชาชน */}
                      <td className="py-4 px-6 font-mono font-normal text-slate-600 text-sm text-center">
                        {item.cid || "-"}
                      </td>

                      {/* 5. ผลเจรจา */}
                      <td className="py-4 px-6 text-center">
                        {isNegotiateSucc ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>
                            สำเร็จ
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200/80 shadow-xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1.5"></span>
                            ไม่สำเร็จ
                          </span>
                        )}
                      </td>

                      {/* 6. สถานะการจัดเก็บ */}
                      <td className="py-4 px-6 text-center">
                        {(() => {
                          const status = getStorageStatus(item);
                          if (status === "จัดเก็บได้") {
                            return (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-cyan-50 text-cyan-700 border border-cyan-200/80 shadow-xs">
                                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 mr-1.5"></span>
                                จัดเก็บได้
                              </span>
                            );
                          }
                          if (status === "จัดเก็บไม่ได้") {
                            return (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200/80">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mr-1.5"></span>
                                จัดเก็บไม่ได้
                              </span>
                            );
                          }
                          return <span className="text-slate-400 text-sm">-</span>;
                        })()}
                      </td>

                      {/* 7. จัดการ (Popover Menu) */}
                      <td className="py-4 px-6 text-center">
                        <div className="inline-flex items-center justify-center">
                          <Popover>
                            <Button
                              isIconOnly
                              size="sm"
                              aria-label="More options"
                              variant="tertiary"
                              className="w-8 h-8 rounded-full text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                            >
                              <Ellipsis className="w-4 h-4" />
                            </Button>
                            <Popover.Content className="w-28 p-1 shadow-lg border border-slate-200/80 rounded-2xl bg-white z-50" offset={8}>
                              <Popover.Dialog className="outline-none focus:outline-none">
                                <Popover.Arrow />
                                <div className="flex flex-col gap-0.5">
                                  <button
                                    type="button"
                                    onClick={() => router.push(`/cases/form?id=${item.id}`)}
                                    className="px-3 py-1.5 text-sm font-medium text-slate-700 hover:text-sky-700 hover:bg-sky-50 rounded-xl transition-colors w-full text-left cursor-pointer"
                                  >
                                    Edit
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => setDeleteTarget(item)}
                                    className="px-3 py-1.5 text-sm font-medium text-slate-700 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors w-full text-left cursor-pointer"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </Popover.Dialog>
                            </Popover.Content>
                          </Popover>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-end text-sm text-slate-600 bg-slate-50/50">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                if (page > 1) setPage((p) => Math.max(1, p - 1));
              }}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${page <= 1
                ? "text-slate-300 opacity-40 cursor-default"
                : "text-[#29b6f6] hover:bg-[#29b6f6]/10 cursor-pointer"
                }`}
              aria-label="หน้าก่อนหน้า"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => {
                if (totalPages <= 7) return true;
                if (p === 1 || p === totalPages) return true;
                return Math.abs(p - page) <= 1;
              })
              .reduce<(number | string)[]>((acc, p, idx, arr) => {
                if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) {
                  acc.push("...");
                }
                acc.push(p);
                return acc;
              }, [])
              .map((p, idx) => {
                if (p === "...") {
                  return (
                    <span
                      key={`ellipsis-${idx}`}
                      className="w-8 h-8 flex items-center justify-center text-xs text-slate-400 cursor-default"
                    >
                      ...
                    </span>
                  );
                }
                const pageNum = p as number;
                const isActive = pageNum === page;
                return (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setPage(pageNum)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${isActive
                      ? "bg-[#29b6f6] text-white shadow-xs cursor-default"
                      : "text-slate-600 hover:text-[#29b6f6] hover:bg-[#29b6f6]/10 cursor-pointer"
                      }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

            <button
              type="button"
              onClick={() => {
                if (page < totalPages && filteredCases.length >= limit) {
                  setPage((p) => p + 1);
                }
              }}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${page >= totalPages || filteredCases.length < limit
                ? "text-slate-300 opacity-40 cursor-default"
                : "text-[#29b6f6] hover:bg-[#29b6f6]/10 cursor-pointer"
                }`}
              aria-label="หน้าถัดไป"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95">
            <h3 className="text-[24px] font-bold text-slate-900 text-center mb-1">
              ยืนยันการลบเคสบริจาค?
            </h3>
            <p className="text-xs text-slate-500 text-center mb-5 leading-relaxed">
              <strong className="text-slate-900 font-semibold text-lg">
                {deleteTarget.fullname} ( HN: {deleteTarget.hn} )
              </strong>
              <br />
            </p>

            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 font-semibold text-[20px] hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={confirmDelete}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-[20px] transition-colors shadow-md shadow-rose-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isDeleting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>ยืนยันลบข้อมูล</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
