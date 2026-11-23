"use client";

import { ChevronLeft, ChevronRight, ChevronDown, Check } from "lucide-react";
import {
  THAI_MONTHS,
  THAI_WEEKDAYS,
  type CalendarCellItem,
  type ParsedDateTime,
} from "./dateTimeUtils";

interface CalendarPanelProps {
  viewYear: number;
  viewMonth: number;
  yearOptions: number[];
  calendarCells: CalendarCellItem[];
  parsed: ParsedDateTime | null;
  today: { year: number; month: number; day: number } | null;
  openMenu: "month" | "year" | null;
  onToggleMenu: (menu: "month" | "year") => void;
  onCloseMenu: () => void;
  onSelectMonth: (month: number) => void;
  onSelectYear: (year: number) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onSelectDay: (cell: CalendarCellItem) => void;
}

export function CalendarPanel({
  viewYear,
  viewMonth,
  yearOptions,
  calendarCells,
  parsed,
  today,
  openMenu,
  onToggleMenu,
  onCloseMenu,
  onSelectMonth,
  onSelectYear,
  onPrevMonth,
  onNextMonth,
  onSelectDay,
}: CalendarPanelProps) {
  return (
    <div className="flex-1">
      {/* Month & Year Navigation Header */}
      <div className="flex items-center justify-between gap-1 mb-3">
        <button
          type="button"
          onClick={onPrevMonth}
          className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
          aria-label="เดือนก่อนหน้า"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-1.5">
          {/* Custom Rounded Month Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => onToggleMenu("month")}
              className={`h-8 inline-flex items-center justify-center gap-1.5 text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border rounded-full px-3 whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                openMenu === "month"
                  ? "border-sky-400 ring-2 ring-sky-100 bg-white text-[#0288d1]"
                  : "border-slate-200/80"
              }`}
            >
              <span>{THAI_MONTHS[viewMonth]}</span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${
                  openMenu === "month" ? "rotate-180 text-[#0288d1]" : ""
                }`}
              />
            </button>

            {openMenu === "month" && (
              <div className="absolute left-0 top-[calc(100%+6px)] z-50 w-36 max-h-56 overflow-y-auto bg-white border border-slate-200/90 rounded-2xl shadow-[0_10px_30px_rgba(15,23,42,0.12)] p-1.5 space-y-0.5 animate-in fade-in zoom-in-95 duration-150">
                {THAI_MONTHS.map((m, idx) => {
                  const isSelectedMonth = idx === viewMonth;
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => {
                        onSelectMonth(idx);
                        onCloseMenu();
                      }}
                      className={`w-full px-3 py-1.5 text-xs rounded-xl text-left transition-colors flex items-center justify-between cursor-pointer ${
                        isSelectedMonth
                          ? "bg-sky-50 text-[#0288d1] font-bold"
                          : "text-slate-700 font-medium hover:bg-slate-50"
                      }`}
                    >
                      <span>{m}</span>
                      {isSelectedMonth && <Check className="w-3.5 h-3.5 text-[#0288d1]" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Custom Rounded Year Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => onToggleMenu("year")}
              className={`h-8 inline-flex items-center justify-center gap-1.5 text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border rounded-full px-3 whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                openMenu === "year"
                  ? "border-sky-400 ring-2 ring-sky-100 bg-white text-[#0288d1]"
                  : "border-slate-200/80"
              }`}
            >
              <span>พ.ศ. {viewYear + 543}</span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${
                  openMenu === "year" ? "rotate-180 text-[#0288d1]" : ""
                }`}
              />
            </button>

            {openMenu === "year" && (
              <div className="absolute right-0 top-[calc(100%+6px)] z-50 w-32 max-h-56 overflow-y-auto bg-white border border-slate-200/90 rounded-2xl shadow-[0_10px_30px_rgba(15,23,42,0.12)] p-1.5 space-y-0.5 animate-in fade-in zoom-in-95 duration-150">
                {yearOptions.map((y) => {
                  const isSelectedYear = y === viewYear;
                  return (
                    <button
                      key={y}
                      type="button"
                      onClick={() => {
                        onSelectYear(y);
                        onCloseMenu();
                      }}
                      className={`w-full px-3 py-1.5 text-xs rounded-xl text-left transition-colors flex items-center justify-between cursor-pointer ${
                        isSelectedYear
                          ? "bg-sky-50 text-[#0288d1] font-bold"
                          : "text-slate-700 font-medium hover:bg-slate-50"
                      }`}
                    >
                      <span>พ.ศ. {y + 543}</span>
                      {isSelectedYear && <Check className="w-3.5 h-3.5 text-[#0288d1]" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={onNextMonth}
          className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
          aria-label="เดือนถัดไป"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-1 mb-1.5 text-center">
        {THAI_WEEKDAYS.map((day, idx) => (
          <span
            key={day}
            className={`text-[11px] font-bold py-1 ${
              idx === 0
                ? "text-rose-400"
                : idx === 6
                  ? "text-sky-500"
                  : "text-slate-400"
            }`}
          >
            {day}
          </span>
        ))}
      </div>

      {/* Day Cells (Circular Pills) */}
      <div className="grid grid-cols-7 gap-1 place-items-center">
        {calendarCells.map((cell, idx) => {
          const isSelected =
            parsed !== null &&
            parsed.year === cell.year &&
            parsed.month === cell.month &&
            parsed.day === cell.day;

          const isToday =
            today !== null &&
            today.year === cell.year &&
            today.month === cell.month &&
            today.day === cell.day;

          return (
            <button
              key={`${cell.year}-${cell.month}-${cell.day}-${idx}`}
              type="button"
              onClick={() => onSelectDay(cell)}
              className={`h-8 w-8 rounded-full text-xs font-semibold flex items-center justify-center transition-all cursor-pointer ${
                isSelected
                  ? "bg-[#29b6f6] text-white font-bold shadow-sm shadow-sky-400/40 scale-105"
                  : isToday
                    ? "bg-sky-50 text-[#0288d1] border border-sky-300 font-bold"
                    : cell.isCurrentMonth
                      ? "text-slate-700 hover:bg-slate-100"
                      : "text-slate-300 hover:bg-slate-50 hover:text-slate-500"
              }`}
            >
              {cell.day}
            </button>
          );
        })}
      </div>
    </div>
  );
}
