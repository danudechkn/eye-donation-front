"use client";

import { ArrowLeft, ArrowRight, RefreshCw, Save, Send } from "lucide-react";

interface CaseFormFooterProps {
  activeStep: 1 | 2;
  isEditMode: boolean;
  submitting: boolean;
  isSendingMoph: boolean;
  isCidIncomplete: boolean;
  caseIsComplete: number | null;
  caseMissingFields: string[];
  caseStatus: number;
  onCancel: () => void;
  onPrevStep: () => void;
  onNextStep: () => void;
  onSendMoph: () => void;
  onSave: () => void;
}

export function CaseFormFooter({
  activeStep,
  isEditMode,
  submitting,
  isSendingMoph,
  isCidIncomplete,
  caseIsComplete,
  caseMissingFields,
  caseStatus,
  onCancel,
  onPrevStep,
  onNextStep,
  onSendMoph,
  onSave,
}: CaseFormFooterProps) {
  return (
    <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
      {/* Left Action */}
      <div className="w-full sm:w-auto flex items-center gap-3">
        {activeStep === 1 ? (
          <button
            type="button"
            onClick={onCancel}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full text-sm font-semibold transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>ยกเลิก</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onPrevStep}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full text-sm font-semibold transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>ย้อนกลับ</span>
          </button>
        )}
      </div>

      {/* Right Actions */}
      <div className="w-full sm:w-auto flex flex-col sm:flex-row items-center gap-3">
        {activeStep === 2 && !isEditMode && (
          <button
            type="button"
            onClick={onCancel}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full text-sm font-semibold transition-all cursor-pointer"
          >
            <span>ยกเลิก</span>
          </button>
        )}

        {isEditMode && (
          <button
            type="button"
            disabled={submitting || isSendingMoph || caseIsComplete === 0}
            onClick={onSendMoph}
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

        {activeStep === 1 ? (
          <>
            {isEditMode && (
              <button
                type="button"
                disabled={submitting || isSendingMoph || isCidIncomplete}
                title={
                  isCidIncomplete
                    ? "กรุณากรอกเลขบัตรประชาชน (CID) ให้ครบ 13 หลักก่อนบันทึก"
                    : undefined
                }
                onClick={onSave}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200/80 rounded-full text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-[0.98]"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>กำลังบันทึก...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>บันทึกการแก้ไข</span>
                  </>
                )}
              </button>
            )}

            <button
              type="button"
              onClick={onNextStep}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-2.5 bg-[#29b6f6] hover:bg-[#0288d1] text-white rounded-full text-sm font-semibold shadow-sm transition-all cursor-pointer active:scale-[0.98]"
            >
              <span>ถัดไป</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </>
        ) : (
          <button
            type="button"
            disabled={submitting || isSendingMoph || isCidIncomplete}
            title={
              isCidIncomplete
                ? "กรุณากรอกเลขบัตรประชาชน (CID) ให้ครบ 13 หลักก่อนบันทึก"
                : undefined
            }
            onClick={onSave}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-2.5 bg-[#29b6f6] hover:bg-[#0288d1] text-white rounded-full text-sm font-semibold shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-[0.98]"
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
        )}
      </div>
    </div>
  );
}
