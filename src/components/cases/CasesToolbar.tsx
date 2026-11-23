"use client";

import { Search, Filter } from "lucide-react";
import { Popover, Button } from "@heroui/react";
import { CustomSelect } from "@/components/ui/CustomSelect";
import {
  COMPLETENESS_FILTER_OPTIONS,
  GENDER_FILTER_OPTIONS,
  MOPH_FILTER_OPTIONS,
  NEGOTIATE_FILTER_OPTIONS,
} from "@/lib/caseHelpers";

interface CasesToolbarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit: () => void;
  filterNegotiate: string;
  onFilterNegotiateChange: (value: string) => void;
  filterCompleteness: string;
  onFilterCompletenessChange: (value: string) => void;
  filterGender: string;
  onFilterGenderChange: (value: string) => void;
  filterMoph: string;
  onFilterMophChange: (value: string) => void;
  activeFilterCount: number;
  onResetFilters: () => void;
}

export function CasesToolbar({
  searchTerm,
  onSearchChange,
  onSearchSubmit,
  filterNegotiate,
  onFilterNegotiateChange,
  filterCompleteness,
  onFilterCompletenessChange,
  filterGender,
  onFilterGenderChange,
  filterMoph,
  onFilterMophChange,
  activeFilterCount,
  onResetFilters,
}: CasesToolbarProps) {
  return (
    <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white">
      <div className="relative flex-1 max-w-sm">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="ค้นหา HN, ชื่อ-สกุล . . . "
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSearchSubmit()}
          className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
        />
      </div>

      <div className="flex items-center gap-2.5">
        <Popover>
          <Button
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-xl border transition-all cursor-pointer ${
              activeFilterCount > 0
                ? "bg-sky-50 border-sky-300 text-sky-700 shadow-xs"
                : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
            }`}
            variant="outline"
          >
            <Filter className="w-4 h-4 text-slate-500" />
            <span>ตัวกรอง</span>
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-sky-600 text-white text-[11px] font-bold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </Button>

          <Popover.Content
            className="w-72 p-4 shadow-xl border border-slate-200/90 rounded-2xl bg-white z-50"
            offset={8}
          >
            <Popover.Dialog className="outline-none focus:outline-none">
              <Popover.Arrow />
              <div className="flex flex-col gap-3.5">
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-sky-600" />
                    <span className="font-semibold text-sm text-slate-800">
                      ตัวกรองข้อมูล
                    </span>
                  </div>
                  {activeFilterCount > 0 && (
                    <button
                      type="button"
                      onClick={onResetFilters}
                      className="text-xs text-sky-600 hover:text-sky-700 font-semibold hover:underline cursor-pointer"
                    >
                      ล้างตัวกรอง
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                    ผลเจรจา
                  </label>
                  <CustomSelect
                    value={filterNegotiate}
                    onChange={onFilterNegotiateChange}
                    options={NEGOTIATE_FILTER_OPTIONS}
                    popoverClassName="z-[80]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                    สถานะข้อมูล
                  </label>
                  <CustomSelect
                    value={filterCompleteness}
                    onChange={onFilterCompletenessChange}
                    options={COMPLETENESS_FILTER_OPTIONS}
                    popoverClassName="z-[80]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                    เพศ
                  </label>
                  <CustomSelect
                    value={filterGender}
                    onChange={onFilterGenderChange}
                    options={GENDER_FILTER_OPTIONS}
                    popoverClassName="z-[80]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                    สถานะส่ง สธ. (MOPH)
                  </label>
                  <CustomSelect
                    value={filterMoph}
                    onChange={onFilterMophChange}
                    options={MOPH_FILTER_OPTIONS}
                    popoverClassName="z-[80]"
                  />
                </div>
              </div>
            </Popover.Dialog>
          </Popover.Content>
        </Popover>
      </div>
    </div>
  );
}
