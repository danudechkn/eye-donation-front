"use client";

import Link from "next/link";
import { ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";

interface CaseFormHeaderProps {
  editId: string | null;
  isEditMode: boolean;
  caseIsComplete: number | null;
  caseMissingFields: string[];
  caseStatus: number;
}

export function CaseFormHeader({
  editId,
  isEditMode,
  caseIsComplete,
  caseMissingFields,
  caseStatus,
}: CaseFormHeaderProps) {
  return (
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
  );
}
