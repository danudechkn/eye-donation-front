"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Search,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  X,
} from "lucide-react";
import { api, DonorCasePayload } from "@/hooks/useApi";
import { Select, ListBox } from "@heroui/react";

const CustomSelect = ({
  value,
  onChange,
  options,
  placeholder = "-- เลือก --",
}: {
  value?: number | null;
  onChange: (val: number) => void;
  options: { value: number; label: string }[];
  placeholder?: string;
}) => (
  <Select
    aria-label="Select option"
    placeholder={placeholder}
    selectedKey={value != null && value !== 0 ? value.toString() : null}
    onSelectionChange={(key) => {
      if (key) onChange(Number(key));
    }}
  >
    <Select.Trigger className="h-11 px-5 bg-white border border-slate-200/90 rounded-full data-[focus=true]:border-sky-400 data-[focus=true]:ring-2 data-[focus=true]:ring-sky-100 shadow-none data-[hover=true]:bg-slate-50 transition-all w-full flex items-center justify-between">
      <Select.Value className="text-sm font-medium text-slate-700 data-[placeholder]:text-slate-400 group-data-[has-value=true]:text-slate-700" />
    </Select.Trigger>
    <Select.Popover>
      <ListBox>
        {options.map((opt: any) => (
          <ListBox.Item key={opt.value.toString()} id={opt.value.toString()} textValue={opt.label}>
            {opt.label}
          </ListBox.Item>
        ))}
      </ListBox>
    </Select.Popover>
  </Select>
);

const formatToLocalDateTimeInput = (d: Date = new Date()) => {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

function DonorCaseFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");
  const isEditMode = Boolean(editId);


  const [pageLoading, setPageLoading] = useState(isEditMode);
  const [searchingPatient, setSearchingPatient] = useState(false);
  const [submitting, setSubmitting] = useState(false);
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

  // ── Form State ────────────────────────────────────────────────────────────
  const [searchHn, setSearchHn] = useState("");
  const [fullname, setFullname] = useState("");
  const [hn, setHn] = useState("");
  const [cid, setCid] = useState("");
  const [deathtext, setDeathtext] = useState("");
  const [icd10, setIcd10] = useState("");
  const [potential, setPotential] = useState(1);
  const [braincardiac, setBraincardiac] = useState<number | null>(null);
  const [negotiate, setNegotiate] = useState(1);
  const [chkpotential, setChkpotential] = useState(1);
  const [negotiate_succ, setNegotiate_succ] = useState(1);
  const [commentnonego, setCommentnonego] = useState("");
  const [geteye, setGeteye] = useState(1);
  const [eyetotal, setEyetotal] = useState(2);
  const [commentnoget, setCommentnoget] = useState("");
  const [negotiate_staff, setNegotiate_staff] = useState("");
  const [geteye_staff, setGeteye_staff] = useState("");

  // Part 2 fields
  const [wardtotc, setWardtotc] = useState(1);
  const [commentnonchk, setCommentnonchk] = useState("");
  const [firststaff, setFirststaff] = useState("");
  const [firsttime, setFirsttime] = useState(() => (isEditMode ? "" : formatToLocalDateTimeInput()));

  // ── Load on Edit ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!editId) return;
    async function load() {
      try {
        setPageLoading(true);
        const res = await api.getCaseById(editId as string);
        if (res.success && res.data) {
          const d = res.data;
          setHn(d.hn || "");
          setFullname(d.fullname || "");
          setCid(d.cid || "");
          setDeathtext(d.deathtext || "");
          setIcd10(d.icd10 || "");
          setBraincardiac(d.braincardiac != null ? Number(d.braincardiac) : null);
          setPotential(Number(d.potential) || 1);
          setChkpotential(Number(d.chkpotential) || 1);
          setCommentnonchk(d.commentnonchk || "");
          setWardtotc(Number(d.wardtotc) || 1);
          setNegotiate(Number(d.negotiate) || 1);
          setNegotiate_succ(d.negotiate_succ != null ? Number(d.negotiate_succ) : 1);
          setCommentnonego(d.commentnonnego || "");
          setNegotiate_staff(d.negotiate_staff || "");
          setGeteye(Number(d.geteye) || 1);
          setEyetotal(Number(d.eyetotal) ?? 2);
          setCommentnoget(d.commentnoget || "");
          setGeteye_staff(d.geteye_staff || "");
          setFirststaff(d.firststaff || "");
          const ft = d.fristtime || (d as unknown as { firsttime?: string }).firsttime;
          if (ft) {
            const parsed = new Date(ft);
            if (!isNaN(parsed.getTime())) {
              setFirsttime(formatToLocalDateTimeInput(parsed));
            }
          }
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "";
        setNotification({ type: "error", message: "โหลดข้อมูลเดิมไม่ได้: " + msg });
      } finally {
        setPageLoading(false);
      }
    }
    load();
  }, [editId]);

  // ── Search HIS Patient ────────────────────────────────────────────────────
  const handleSearchPatient = async (targetHn?: string) => {
    const queryHn = (targetHn ?? searchHn ?? hn).trim();
    if (!queryHn) {
      setNotification({ type: "error", message: "กรุณาระบุเลข HN ในช่องค้นหาก่อน" });
      return;
    }
    try {
      setSearchingPatient(true);
      setNotification(null);
      const res = await api.searchPatient(queryHn);
      if (res.success && res.data) {
        const p = (Array.isArray(res.data) ? res.data[0] : res.data) as Record<string, unknown>;
        const name = [p.prename, p.firstname, p.lastname].filter(Boolean).join(" ");
        const foundHn = String(p.hn || queryHn);
        setHn(foundHn);
        setSearchHn(foundHn);
        setFullname(String(p.fullname || name || "พบข้อมูลผู้ป่วย"));
        if (p.cid || p.citizencardno) setCid(String(p.cid || p.citizencardno));
        if (p.deathtext || p.diagdetail) setDeathtext(String(p.deathtext || p.diagdetail));
        if (p.icd10 || p.icdcode) setIcd10(String(p.icd10 || p.icdcode));
        if (p.braincardiac) setBraincardiac(Number(p.braincardiac));
        setNotification({ type: "success", message: `พบข้อมูลผู้ป่วย: ${p.fullname || name || foundHn}` });
        setTimeout(() => setNotification(null), 3000);
      } else {
        setNotification({ type: "error", message: `ไม่พบข้อมูลผู้ป่วย HN: ${queryHn} ในระบบ HIS` });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "เกิดข้อผิดพลาด";
      setNotification({ type: "error", message: "ค้นหาไม่สำเร็จ: " + msg });
    } finally {
      setSearchingPatient(false);
    }
  };

  // ── Save Case ─────────────────────────────────────────────────────────────
  const handleSaveCase = async () => {
    // ตรวจสอบ HN
    if (!hn.trim()) {
      setNotification({
        type: "error",
        message: "กรุณาระบุเลข HN ผู้ป่วยก่อนบันทึกข้อมูล",
      });
      return;
    }

    // ตรวจสอบฟิลด์ที่ต้องห้ามว่าง (Nullable = NO)
    const missingFields: string[] = [];
    if (!hn.trim()) missingFields.push("เลข HN");
    if (braincardiac === null || braincardiac === undefined) missingFields.push("braincardiac (ประเภทการเสียชีวิต)");
    if (potential === null || potential === undefined) missingFields.push("potential");
    if (chkpotential === null || chkpotential === undefined) missingFields.push("chkpotential");
    if (wardtotc === null || wardtotc === undefined) missingFields.push("หอผู้ป่วยแจ้ง TC (wardtotc)");
    if (negotiate === null || negotiate === undefined) missingFields.push("negotiate");
    if (geteye === null || geteye === undefined) missingFields.push("geteye");
    if (eyetotal === null || eyetotal === undefined) missingFields.push("eyetotal");

    if (missingFields.length > 0) {
      setNotification({
        type: "error",
        message: `กรอกข้อมูลไม่ครบ (จำเป็นต้องระบุ): ${missingFields.join(", ")}`
      });
      return;
    }
    try {
      setSubmitting(true);
      setNotification(null);
      const payload: DonorCasePayload = {
        hn: hn.trim(),
        fullname: fullname.trim() || undefined,
        cid: cid.trim() || undefined,
        deathtext: deathtext.trim() || null,
        icd10: icd10.trim() || null,
        braincardiac: braincardiac as number,
        potential,
        chkpotential,
        commentnonchk: commentnonchk.trim() || null,
        wardtotc,
        negotiate,
        negotiate_succ,
        commentnonego: commentnonego.trim() || null,
        commentnonnego: commentnonego.trim() || null,
        geteye,
        eyetotal,
        commentnoget: commentnoget.trim() || null,
        negotiate_staff: negotiate_staff.trim() || null,
        geteye_staff: geteye_staff.trim() || null,
        firststaff: firststaff.trim() || "-",
        firsttime: firsttime ? new Date(firsttime).toISOString() : null,
      };

      if (isEditMode) {
        await api.updateCase(editId as string, payload);
        setNotification({ type: "success", message: "Case updated successfully" });
      } else {
        await api.createCase(payload);
        setNotification({ type: "success", message: "Case created successfully" });
      }
      setTimeout(() => router.push("/cases"), 1200);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการบันทึก";
      setNotification({ type: "error", message: msg });
    } finally {
      setSubmitting(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin text-sky-400" />
          <p className="text-sm font-medium">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  const pillInputCls =
    "w-full h-11 px-5 bg-white border border-slate-200/90 rounded-full text-sm font-medium text-slate-700 placeholder:text-slate-300 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 transition-all";

  return (
    <div className="min-h-screen bg-[#f8fafc] px-4 sm:px-6 md:px-10 py-6 md:py-8">
      <div className="w-full space-y-4">
        {/* ── Breadcrumb / Back Link ── */}
        <div className="flex items-center justify-between">
          <Link
            href="/cases"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>กลับหน้ารายการเคสบริจาค</span>
          </Link>
          <span className="text-xs text-slate-400 font-medium">
            {isEditMode ? `แก้ไขเคส #${editId}` : "เพิ่มเคสบริจาคดวงตา"}
          </span>
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
                className="w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors shrink-0 ml-3"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* ── Form Card ── */}
        <div className="w-full">
          <div className="bg-white rounded-[32px] border border-slate-200/90 shadow-[0_4px_24px_rgba(0,0,0,0.02)] p-6 sm:p-8 md:p-10 space-y-5">
            {/* ═════════════════════════ FORM FIELDS ═════════════════════════ */}
            <div className="space-y-4 md:space-y-5 animate-in fade-in duration-200">
              {/* Search HN Bar (ช่องค้นหา HN จากระบบ HIS) */}
              {!isEditMode && (
                <div className="flex justify-end space-y-2">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={searchHn}
                        onChange={(e) => setSearchHn(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleSearchPatient();
                          }
                        }}
                        placeholder="กรอกเลข HN เพื่อดึงข้อมูล"
                        className="w-full h-11 px-5 bg-white border border-slate-200/90 rounded-full text-sm font-medium text-slate-700 placeholder:text-slate-300 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 transition-all"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSearchPatient()}
                      disabled={searchingPatient}
                      className="px-6 py-2.5 bg-[#29b6f6] hover:bg-[#0288d1] text-white rounded-full text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-sm shrink-0 disabled:opacity-50 active:scale-[0.98]"
                    >
                      {searchingPatient ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Search className="w-4 h-4" />
                      )}
                      <span>ดึงข้อมูล</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Row 1: HN, CID, ชื่อ-สกุล */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                <div>
                  <label className="block text-xs md:text-sm font-semibold text-slate-400 mb-1.5 pl-1">
                    HN <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={hn}
                    onChange={(e) => setHn(e.target.value)}
                    placeholder="เช่น 66012345"
                    disabled={isEditMode}
                    className={pillInputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs md:text-sm font-semibold text-slate-400 mb-1.5 pl-1">
                    เลขบัตรประชาชน (CID)
                  </label>
                  <input
                    type="text"
                    value={cid}
                    onChange={(e) => setCid(e.target.value)}
                    placeholder="13 หลัก"
                    className={pillInputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs md:text-sm font-semibold text-slate-400 mb-1.5 pl-1">
                    ชื่อ-สกุล
                  </label>
                  <input
                    type="text"
                    value={fullname}
                    onChange={(e) => setFullname(e.target.value)}
                    placeholder="ชื่อ-สกุล ผู้ป่วย"
                    className={pillInputCls}
                  />
                </div>
              </div>

              {/* Row 2: สาเหตุการเสียชีวิต (50%) & icd10 (50%) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div>
                  <label className="block text-xs md:text-sm font-semibold text-slate-400 mb-1.5 pl-1">
                    สาเหตุการเสียชีวิต
                  </label>
                  <input
                    type="text"
                    value={deathtext}
                    onChange={(e) => setDeathtext(e.target.value)}
                    placeholder="ระบุสาเหตุการเสียชีวิต"
                    className={pillInputCls}
                  />
                </div>

                <div>
                  <label className="block text-xs md:text-sm font-semibold text-slate-400 mb-1.5 pl-1">
                    icd10
                  </label>
                  <input
                    type="text"
                    value={icd10}
                    onChange={(e) => setIcd10(e.target.value)}
                    placeholder="เช่น I21.9, I61.9"
                    className={pillInputCls}
                  />
                </div>
              </div>
              {/* Row 3: braincardiac (25%) | potential (25%) | chkpotential (25%) | wardtotc (25%) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
                <div>
                  <label className="block text-xs md:text-sm font-semibold text-slate-400 mb-1.5 pl-1">
                    braincardiac <span className="text-rose-500">*</span>
                  </label>
                  <CustomSelect
                    value={braincardiac}
                    onChange={setBraincardiac}
                    placeholder="-- เลือกประเภทการเสียชีวิต --"
                    options={[
                      { value: 1, label: "Brain Death" },
                      { value: 2, label: "Cardiac Death" },
                    ]}
                  />
                </div>

                <div>
                  <label className="block text-xs md:text-sm font-semibold text-slate-400 mb-1.5 pl-1">
                    potential <span className="text-rose-500">*</span>
                  </label>
                  <CustomSelect
                    value={potential}
                    onChange={setPotential}
                    options={[
                      { value: 3, label: "Yes" },
                      { value: 4, label: "No" },
                    ]}
                  />
                </div>

                <div>
                  <label className="block text-xs md:text-sm font-semibold text-slate-400 mb-1.5 pl-1">
                    chkpotential <span className="text-rose-500">*</span>
                  </label>
                  <CustomSelect
                    value={chkpotential}
                    onChange={setChkpotential}
                    options={[
                      { value: 5, label: "Evaluated" },
                      { value: 6, label: "Not Evaluated" },
                    ]}
                  />
                </div>

                <div>
                  <label className="block text-xs md:text-sm font-semibold text-slate-400 mb-1.5 pl-1">
                    หอผู้ป่วยแจ้ง TC (wardtotc) <span className="text-rose-500">*</span>
                  </label>
                  <CustomSelect
                    value={wardtotc}
                    onChange={setWardtotc}
                    options={[
                      { value: 7, label: "แจ้ง TC แล้ว" },
                      { value: 8, label: "ไม่ได้แจ้ง" },
                    ]}
                  />
                </div>
              </div>

              {/* Row 3.1: เหตุผลที่ไม่ได้ประเมิน (Full width) */}
              <div>
                <label className="block text-xs md:text-sm font-semibold text-slate-400 mb-1.5 pl-1">
                  เหตุผลที่ไม่ได้ประเมิน (commentnonchk)
                </label>
                <input
                  type="text"
                  value={commentnonchk}
                  onChange={(e) => setCommentnonchk(e.target.value)}
                  placeholder="ระบุเหตุผล เช่น เสียชีวิตก่อนทีมเข้าถึง..."
                  className={pillInputCls}
                />
              </div>

              {/* Row 4: negotiate (25%) | negotiate_succ (25%) | commentnonego (50%) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
                <div>
                  <label className="block text-xs md:text-sm font-semibold text-slate-400 mb-1.5 pl-1">
                    negotiate <span className="text-rose-500">*</span>
                  </label>
                  <CustomSelect
                    value={negotiate}
                    onChange={setNegotiate}
                    options={[
                      { value: 9, label: "เจรจาแล้ว" },
                      { value: 10, label: "ยังไม่เจรจา" },
                    ]}
                  />
                </div>

                <div>
                  <label className="block text-xs md:text-sm font-semibold text-slate-400 mb-1.5 pl-1">
                    negotiate_succ
                  </label>
                  <CustomSelect
                    value={negotiate_succ}
                    onChange={(val) => {
                      setNegotiate_succ(val);
                      if (val === 12 || val === 2) {
                        setGeteye(14); // ถ้าเจรจาไม่สำเร็จ ให้ปรับเป็นจัดเก็บไม่ได้อัตโนมัติ
                        setEyetotal(15); // และจำนวนดวงตาเป็นไม่ได้เก็บ
                      }
                    }}
                    options={[
                      { value: 11, label: "สำเร็จ" },
                      { value: 12, label: "ไม่สำเร็จ" },
                    ]}
                  />
                </div>

                <div className="sm:col-span-2 md:col-span-2">
                  <label className="block text-xs md:text-sm font-semibold text-slate-400 mb-1.5 pl-1">
                    commentnonego
                  </label>
                  <input
                    type="text"
                    value={commentnonego}
                    onChange={(e) => setCommentnonego(e.target.value)}
                    placeholder="ระบุสาเหตุหรือหมายเหตุการเจรจา..."
                    className={pillInputCls}
                  />
                </div>
              </div>

              {/* Row 5: geteye (25%) & geteye (eyetotal 25%) & commetnonnego (50%) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
                <div className="md:col-span-1">
                  <label className="block text-xs md:text-sm font-semibold text-slate-400 mb-1.5 pl-1">
                    geteye <span className="text-rose-500">*</span>
                  </label>
                  <CustomSelect
                    value={geteye}
                    onChange={setGeteye}
                    options={[
                      { value: 13, label: "จัดเก็บได้" },
                      { value: 14, label: "จัดเก็บไม่ได้" },
                    ]}
                  />
                </div>

                <div className="md:col-span-1">
                  <label className="block text-xs md:text-sm font-semibold text-slate-400 mb-1.5 pl-1">
                    eyetotal <span className="text-rose-500">*</span>
                  </label>
                  <CustomSelect
                    value={eyetotal}
                    onChange={setEyetotal}
                    options={[
                      { value: 15, label: "ไม่ได้เก็บ" },
                      { value: 16, label: "1 ดวง" },
                      { value: 17, label: "2 ดวง" },
                    ]}
                  />
                </div>

                <div className="sm:col-span-2 md:col-span-2">
                  <label className="block text-xs md:text-sm font-semibold text-slate-400 mb-1.5 pl-1">
                    commetnonnego
                  </label>
                  <input
                    type="text"
                    value={commentnoget}
                    onChange={(e) => setCommentnoget(e.target.value)}
                    placeholder="ระบุสาเหตุที่จัดเก็บไม่ได้..."
                    className={pillInputCls}
                  />
                </div>
              </div>

              {/* Row 6: negotiate_staff (50%) & geteye_staff (50%) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div>
                  <label className="block text-xs md:text-sm font-semibold text-slate-400 mb-1.5 pl-1">
                    negotiate_staff
                  </label>
                  <input
                    type="text"
                    value={negotiate_staff}
                    onChange={(e) => setNegotiate_staff(e.target.value)}
                    placeholder="ชื่อ-สกุล เจ้าหน้าที่ผู้เจรจา"
                    className={pillInputCls}
                  />
                </div>

                <div>
                  <label className="block text-xs md:text-sm font-semibold text-slate-400 mb-1.5 pl-1">
                    geteye_staff
                  </label>
                  <input
                    type="text"
                    value={geteye_staff}
                    onChange={(e) => setGeteye_staff(e.target.value)}
                    placeholder="ชื่อ-สกุล แพทย์/เจ้าหน้าที่ผู้จัดเก็บ"
                    className={pillInputCls}
                  />
                </div>
              </div>

              {/* Row 7: firststaff (50%) & firsttime (50%) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div>
                  <label className="block text-xs md:text-sm font-semibold text-slate-400 mb-1.5 pl-1">
                    ชื่อผู้บันทึกแรกรับ (firststaff)
                  </label>
                  <input
                    type="text"
                    value={firststaff}
                    onChange={(e) => setFirststaff(e.target.value)}
                    placeholder="ระบุชื่อเจ้าหน้าที่ผู้รับเรื่องแรกรับ"
                    className={`${pillInputCls}${!firststaff.trim() ? " border-rose-300 focus:border-rose-400 focus:ring-rose-100" : ""}`}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5 pl-1">
                    <label className="block text-xs md:text-sm font-semibold text-slate-400">
                      วันและเวลาแรกรับ
                    </label>
                    <button
                      type="button"
                      onClick={() => setFirsttime(formatToLocalDateTimeInput())}
                      className="text-[11px] text-sky-500 hover:text-sky-600 font-medium hover:underline transition-colors"
                    >
                      ใช้วันเวลาปัจจุบัน
                    </button>
                  </div>
                  <input
                    type="datetime-local"
                    value={firsttime}
                    onChange={(e) => setFirsttime(e.target.value)}
                    className={pillInputCls}
                  />
                </div>
              </div>
            </div>
            {/* ── Footer Actions ── */}
            <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-end gap-4">
              <button
                type="button"
                onClick={() => router.push("/cases")}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full text-sm font-semibold transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>ยกเลิก</span>
              </button>

              <button
                type="button"
                disabled={submitting}
                onClick={handleSaveCase}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-2.5 bg-[#29b6f6] hover:bg-[#0288d1] text-white rounded-full text-sm font-semibold shadow-sm transition-all disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>กำลังบันทึก...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 " />
                    <span>{isEditMode ? "บันทึกการแก้ไข" : "บันทึกข้อมูล"}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DonorCaseFormPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
          <div className="flex flex-col items-center gap-3 text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin text-sky-400" />
            <p className="text-sm font-medium">กำลังโหลดฟอร์ม...</p>
          </div>
        </div>
      }
    >
      <DonorCaseFormContent />
    </Suspense>
  );
}
