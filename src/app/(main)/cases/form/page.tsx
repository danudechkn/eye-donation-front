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
  Send,
} from "lucide-react";
import { api, DonorCasePayload } from "@/hooks/useApi";
import { useAuth } from "@/context/AuthContext";
import { CustomSelect } from "@/components/CustomSelect";
import { DateTimePicker } from "@/components/DateTimePicker";
import { Toast, useToast } from "@/components/Toast";
import {
  CHK_POTENTIAL_OPTIONS,
  DEATH_TYPE_OPTIONS,
  EYE_TOTAL_OPTIONS,
  GET_EYE_OPTIONS,
  NEGOTIATE_OPTIONS,
  NEGOTIATE_SUCC_OPTIONS,
  POTENTIAL_OPTIONS,
  WARD_TO_TC_OPTIONS,
  formatToLocalDateTimeInput,
} from "@/lib/caseHelpers";

const PILL_INPUT_CLS =
  "w-full h-11 px-5 bg-white border border-slate-200/90 rounded-full text-sm font-medium text-slate-700 placeholder:text-slate-300 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 transition-all";

const DISABLED_PILL_INPUT_CLS =
  "w-full h-11 px-5 bg-slate-100/80 border border-slate-200/90 rounded-full text-sm font-medium text-slate-500 placeholder:text-slate-400 cursor-not-allowed focus:outline-none transition-all";

function DonorCaseFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const {
    notification,
    visible: toastVisible,
    showToast,
    dismissToast,
    clearToast,
  } = useToast();

  const editId = searchParams.get("id");
  const isEditMode = Boolean(editId);

  const [pageLoading, setPageLoading] = useState(isEditMode);
  const [searchingPatient, setSearchingPatient] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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
  const [negotiateSucc, setNegotiateSucc] = useState(1);
  const [commentnonego, setCommentnonego] = useState("");
  const [geteye, setGeteye] = useState(1);
  const [eyetotal, setEyetotal] = useState(2);
  const [commentnoget, setCommentnoget] = useState("");
  const [negotiateStaff, setNegotiateStaff] = useState("");
  const [geteyeStaff, setGeteyeStaff] = useState("");

  const [wardtotc, setWardtotc] = useState(1);
  const [commentnonchk, setCommentnonchk] = useState("");
  const [firststaff, setFirststaff] = useState("");
  const [firsttime, setFirsttime] = useState(() =>
    isEditMode ? "" : formatToLocalDateTimeInput(),
  );
  const [caseStatus, setCaseStatus] = useState<number>(1);
  const [isSendingMoph, setIsSendingMoph] = useState(false);
  const [caseIsComplete, setCaseIsComplete] = useState<number | null>(null);
  const [caseMissingFields, setCaseMissingFields] = useState<string[]>([]);

  // ── Load Case on Edit ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!editId) return;
    let isMounted = true;

    async function load() {
      try {
        setPageLoading(true);
        const res = await api.getCaseById(editId as string);
        if (!isMounted) return;
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
          setNegotiateSucc(d.negotiate_succ != null ? Number(d.negotiate_succ) : 1);
          setCommentnonego(d.commentnonnego || "");
          setNegotiateStaff(d.negotiate_staff || "");
          setGeteye(Number(d.geteye) || 1);
          setEyetotal(Number(d.eyetotal) ?? 2);
          setCommentnoget(d.commentnoget || "");
          setGeteyeStaff(d.geteye_staff || "");
          setFirststaff(d.firststaff?.trim() || "-");
          setCaseStatus(d.status !== undefined ? Number(d.status) : 1);
          setCaseIsComplete(
            d.is_complete !== undefined && d.is_complete !== null
              ? Number(d.is_complete)
              : null,
          );
          setCaseMissingFields(Array.isArray(d.missing_fields) ? d.missing_fields : []);

          const rawFirstTime =
            d.fristtime || (d as unknown as { firsttime?: string }).firsttime;
          if (rawFirstTime) {
            const parsed = new Date(rawFirstTime);
            if (!Number.isNaN(parsed.getTime())) {
              setFirsttime(formatToLocalDateTimeInput(parsed));
            }
          }
        }
      } catch (err: unknown) {
        if (!isMounted) return;
        const msg = err instanceof Error ? err.message : "";
        showToast("error", "โหลดข้อมูลเดิมไม่ได้: " + msg);
      } finally {
        if (isMounted) setPageLoading(false);
      }
    }

    load();
    return () => {
      isMounted = false;
    };
  }, [editId, showToast]);

  // โหมดแก้ไข: แสดงค่า firststaff เดิม | โหมดสร้างเคส: แสดงชื่อผู้ใช้งานที่ Login (Backend ดึงจาก JWT ตอนบันทึก)
  const displayFirststaff = isEditMode ? firststaff : (user?.name || "");

  // ── Search HIS Patient ────────────────────────────────────────────────────
  const handleSearchPatient = async (targetHn?: string) => {
    const queryHn = (targetHn ?? searchHn ?? hn).trim();
    if (!queryHn) {
      showToast("error", "กรุณาระบุเลข HN ในช่องค้นหาก่อน");
      return;
    }

    try {
      setSearchingPatient(true);
      clearToast();
      const res = await api.searchPatient(queryHn);
      if (res.success && res.data) {
        const p = (Array.isArray(res.data) ? res.data[0] : res.data) as Record<
          string,
          unknown
        >;
        const name = [p.prename, p.firstname, p.lastname].filter(Boolean).join(" ");
        const foundHn = String(p.hn || queryHn);
        setHn(foundHn);
        setSearchHn(foundHn);
        setFullname(String(p.fullname || name || "พบข้อมูลผู้ป่วย"));
        if (p.cid || p.citizencardno) setCid(String(p.cid || p.citizencardno));
        if (p.deathtext || p.diagdetail) setDeathtext(String(p.deathtext || p.diagdetail));
        if (p.icd10 || p.icdcode) setIcd10(String(p.icd10 || p.icdcode));
        if (p.braincardiac) setBraincardiac(Number(p.braincardiac));
        showToast("success", `พบข้อมูลผู้ป่วย: ${p.fullname || name || foundHn}`);
      } else {
        showToast("error", `ไม่พบข้อมูลผู้ป่วย HN: ${queryHn} ในระบบ HIS`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "เกิดข้อผิดพลาด";
      showToast("error", "ค้นหาไม่สำเร็จ: " + msg);
    } finally {
      setSearchingPatient(false);
    }
  };

  // ── Send to MOPH ──────────────────────────────────────────────────────────
  const handleSendMophFromForm = async () => {
    if (!editId) return;
    try {
      setIsSendingMoph(true);
      await api.sendToMoph(editId);
      setCaseStatus(2);
      showToast("success", `ส่งข้อมูลเคส HN: ${hn} ไปยังระบบ สธ. (MOPH) เรียบร้อยแล้ว`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "เกิดข้อผิดพลาด";
      showToast("error", `ไม่สามารถส่งข้อมูลไป MOPH ได้: ${msg}`);
    } finally {
      setIsSendingMoph(false);
    }
  };

  // ── Save Case ─────────────────────────────────────────────────────────────
  const handleSaveCase = async () => {
    if (!hn.trim()) {
      showToast("error", "กรุณาระบุเลข HN ผู้ป่วยก่อนบันทึกข้อมูล");
      return;
    }

    const missingFields: string[] = [];
    if (braincardiac === null || braincardiac === undefined) {
      missingFields.push("braincardiac (ประเภทการเสียชีวิต)");
    }
    if (potential === null || potential === undefined) missingFields.push("potential");
    if (chkpotential === null || chkpotential === undefined) missingFields.push("chkpotential");
    if (wardtotc === null || wardtotc === undefined) {
      missingFields.push("หอผู้ป่วยแจ้ง TC (wardtotc)");
    }
    if (negotiate === null || negotiate === undefined) missingFields.push("negotiate");
    if (geteye === null || geteye === undefined) missingFields.push("geteye");
    if (eyetotal === null || eyetotal === undefined) missingFields.push("eyetotal");

    if (missingFields.length > 0) {
      showToast("error", `กรอกข้อมูลไม่ครบ (จำเป็นต้องระบุ): ${missingFields.join(", ")}`);
      return;
    }

    try {
      setSubmitting(true);
      clearToast();

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
        negotiate_succ: negotiateSucc,
        commentnonego: commentnonego.trim() || null,
        commentnonnego: commentnonego.trim() || null,
        geteye,
        eyetotal,
        commentnoget: commentnoget.trim() || null,
        negotiate_staff: negotiateStaff.trim() || null,
        geteye_staff: geteyeStaff.trim() || null,
        firsttime: firsttime ? new Date(firsttime).toISOString() : null,
      };

      if (isEditMode) {
        await api.updateCase(editId as string, payload);
        showToast("success", "Case updated successfully");
      } else {
        await api.createCase(payload);
        showToast("success", "Case created successfully");
      }
      setTimeout(() => router.push("/cases"), 1200);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการบันทึก";
      showToast("error", msg);
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

  return (
    <div className="min-h-screen bg-[#f8fafc] px-4 sm:px-6 md:px-10 py-6 md:py-8">
      <div className="w-full space-y-4">
        {/* Breadcrumb / Status Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <Link
            href="/cases"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>กลับหน้ารายการเคสบริจาค</span>
          </Link>

          <div className="flex items-center gap-2">
            {isEditMode &&
              (caseIsComplete === 1 ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                  ข้อมูลครบ
                </span>
              ) : caseIsComplete === 0 ? (
                <span
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200/80 cursor-help"
                  title={
                    caseMissingFields.length > 0
                      ? `ข้อมูลยังไม่ครบ: ${caseMissingFields.join(", ")}`
                      : "ข้อมูลยังไม่ครบถ้วน"
                  }
                >
                  <AlertCircle className="w-3.5 h-3.5 mr-1 text-rose-500" />
                  ข้อมูลไม่ครบ{" "}
                  {caseMissingFields.length > 0 && `(${caseMissingFields.length})`}
                </span>
              ) : null)}

            {isEditMode &&
              (caseStatus === 2 ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                  ส่ง สธ. (MOPH) แล้ว
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/80">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5 animate-pulse" />
                  รอส่ง สธ. (MOPH)
                </span>
              ))}

            <span className="text-xs text-slate-400 font-medium">
              {isEditMode ? `แก้ไขเคส #${editId}` : "เพิ่มเคสบริจาคดวงตา"}
            </span>
          </div>
        </div>

        <Toast notification={notification} visible={toastVisible} onClose={dismissToast} />

        {/* Form Card */}
        <div className="w-full">
          <div className="bg-white rounded-[32px] border border-slate-200/90 shadow-[0_4px_24px_rgba(0,0,0,0.02)] p-6 sm:p-8 md:p-10 space-y-5">
            <div className="space-y-4 md:space-y-5 animate-in fade-in duration-200">
              {/* Search HN Bar (โหมดสร้างเคส) */}
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
                        className={PILL_INPUT_CLS}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSearchPatient()}
                      disabled={searchingPatient}
                      className="px-6 py-2.5 bg-[#29b6f6] hover:bg-[#0288d1] text-white rounded-full text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-sm shrink-0 disabled:opacity-50 active:scale-[0.98] cursor-pointer"
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
                    className={isEditMode ? DISABLED_PILL_INPUT_CLS : PILL_INPUT_CLS}
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
                    className={PILL_INPUT_CLS}
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
                    className={PILL_INPUT_CLS}
                  />
                </div>
              </div>

              {/* Row 2: สาเหตุการเสียชีวิต & icd10 */}
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
                    className={PILL_INPUT_CLS}
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
                    className={PILL_INPUT_CLS}
                  />
                </div>
              </div>

              {/* Row 3: braincardiac | potential | chkpotential | wardtotc */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
                <div>
                  <label className="block text-xs md:text-sm font-semibold text-slate-400 mb-1.5 pl-1">
                    braincardiac <span className="text-rose-500">*</span>
                  </label>
                  <CustomSelect
                    value={braincardiac}
                    onChange={setBraincardiac}
                    placeholder="-- เลือกประเภทการเสียชีวิต --"
                    options={DEATH_TYPE_OPTIONS}
                  />
                </div>

                <div>
                  <label className="block text-xs md:text-sm font-semibold text-slate-400 mb-1.5 pl-1">
                    potential <span className="text-rose-500">*</span>
                  </label>
                  <CustomSelect
                    value={potential}
                    onChange={setPotential}
                    options={POTENTIAL_OPTIONS}
                  />
                </div>

                <div>
                  <label className="block text-xs md:text-sm font-semibold text-slate-400 mb-1.5 pl-1">
                    chkpotential <span className="text-rose-500">*</span>
                  </label>
                  <CustomSelect
                    value={chkpotential}
                    onChange={setChkpotential}
                    options={CHK_POTENTIAL_OPTIONS}
                  />
                </div>

                <div>
                  <label className="block text-xs md:text-sm font-semibold text-slate-400 mb-1.5 pl-1">
                    หอผู้ป่วยแจ้ง TC (wardtotc) <span className="text-rose-500">*</span>
                  </label>
                  <CustomSelect
                    value={wardtotc}
                    onChange={setWardtotc}
                    options={WARD_TO_TC_OPTIONS}
                  />
                </div>
              </div>

              {/* Row 3.1: เหตุผลที่ไม่ได้ประเมิน */}
              <div>
                <label className="block text-xs md:text-sm font-semibold text-slate-400 mb-1.5 pl-1">
                  เหตุผลที่ไม่ได้ประเมิน (commentnonchk)
                </label>
                <input
                  type="text"
                  value={commentnonchk}
                  onChange={(e) => setCommentnonchk(e.target.value)}
                  placeholder="ระบุเหตุผล เช่น เสียชีวิตก่อนทีมเข้าถึง..."
                  className={PILL_INPUT_CLS}
                />
              </div>

              {/* Row 4: negotiate | negotiate_succ | commentnonego */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
                <div>
                  <label className="block text-xs md:text-sm font-semibold text-slate-400 mb-1.5 pl-1">
                    negotiate <span className="text-rose-500">*</span>
                  </label>
                  <CustomSelect
                    value={negotiate}
                    onChange={setNegotiate}
                    options={NEGOTIATE_OPTIONS}
                  />
                </div>

                <div>
                  <label className="block text-xs md:text-sm font-semibold text-slate-400 mb-1.5 pl-1">
                    negotiate_succ
                  </label>
                  <CustomSelect
                    value={negotiateSucc}
                    onChange={(val) => {
                      setNegotiateSucc(val);
                      if (val === 12 || val === 2) {
                        setGeteye(14);
                        setEyetotal(15);
                      }
                    }}
                    options={NEGOTIATE_SUCC_OPTIONS}
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
                    className={PILL_INPUT_CLS}
                  />
                </div>
              </div>

              {/* Row 5: geteye | eyetotal | commentnoget */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
                <div className="md:col-span-1">
                  <label className="block text-xs md:text-sm font-semibold text-slate-400 mb-1.5 pl-1">
                    geteye <span className="text-rose-500">*</span>
                  </label>
                  <CustomSelect
                    value={geteye}
                    onChange={setGeteye}
                    options={GET_EYE_OPTIONS}
                  />
                </div>

                <div className="md:col-span-1">
                  <label className="block text-xs md:text-sm font-semibold text-slate-400 mb-1.5 pl-1">
                    eyetotal <span className="text-rose-500">*</span>
                  </label>
                  <CustomSelect
                    value={eyetotal}
                    onChange={setEyetotal}
                    options={EYE_TOTAL_OPTIONS}
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
                    className={PILL_INPUT_CLS}
                  />
                </div>
              </div>

              {/* Row 6: negotiate_staff & geteye_staff */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div>
                  <label className="block text-xs md:text-sm font-semibold text-slate-400 mb-1.5 pl-1">
                    negotiate_staff
                  </label>
                  <input
                    type="text"
                    value={negotiateStaff}
                    onChange={(e) => setNegotiateStaff(e.target.value)}
                    placeholder="ชื่อ-สกุล เจ้าหน้าที่ผู้เจรจา"
                    className={PILL_INPUT_CLS}
                  />
                </div>

                <div>
                  <label className="block text-xs md:text-sm font-semibold text-slate-400 mb-1.5 pl-1">
                    geteye_staff
                  </label>
                  <input
                    type="text"
                    value={geteyeStaff}
                    onChange={(e) => setGeteyeStaff(e.target.value)}
                    placeholder="ชื่อ-สกุล แพทย์/เจ้าหน้าที่ผู้จัดเก็บ"
                    className={PILL_INPUT_CLS}
                  />
                </div>
              </div>

              {/* Row 7: firststaff & firsttime */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div>
                  <div className="flex items-center justify-between mb-1.5 pl-1">
                    <label className="block text-xs md:text-sm font-semibold text-slate-400">
                      ชื่อผู้บันทึกข้อมูล (firststaff)
                    </label>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {isEditMode ? "ไม่สามารถแก้ไขได้" : "ดึงจากผู้เข้าสู่ระบบอัตโนมัติ"}
                    </span>
                  </div>
                  <input
                    type="text"
                    value={displayFirststaff}
                    disabled
                    readOnly
                    placeholder={isEditMode ? "-" : "ดึงชื่อจากผู้เข้าสู่ระบบอัตโนมัติ"}
                    className={DISABLED_PILL_INPUT_CLS}
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
                      className="text-[11px] text-sky-500 hover:text-sky-600 font-medium hover:underline transition-colors cursor-pointer"
                    >
                      ใช้วันเวลาปัจจุบัน
                    </button>
                  </div>
                  <DateTimePicker
                    value={firsttime}
                    onChange={setFirsttime}
                    placeholder="เลือกวันและเวลาแรกรับ"
                  />
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-end gap-3 sm:gap-4">
              <button
                type="button"
                onClick={() => router.push("/cases")}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full text-sm font-semibold transition-all cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>ยกเลิก</span>
              </button>

              {isEditMode && (
                <button
                  type="button"
                  disabled={submitting || isSendingMoph || caseIsComplete === 0}
                  onClick={handleSendMophFromForm}
                  title={
                    caseIsComplete === 0 && caseMissingFields.length > 0
                      ? `ข้อมูลยังไม่ครบถ้วน ไม่สามารถส่งได้ (ขาด: ${caseMissingFields.join(", ")})`
                      : undefined
                  }
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white rounded-full text-sm font-semibold shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-[0.98]"
                >
                  {isSendingMoph ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>กำลังส่งไป MOPH...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>
                        {caseStatus === 2 ? "ส่ง สธ. (MOPH) ซ้ำ" : "ส่งข้อมูลไป MOPH"}
                      </span>
                    </>
                  )}
                </button>
              )}

              <button
                type="button"
                disabled={submitting || isSendingMoph}
                onClick={handleSaveCase}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-2.5 bg-[#29b6f6] hover:bg-[#0288d1] text-white rounded-full text-sm font-semibold shadow-sm transition-all disabled:opacity-50 cursor-pointer active:scale-[0.98]"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>กำลังบันทึก...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
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
