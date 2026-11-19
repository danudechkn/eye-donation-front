"use client";

import { RefreshCw } from "lucide-react";
import type { DonorCaseItem } from "@/types";

interface DeleteCaseModalProps {
  target: DonorCaseItem | null;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function DeleteCaseModal({
  target,
  isDeleting,
  onCancel,
  onConfirm,
}: DeleteCaseModalProps) {
  if (!target) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95">
        <h3 className="text-[24px] font-bold text-slate-900 text-center mb-1">
          ยืนยันการลบเคสบริจาค?
        </h3>
        <p className="text-xs text-slate-500 text-center mb-5 leading-relaxed">
          <strong className="text-slate-900 font-semibold text-lg">
            {target.fullname} ( HN: {target.hn} )
          </strong>
        </p>

        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={isDeleting}
            onClick={onCancel}
            className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 font-semibold text-[20px] hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            disabled={isDeleting}
            onClick={onConfirm}
            className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-[20px] transition-colors shadow-md shadow-rose-600/20 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            {isDeleting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
            <span>ยืนยันลบข้อมูล</span>
          </button>
        </div>
      </div>
    </div>
  );
}
