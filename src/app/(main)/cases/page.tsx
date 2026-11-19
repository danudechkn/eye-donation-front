"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Filter,
  Ellipsis,
  ChevronLeft,
  ChevronRight,
  Send,
  Pencil,
  Trash2,
} from "lucide-react";
import { Popover, Button } from "@heroui/react";
import { api, useDonorCases, DonorCaseItem } from "@/hooks/useApi";
import { CustomSelect } from "@/components/CustomSelect";
import { Toast, useToast } from "@/components/Toast";
import { DeleteCaseModal } from "@/components/cases/DeleteCaseModal";
import { SendMophModal } from "@/components/cases/SendMophModal";
import {
  COMPLETENESS_FILTER_OPTIONS,
  GENDER_FILTER_OPTIONS,
  MOPH_FILTER_OPTIONS,
  NEGOTIATE_FILTER_OPTIONS,
  getGender,
  isNegotiateSuccess,
} from "@/lib/caseHelpers";

/** ไอคอนดวงตาสำหรับหน้าว่าง (Empty state) */
function AnimatedPupilEyes({
  className = "w-14 h-14 text-slate-400",
}: {
  className?: string;
}) {
  return (
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
        <ellipse cx="80" cy="128" rx="38" ry="60" fill="#f8fafc" stroke="currentColor" strokeWidth="12" />
        <ellipse cx="176" cy="128" rx="38" ry="60" fill="#f8fafc" stroke="currentColor" strokeWidth="12" />

        <g clipPath="url(#left-eye-clip)">
          <g className="animate-pupil">
            <circle cx="80" cy="128" r="20" fill="currentColor" />
            <circle cx="73" cy="120" r="6" fill="#ffffff" />
          </g>
        </g>

        <g clipPath="url(#right-eye-clip)">
          <g className="animate-pupil">
            <circle cx="176" cy="128" r="20" fill="currentColor" />
            <circle cx="169" cy="120" r="6" fill="#ffffff" />
          </g>
        </g>
      </g>
    </svg>
  );
}

const PAGE_LIMIT = 10;

export default function CasesIndexPage() {
  const router = useRouter();
  const { notification, visible: toastVisible, showToast, dismissToast } = useToast();

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filterNegotiate, setFilterNegotiate] = useState("all");
  const [filterCompleteness, setFilterCompleteness] = useState("all");
  const [filterGender, setFilterGender] = useState("all");
  const [filterMoph, setFilterMoph] = useState("all");
  const [page, setPage] = useState(1);

  const { cases, pagination, loading, error, refetch } = useDonorCases({
    search: searchTerm,
    page,
    limit: PAGE_LIMIT,
  });

  const total = pagination?.total || 0;
  const totalPages = Math.max(
    1,
    pagination?.totalPages || Math.ceil(total / PAGE_LIMIT) || 1,
  );

  // Modal states
  const [deleteTarget, setDeleteTarget] = useState<DonorCaseItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [sendMophTarget, setSendMophTarget] = useState<DonorCaseItem | null>(null);
  const [isSendingMoph, setIsSendingMoph] = useState(false);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      await api.deleteCase(deleteTarget.id);
      showToast("success", `ลบข้อมูลเคส HN: ${deleteTarget.hn} สำเร็จแล้ว`);
      setDeleteTarget(null);
      refetch();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "ไม่สามารถลบได้";
      showToast("error", "เกิดข้อผิดพลาดในการลบ: " + msg);
    } finally {
      setIsDeleting(false);
    }
  };

  const confirmSendMoph = async () => {
    if (!sendMophTarget) return;
    try {
      setIsSendingMoph(true);
      await api.sendToMoph(sendMophTarget.id);
      showToast(
        "success",
        `ส่งข้อมูลเคส HN: ${sendMophTarget.hn} ไปยังระบบ สธ. (MOPH) สำเร็จแล้ว`,
      );
      setSendMophTarget(null);
      refetch();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการส่งข้อมูล";
      showToast("error", `ไม่สามารถส่งข้อมูลไป MOPH ได้: ${msg}`);
    } finally {
      setIsSendingMoph(false);
    }
  };

  // Client-side tag filtering
  const filteredCases = cases.filter((item) => {
    const negotiateOk = isNegotiateSuccess(item.negotiate_succ);
    if (filterNegotiate === "success" && !negotiateOk) return false;
    if (filterNegotiate === "failed" && negotiateOk) return false;
    if (filterCompleteness === "complete" && item.is_complete !== 1) return false;
    if (filterCompleteness === "incomplete" && item.is_complete === 1) return false;
    if (filterGender !== "all") {
      const gender = getGender(item);
      if (filterGender === "male" && gender !== "ชาย") return false;
      if (filterGender === "female" && gender !== "หญิง") return false;
    }
    if (filterMoph === "pending" && item.status === 2) return false;
    if (filterMoph === "sent" && item.status !== 2) return false;
    return true;
  });

  const activeFilterCount =
    (filterNegotiate !== "all" ? 1 : 0) +
    (filterCompleteness !== "all" ? 1 : 0) +
    (filterGender !== "all" ? 1 : 0) +
    (filterMoph !== "all" ? 1 : 0);

  const handleResetFilters = () => {
    setFilterNegotiate("all");
    setFilterCompleteness("all");
    setFilterGender("all");
    setFilterMoph("all");
  };

  const pageItems = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter((p) => {
      if (totalPages <= 7) return true;
      if (p === 1 || p === totalPages) return true;
      return Math.abs(p - page) <= 1;
    })
    .reduce<(number | string)[]>((acc, p, idx, arr) => {
      if (idx > 0 && p - arr[idx - 1] > 1) acc.push("...");
      acc.push(p);
      return acc;
    }, []);

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

      <Toast notification={notification} visible={toastVisible} onClose={dismissToast} />

      {/* Cases Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white">
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

          <div className="flex items-center gap-2.5">
            <Popover>
              <Button
                className={`inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-xl border transition-all cursor-pointer ${
                  activeFilterCount > 0
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
                    <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-sky-600" />
                        <span className="font-semibold text-sm text-slate-800">
                          ตัวกรองข้อมูล
                        </span>
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

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                        ผลเจรจา
                      </label>
                      <CustomSelect
                        value={filterNegotiate}
                        onChange={setFilterNegotiate}
                        options={NEGOTIATE_FILTER_OPTIONS}
                        popoverClassName="z-[80]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                        สถานะข้อมูล
                      </label>
                      <CustomSelect
                        value={filterCompleteness}
                        onChange={setFilterCompleteness}
                        options={COMPLETENESS_FILTER_OPTIONS}
                        popoverClassName="z-[80]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                        เพศ
                      </label>
                      <CustomSelect
                        value={filterGender}
                        onChange={setFilterGender}
                        options={GENDER_FILTER_OPTIONS}
                        popoverClassName="z-[80]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                        สถานะส่ง สธ. (MOPH)
                      </label>
                      <CustomSelect
                        value={filterMoph}
                        onChange={setFilterMoph}
                        options={MOPH_FILTER_OPTIONS}
                        popoverClassName="z-[80]"
                      />
                    </div>
                  </div>
                </Popover.Dialog>
              </Popover.Content>
            </Popover>
          </div>
        </div>

        {/* Table Body */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200/80 text-base font-bold text-slate-700">
                <th className="py-4 px-6 text-center">HN</th>
                <th className="py-4 px-6 text-center">ชื่อ-สกุล</th>
                <th className="py-4 px-6 text-center">เพศ</th>
                <th className="py-4 px-6 text-center">เลขบัตรประชาชน</th>
                <th className="py-4 px-6 text-center">ผลเจรจา</th>
                <th className="py-4 px-6 text-center">สถานะข้อมูล</th>
                <th className="py-4 px-6 text-center">ส่ง สธ. (MOPH)</th>
                <th className="py-4 px-6 text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-base">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-sky-600" />
                      <span className="text-base font-medium">กำลังโหลดข้อมูลเคส...</span>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-rose-500 text-base">
                    <p className="font-semibold">{error}</p>
                    <button
                      type="button"
                      onClick={() => refetch()}
                      className="mt-2 text-base text-sky-600 hover:underline font-semibold cursor-pointer"
                    >
                      ลองใหม่อีกครั้ง
                    </button>
                  </td>
                </tr>
              ) : filteredCases.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-14 h-14 flex items-center justify-center text-slate-400">
                        <AnimatedPupilEyes className="w-14 h-14" />
                      </div>
                      <p className="text-base font-semibold text-slate-700">
                        ไม่พบข้อมูลเคสบริจาค
                      </p>
                      <p className="text-base text-slate-400">
                        กดปุ่ม &quot;บันทึกเคสใหม่&quot; ด้านบนเพื่อเพิ่มข้อมูลเข้าระบบ
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCases.map((item, index) => {
                  const negotiateOk = isNegotiateSuccess(item.negotiate_succ);
                  const gender = getGender(item);

                  return (
                    <tr
                      key={`${item.id}-${index}`}
                      className="hover:bg-slate-50/80 transition-colors group text-base font-normal text-slate-700"
                    >
                      <td className="py-4 px-6 text-center font-mono font-medium text-slate-700 text-sm">
                        <span className="inline-block px-2.5 py-1 bg-slate-100/90 rounded-lg text-slate-700 font-semibold">
                          {item.hn}
                        </span>
                      </td>

                      <td className="py-4 px-6 font-medium text-slate-800 text-base text-center">
                        {item.fullname || "ไม่ระบุชื่อ"}
                      </td>

                      <td className="py-4 px-6 text-center">
                        {gender === "ชาย" ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200/60">
                            ชาย
                          </span>
                        ) : gender === "หญิง" ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-pink-50 text-pink-700 border border-pink-200/60">
                            หญิง
                          </span>
                        ) : (
                          <span className="text-slate-500 text-sm">{gender}</span>
                        )}
                      </td>

                      <td className="py-4 px-6 font-mono font-normal text-slate-600 text-sm text-center">
                        {item.cid || "-"}
                      </td>

                      <td className="py-4 px-6 text-center">
                        {negotiateOk ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
                            สำเร็จ
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200/80 shadow-xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1.5" />
                            ไม่สำเร็จ
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-6 text-center">
                        {item.is_complete === 1 ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-xs">
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                            ข้อมูลครบ
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200/80 shadow-xs cursor-help"
                            title={
                              item.missing_fields && item.missing_fields.length > 0
                                ? `ข้อมูลยังไม่ครบ: ${item.missing_fields.join(", ")}`
                                : "ข้อมูลยังไม่ครบถ้วน"
                            }
                          >
                            <AlertCircle className="w-3.5 h-3.5 mr-1.5 text-rose-500" />
                            ข้อมูลไม่ครบ
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-6 text-center">
                        {item.status === 2 ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-xs">
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                            ส่งแล้ว
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/80">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5 animate-pulse" />
                            ยังไม่ส่ง
                          </span>
                        )}
                      </td>

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
                            <Popover.Content className="w-52 p-1.5 shadow-xl border border-slate-200/90 rounded-2xl bg-white z-50" offset={8}>
                              <Popover.Dialog className="outline-none focus:outline-none">
                                <Popover.Arrow />
                                <div className="flex flex-col gap-1">
                                  {item.is_complete !== 1 ? (
                                    <button
                                      type="button"
                                      disabled
                                      title={
                                        item.missing_fields && item.missing_fields.length > 0
                                          ? `ข้อมูลยังไม่ครบถ้วน (ขาด: ${item.missing_fields.join(", ")})`
                                          : "ข้อมูลยังไม่ครบถ้วน ไม่สามารถส่งได้"
                                      }
                                      className="w-full px-3 py-2 text-xs font-medium text-slate-400 bg-transparent rounded-xl cursor-not-allowed flex items-center justify-between opacity-60 select-none text-left"
                                    >
                                      <div className="flex items-center gap-2.5 min-w-0">
                                        <Send className="w-4 h-4 text-slate-400 shrink-0" />
                                        <span className="whitespace-nowrap">ส่งข้อมูลไป MOPH</span>
                                      </div>
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => setSendMophTarget(item)}
                                      className="group w-full px-3 py-2 text-xs font-medium text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition-colors text-left cursor-pointer flex items-center gap-2.5 active:scale-[0.98]"
                                    >
                                      <Send className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-colors shrink-0" />
                                      <span className="whitespace-nowrap">
                                        {item.status === 2 ? "ส่ง สธ. ซ้ำ" : "ส่งข้อมูลไป MOPH"}
                                      </span>
                                    </button>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() => router.push(`/cases/form?id=${item.id}`)}
                                    className="group w-full px-3 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100/80 rounded-xl transition-colors text-left cursor-pointer flex items-center gap-2.5"
                                  >
                                    <Pencil className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors shrink-0" />
                                    <span className="whitespace-nowrap">แก้ไขข้อมูล</span>
                                  </button>

                                  <div className="my-0.5 border-t border-slate-100" />

                                  <button
                                    type="button"
                                    onClick={() => setDeleteTarget(item)}
                                    className="group w-full px-3 py-2 text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors text-left cursor-pointer flex items-center gap-2.5"
                                  >
                                    <Trash2 className="w-4 h-4 text-rose-400 group-hover:text-rose-600 transition-colors shrink-0" />
                                    <span className="whitespace-nowrap">ลบเคส</span>
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
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                page <= 1
                  ? "text-slate-300 opacity-40 cursor-default"
                  : "text-[#29b6f6] hover:bg-[#29b6f6]/10 cursor-pointer"
              }`}
              aria-label="หน้าก่อนหน้า"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {pageItems.map((p, idx) => {
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
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                    isActive
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
                if (page < totalPages && filteredCases.length >= PAGE_LIMIT) {
                  setPage((p) => p + 1);
                }
              }}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                page >= totalPages || filteredCases.length < PAGE_LIMIT
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

      <DeleteCaseModal
        target={deleteTarget}
        isDeleting={isDeleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />

      <SendMophModal
        key={sendMophTarget?.id ?? "none"}
        target={sendMophTarget}
        isSending={isSendingMoph}
        onClose={() => setSendMophTarget(null)}
        onConfirm={confirmSendMoph}
        onEditCase={(id) => router.push(`/cases/form?id=${id}`)}
      />
    </div>
  );
}
