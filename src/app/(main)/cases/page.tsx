"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { api, useDonorCases, DonorCaseItem } from "@/hooks/useApi";
import { useCaseRealtime } from "@/hooks/useRealtime";
import { Toast, useToast } from "@/components/ui/Toast";
import { CasesToolbar } from "@/components/cases/CasesToolbar";
import { CasesTable } from "@/components/cases/CasesTable";
import { CasesPagination } from "@/components/cases/CasesPagination";
import { DeleteCaseModal } from "@/components/cases/DeleteCaseModal";
import { SendMophModal } from "@/components/cases/SendMophModal";
import { getGender, isNegotiateSuccess } from "@/lib/caseHelpers";

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

  // อัปเดตตารางอัตโนมัติแบบ Real-time เมื่อมีเครื่องอื่นเพิ่ม/แก้/ลบ/ส่ง MOPH
  useCaseRealtime(() => {
    refetch();
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

      {/* Cases Data Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <CasesToolbar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onSearchSubmit={refetch}
          filterNegotiate={filterNegotiate}
          onFilterNegotiateChange={setFilterNegotiate}
          filterCompleteness={filterCompleteness}
          onFilterCompletenessChange={setFilterCompleteness}
          filterGender={filterGender}
          onFilterGenderChange={setFilterGender}
          filterMoph={filterMoph}
          onFilterMophChange={setFilterMoph}
          activeFilterCount={activeFilterCount}
          onResetFilters={handleResetFilters}
        />

        <CasesTable
          cases={filteredCases}
          loading={loading}
          error={error}
          onRetry={refetch}
          onSendMoph={setSendMophTarget}
          onEdit={(id) => router.push(`/cases/form?id=${id}`)}
          onDelete={setDeleteTarget}
        />

        <CasesPagination
          page={page}
          totalPages={totalPages}
          canGoNext={page < totalPages && filteredCases.length >= PAGE_LIMIT}
          onPageChange={setPage}
        />
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
