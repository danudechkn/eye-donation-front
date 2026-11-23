"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface CasesPaginationProps {
  page: number;
  totalPages: number;
  canGoNext: boolean;
  onPageChange: (page: number) => void;
}

export function CasesPagination({
  page,
  totalPages,
  canGoNext,
  onPageChange,
}: CasesPaginationProps) {
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
    <div className="p-4 border-t border-slate-100 flex items-center justify-end text-sm text-slate-600 bg-slate-50/50">
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => {
            if (page > 1) onPageChange(Math.max(1, page - 1));
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
              onClick={() => onPageChange(pageNum)}
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
            if (canGoNext) onPageChange(page + 1);
          }}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
            !canGoNext
              ? "text-slate-300 opacity-40 cursor-default"
              : "text-[#29b6f6] hover:bg-[#29b6f6]/10 cursor-pointer"
          }`}
          aria-label="หน้าถัดไป"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
