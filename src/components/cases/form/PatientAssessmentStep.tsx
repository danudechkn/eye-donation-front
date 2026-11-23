"use client";

import { Search, RefreshCw } from "lucide-react";
import { CustomSelect } from "@/components/ui/CustomSelect";
import {
  CHK_POTENTIAL_OPTIONS,
  DEATH_TYPE_OPTIONS,
  POTENTIAL_OPTIONS,
  WARD_TO_TC_OPTIONS,
} from "@/lib/caseHelpers";
import { ERROR_PILL_INPUT_CLS, PILL_INPUT_CLS } from "./formStyles";

interface PatientAssessmentStepProps {
  isEditMode: boolean;
  searchHn: string;
  onSearchHnChange: (value: string) => void;
  searchingPatient: boolean;
  onSearchPatient: () => void;
  hn: string;
  onHnChange: (value: string) => void;
  cid: string;
  trimmedCid: string;
  isCidIncomplete: boolean;
  onCidChange: (value: string) => void;
  fullname: string;
  onFullnameChange: (value: string) => void;
  deathtext: string;
  onDeathtextChange: (value: string) => void;
  icd10: string;
  onIcd10Change: (value: string) => void;
  braincardiac: number | null;
  onBraincardiacChange: (value: number) => void;
  potential: number;
  onPotentialChange: (value: number) => void;
  chkpotential: number;
  onChkpotentialChange: (value: number) => void;
  wardtotc: number;
  onWardtotcChange: (value: number) => void;
  commentnonchk: string;
  onCommentnonchkChange: (value: string) => void;
}

export function PatientAssessmentStep({
  isEditMode,
  searchHn,
  onSearchHnChange,
  searchingPatient,
  onSearchPatient,
  hn,
  onHnChange,
  cid,
  trimmedCid,
  isCidIncomplete,
  onCidChange,
  fullname,
  onFullnameChange,
  deathtext,
  onDeathtextChange,
  icd10,
  onIcd10Change,
  braincardiac,
  onBraincardiacChange,
  potential,
  onPotentialChange,
  chkpotential,
  onChkpotentialChange,
  wardtotc,
  onWardtotcChange,
  commentnonchk,
  onCommentnonchkChange,
}: PatientAssessmentStepProps) {
  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Search HN Bar (โหมดสร้างเคส) */}
      {!isEditMode && (
        <div className="flex justify-end">
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <input
                type="text"
                value={searchHn}
                onChange={(e) => onSearchHnChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    onSearchPatient();
                  }
                }}
                placeholder="กรอกเลข HN เพื่อดึงข้อมูล"
                className={PILL_INPUT_CLS}
              />
            </div>
            <button
              type="button"
              onClick={onSearchPatient}
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
            onChange={(e) => onHnChange(e.target.value)}
            placeholder="เช่น 66012345"
            className={PILL_INPUT_CLS}
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5 px-1">
            <label className="block text-xs md:text-sm font-semibold text-slate-400">
              เลขบัตรประชาชน (CID)
            </label>
            {trimmedCid.length > 0 && (
              <span
                className={`text-[11px] font-semibold ${
                  isCidIncomplete ? "text-rose-500" : "text-emerald-600"
                }`}
              >
                {trimmedCid.length}/13 หลัก
              </span>
            )}
          </div>
          <input
            type="text"
            inputMode="numeric"
            maxLength={13}
            value={cid}
            onChange={(e) => onCidChange(e.target.value)}
            placeholder="13 หลัก"
            aria-invalid={isCidIncomplete}
            className={isCidIncomplete ? ERROR_PILL_INPUT_CLS : PILL_INPUT_CLS}
          />
          {isCidIncomplete && (
            <p className="mt-1.5 pl-2 text-xs font-medium text-rose-500">
              กรุณากรอกเลขบัตรประชาชนให้ครบ 13 หลัก (ขาดอีก {13 - trimmedCid.length} หลัก)
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs md:text-sm font-semibold text-slate-400 mb-1.5 pl-1">
            ชื่อ-สกุล
          </label>
          <input
            type="text"
            value={fullname}
            onChange={(e) => onFullnameChange(e.target.value)}
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
            onChange={(e) => onDeathtextChange(e.target.value)}
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
            onChange={(e) => onIcd10Change(e.target.value)}
            placeholder="เช่น I21.9, I61.9"
            className={PILL_INPUT_CLS}
          />
        </div>
      </div>

      {/* Assessment Section */}
      <div className="border-t border-slate-100 pt-5 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
          <div>
            <label className="block text-xs md:text-sm font-semibold text-slate-400 mb-1.5 pl-1">
              braincardiac <span className="text-rose-500">*</span>
            </label>
            <CustomSelect
              value={braincardiac}
              onChange={onBraincardiacChange}
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
              onChange={onPotentialChange}
              options={POTENTIAL_OPTIONS}
            />
          </div>

          <div>
            <label className="block text-xs md:text-sm font-semibold text-slate-400 mb-1.5 pl-1">
              chkpotential <span className="text-rose-500">*</span>
            </label>
            <CustomSelect
              value={chkpotential}
              onChange={onChkpotentialChange}
              options={CHK_POTENTIAL_OPTIONS}
            />
          </div>

          <div>
            <label className="block text-xs md:text-sm font-semibold text-slate-400 mb-1.5 pl-1">
              หอผู้ป่วยแจ้ง TC (wardtotc) <span className="text-rose-500">*</span>
            </label>
            <CustomSelect
              value={wardtotc}
              onChange={onWardtotcChange}
              options={WARD_TO_TC_OPTIONS}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs md:text-sm font-semibold text-slate-400 mb-1.5 pl-1">
            เหตุผลที่ไม่ได้ประเมิน (commentnonchk)
          </label>
          <input
            type="text"
            value={commentnonchk}
            onChange={(e) => onCommentnonchkChange(e.target.value)}
            placeholder="ระบุเหตุผล เช่น เสียชีวิตก่อนทีมเข้าถึง..."
            className={PILL_INPUT_CLS}
          />
        </div>
      </div>
    </div>
  );
}
