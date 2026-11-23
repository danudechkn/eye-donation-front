"use client";

import { CustomSelect } from "@/components/ui/CustomSelect";
import { DateTimePicker } from "@/components/ui/DateTimePicker";
import {
  EYE_TOTAL_OPTIONS,
  GET_EYE_OPTIONS,
  NEGOTIATE_OPTIONS,
  NEGOTIATE_SUCC_OPTIONS,
  formatToLocalDateTimeInput,
} from "@/lib/caseHelpers";
import { DISABLED_PILL_INPUT_CLS, PILL_INPUT_CLS } from "./formStyles";

interface NegotiationRetrievalStepProps {
  isEditMode: boolean;
  negotiate: number;
  onNegotiateChange: (value: number) => void;
  negotiateSucc: number;
  onNegotiateSuccChange: (value: number) => void;
  commentnonego: string;
  onCommentnonegoChange: (value: string) => void;
  geteye: number;
  onGeteyeChange: (value: number) => void;
  eyetotal: number;
  onEyetotalChange: (value: number) => void;
  commentnoget: string;
  onCommentnogetChange: (value: string) => void;
  negotiateStaff: string;
  onNegotiateStaffChange: (value: string) => void;
  geteyeStaff: string;
  onGeteyeStaffChange: (value: string) => void;
  geteyePlace: string;
  onGeteyePlaceChange: (value: string) => void;
  displayFirststaff: string;
  firsttime: string;
  onFirsttimeChange: (value: string) => void;
}

export function NegotiationRetrievalStep({
  isEditMode,
  negotiate,
  onNegotiateChange,
  negotiateSucc,
  onNegotiateSuccChange,
  commentnonego,
  onCommentnonegoChange,
  geteye,
  onGeteyeChange,
  eyetotal,
  onEyetotalChange,
  commentnoget,
  onCommentnogetChange,
  negotiateStaff,
  onNegotiateStaffChange,
  geteyeStaff,
  onGeteyeStaffChange,
  geteyePlace,
  onGeteyePlaceChange,
  displayFirststaff,
  firsttime,
  onFirsttimeChange,
}: NegotiationRetrievalStepProps) {
  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Row 1: negotiate | negotiate_succ | commentnonego */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
        <div>
          <label className="block text-xs md:text-sm font-semibold text-slate-400 mb-1.5 pl-1">
            negotiate <span className="text-rose-500">*</span>
          </label>
          <CustomSelect
            value={negotiate}
            onChange={onNegotiateChange}
            options={NEGOTIATE_OPTIONS}
          />
        </div>

        <div>
          <label className="block text-xs md:text-sm font-semibold text-slate-400 mb-1.5 pl-1">
            negotiate_succ
          </label>
          <CustomSelect
            value={negotiateSucc}
            onChange={onNegotiateSuccChange}
            options={NEGOTIATE_SUCC_OPTIONS}
          />
        </div>

        <div className="sm:col-span-2 md:col-span-2">
          <label className="block text-xs md:text-sm font-semibold text-slate-400 mb-1.5 pl-1">
            เหตุผลที่ไม่ได้เจรจา / ไม่ยินยอม (commentnonego)
          </label>
          <input
            type="text"
            value={commentnonego}
            onChange={(e) => onCommentnonegoChange(e.target.value)}
            placeholder="ระบุสาเหตุหรือหมายเหตุการเจรจา..."
            className={PILL_INPUT_CLS}
          />
        </div>
      </div>

      {/* Row 2: geteye | eyetotal | commentnoget */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
        <div className="md:col-span-1">
          <label className="block text-xs md:text-sm font-semibold text-slate-400 mb-1.5 pl-1">
            geteye <span className="text-rose-500">*</span>
          </label>
          <CustomSelect
            value={geteye}
            onChange={onGeteyeChange}
            options={GET_EYE_OPTIONS}
          />
        </div>

        <div className="md:col-span-1">
          <label className="block text-xs md:text-sm font-semibold text-slate-400 mb-1.5 pl-1">
            eyetotal <span className="text-rose-500">*</span>
          </label>
          <CustomSelect
            value={eyetotal}
            onChange={onEyetotalChange}
            options={EYE_TOTAL_OPTIONS}
          />
        </div>

        <div className="sm:col-span-2 md:col-span-2">
          <label className="block text-xs md:text-sm font-semibold text-slate-400 mb-1.5 pl-1">
            เหตุผลที่จัดเก็บไม่ได้ (commentnoget)
          </label>
          <input
            type="text"
            value={commentnoget}
            onChange={(e) => onCommentnogetChange(e.target.value)}
            placeholder="ระบุสาเหตุที่จัดเก็บไม่ได้..."
            className={PILL_INPUT_CLS}
          />
        </div>
      </div>

      {/* Row 3: negotiate_staff | geteye_staff | สถานที่จัดเก็บ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <div>
          <label className="block text-xs md:text-sm font-semibold text-slate-400 mb-1.5 pl-1">
            ผู้เจรจา (negotiate_staff)
          </label>
          <input
            type="text"
            value={negotiateStaff}
            onChange={(e) => onNegotiateStaffChange(e.target.value)}
            placeholder="ชื่อ-สกุล เจ้าหน้าที่ผู้เจรจา"
            className={PILL_INPUT_CLS}
          />
        </div>

        <div>
          <label className="block text-xs md:text-sm font-semibold text-slate-400 mb-1.5 pl-1">
            ผู้จัดเก็บ (geteye_staff)
          </label>
          <input
            type="text"
            value={geteyeStaff}
            onChange={(e) => onGeteyeStaffChange(e.target.value)}
            placeholder="ชื่อ-สกุล แพทย์/เจ้าหน้าที่ผู้จัดเก็บ"
            className={PILL_INPUT_CLS}
          />
        </div>

        <div>
          <label className="block text-xs md:text-sm font-semibold text-slate-400 mb-1.5 pl-1">
            สถานที่จัดเก็บ
          </label>
          <input
            type="text"
            value={geteyePlace}
            onChange={(e) => onGeteyePlaceChange(e.target.value)}
            placeholder="เช่น ห้องผ่าตัด, ICU, ห้องเก็บศพ, บ้านผู้บริจาค"
            className={PILL_INPUT_CLS}
          />
        </div>
      </div>

      {/* Row 4: firststaff & firsttime */}
      <div className="border-t border-slate-100 pt-5 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <div>
          <div className="flex items-center justify-between gap-2 mb-1.5 pl-1">
            <label className="block text-xs md:text-sm font-semibold text-slate-400 truncate">
              ชื่อผู้บันทึกข้อมูล (firststaff)
            </label>
            <span className="text-[11px] text-slate-400 font-medium shrink-0">
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
              onClick={() => onFirsttimeChange(formatToLocalDateTimeInput())}
              className="text-[11px] text-sky-500 hover:text-sky-600 font-medium hover:underline transition-colors cursor-pointer"
            >
              ใช้วันเวลาปัจจุบัน
            </button>
          </div>
          <DateTimePicker
            value={firsttime}
            onChange={onFirsttimeChange}
            placeholder="เลือกวันและเวลาแรกรับ"
          />
        </div>
      </div>
    </div>
  );
}
