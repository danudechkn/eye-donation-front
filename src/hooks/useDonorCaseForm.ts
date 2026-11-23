"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api, DonorCasePayload } from "@/hooks/useApi";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/Toast";
import { formatToLocalDateTimeInput } from "@/lib/caseHelpers";

export function useDonorCaseForm(editId: string | null) {
  const router = useRouter();
  const { user } = useAuth();
  const {
    notification,
    visible: toastVisible,
    showToast,
    dismissToast,
    clearToast,
  } = useToast();

  const isEditMode = Boolean(editId);

  const [pageLoading, setPageLoading] = useState(isEditMode);
  const [searchingPatient, setSearchingPatient] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeStep, setActiveStep] = useState<1 | 2>(1);

  // ── Form Fields ───────────────────────────────────────────────────────────
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
  const [geteyePlace, setGeteyePlace] = useState("");
  const [wardtotc, setWardtotc] = useState(1);
  const [commentnonchk, setCommentnonchk] = useState("");
  const [firststaff, setFirststaff] = useState("");
  const [firsttime, setFirsttime] = useState(() =>
    isEditMode ? "" : formatToLocalDateTimeInput(),
  );

  // ── Case Metadata (Edit Mode) ─────────────────────────────────────────────
  const [caseStatus, setCaseStatus] = useState<number>(1);
  const [isSendingMoph, setIsSendingMoph] = useState(false);
  const [caseIsComplete, setCaseIsComplete] = useState<number | null>(null);
  const [caseMissingFields, setCaseMissingFields] = useState<string[]>([]);

  // ── Load Existing Case ────────────────────────────────────────────────────
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
          setCid(d.cid ? String(d.cid).replace(/\D/g, "").slice(0, 13) : "");
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
          setGeteyePlace(d.geteye_place || "");
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

  // ── Derived Values ────────────────────────────────────────────────────────
  const displayFirststaff = isEditMode ? firststaff : user?.name || "";
  const trimmedCid = cid.trim();
  const isCidIncomplete = trimmedCid.length > 0 && !/^\d{13}$/.test(trimmedCid);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleCidChange = (raw: string) => {
    setCid(raw.replace(/\D/g, "").slice(0, 13));
  };

  const handleNegotiateSuccChange = (val: number) => {
    setNegotiateSucc(val);
    if (val === 12 || val === 2) {
      setGeteye(14);
      setEyetotal(15);
    }
  };

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
        if (p.cid || p.citizencardno) {
          setCid(String(p.cid || p.citizencardno).replace(/\D/g, "").slice(0, 13));
        }
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

  const handleNextStep = () => {
    if (!hn.trim()) {
      showToast("error", "กรุณาระบุเลข HN ผู้ป่วยก่อนไปขั้นตอนถัดไป");
      return;
    }
    if (isCidIncomplete) {
      showToast(
        "error",
        `กรุณากรอกเลขบัตรประชาชน (CID) ให้ครบ 13 หลัก (ปัจจุบัน ${trimmedCid.length}/13 หลัก)`,
      );
      return;
    }
    if (braincardiac === null || braincardiac === undefined) {
      showToast("error", "กรุณาเลือกประเภทการเสียชีวิต (braincardiac) ก่อนไปขั้นตอนถัดไป");
      return;
    }
    clearToast();
    setActiveStep(2);
  };

  const handleSaveCase = async () => {
    if (!hn.trim()) {
      setActiveStep(1);
      showToast("error", "กรุณาระบุเลข HN ผู้ป่วยก่อนบันทึกข้อมูล");
      return;
    }

    if (isCidIncomplete) {
      setActiveStep(1);
      showToast(
        "error",
        `กรุณากรอกเลขบัตรประชาชน (CID) ให้ครบ 13 หลัก (ปัจจุบัน ${trimmedCid.length}/13 หลัก)`,
      );
      return;
    }

    const step1Missing: string[] = [];
    if (braincardiac === null || braincardiac === undefined) {
      step1Missing.push("braincardiac (ประเภทการเสียชีวิต)");
    }
    if (potential === null || potential === undefined) step1Missing.push("potential");
    if (chkpotential === null || chkpotential === undefined) {
      step1Missing.push("chkpotential");
    }
    if (wardtotc === null || wardtotc === undefined) {
      step1Missing.push("หอผู้ป่วยแจ้ง TC (wardtotc)");
    }

    const step2Missing: string[] = [];
    if (negotiate === null || negotiate === undefined) step2Missing.push("negotiate");
    if (geteye === null || geteye === undefined) step2Missing.push("geteye");
    if (eyetotal === null || eyetotal === undefined) step2Missing.push("eyetotal");

    const missingFields = [...step1Missing, ...step2Missing];
    if (missingFields.length > 0) {
      setActiveStep(step1Missing.length > 0 ? 1 : 2);
      showToast("error", `กรอกข้อมูลไม่ครบ (จำเป็นต้องระบุ): ${missingFields.join(", ")}`);
      return;
    }

    try {
      setSubmitting(true);
      clearToast();

      const payload: DonorCasePayload = {
        hn: hn.trim(),
        fullname: fullname.trim() || null,
        cid: trimmedCid || null,
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
        geteye_place: geteyePlace.trim() || null,
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

  return {
    // Mode & Status
    isEditMode,
    pageLoading,
    searchingPatient,
    submitting,
    activeStep,
    setActiveStep,
    caseStatus,
    isSendingMoph,
    caseIsComplete,
    caseMissingFields,

    // Toast
    notification,
    toastVisible,
    dismissToast,

    // Derived
    displayFirststaff,
    trimmedCid,
    isCidIncomplete,

    // Step 1 values & setters
    searchHn,
    setSearchHn,
    hn,
    setHn,
    cid,
    handleCidChange,
    fullname,
    setFullname,
    deathtext,
    setDeathtext,
    icd10,
    setIcd10,
    braincardiac,
    setBraincardiac,
    potential,
    setPotential,
    chkpotential,
    setChkpotential,
    wardtotc,
    setWardtotc,
    commentnonchk,
    setCommentnonchk,

    // Step 2 values & setters
    negotiate,
    setNegotiate,
    negotiateSucc,
    handleNegotiateSuccChange,
    commentnonego,
    setCommentnonego,
    geteye,
    setGeteye,
    eyetotal,
    setEyetotal,
    commentnoget,
    setCommentnoget,
    negotiateStaff,
    setNegotiateStaff,
    geteyeStaff,
    setGeteyeStaff,
    geteyePlace,
    setGeteyePlace,
    firsttime,
    setFirsttime,

    // Actions
    handleSearchPatient,
    handleSendMophFromForm,
    handleNextStep,
    handleSaveCase,
    handleCancel: () => router.push("/cases"),
  };
}
