"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import {
  Calendar as CalendarIcon,
  Clock,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  RotateCcw,
  Check,
} from "lucide-react";
import { formatToLocalDateTimeInput } from "@/lib/caseHelpers";

const THAI_MONTHS = [
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม",
] as const;

const THAI_SHORT_MONTHS = [
  "ม.ค.",
  "ก.พ.",
  "มี.ค.",
  "เม.ย.",
  "พ.ค.",
  "มิ.ย.",
  "ก.ค.",
  "ส.ค.",
  "ก.ย.",
  "ต.ค.",
  "พ.ย.",
  "ธ.ค.",
] as const;

const THAI_WEEKDAYS = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"] as const;

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);

interface ParsedDateTime {
  year: number;
  month: number; // 0-11
  day: number; // 1-31
  hour: number; // 0-23
  minute: number; // 0-59
}

function parseLocalDateTimeString(value: string): ParsedDateTime | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  if (
    month < 0 ||
    month > 11 ||
    day < 1 ||
    day > 31 ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return null;
  }
  return { year, month, day, hour, minute };
}

function buildLocalDateTimeString(dt: ParsedDateTime): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${dt.year}-${pad(dt.month + 1)}-${pad(dt.day)}T${pad(dt.hour)}:${pad(dt.minute)}`;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

interface CalendarCellItem {
  year: number;
  month: number;
  day: number;
  isCurrentMonth: boolean;
}

function buildCalendarGrid(year: number, month: number): CalendarCellItem[] {
  const firstDay = getFirstDayOfWeek(year, month);
  const daysInCurrent = getDaysInMonth(year, month);

  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;
  const daysInPrev = getDaysInMonth(prevYear, prevMonth);

  const nextMonth = month === 11 ? 0 : month + 1;
  const nextYear = month === 11 ? year + 1 : year;

  const cells: CalendarCellItem[] = [];

  for (let i = firstDay - 1; i >= 0; i--) {
    cells.push({
      year: prevYear,
      month: prevMonth,
      day: daysInPrev - i,
      isCurrentMonth: false,
    });
  }

  for (let d = 1; d <= daysInCurrent; d++) {
    cells.push({
      year,
      month,
      day: d,
      isCurrentMonth: true,
    });
  }

  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) {
    cells.push({
      year: nextYear,
      month: nextMonth,
      day: d,
      isCurrentMonth: false,
    });
  }

  return cells;
}

interface DateTimePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function DateTimePicker({
  value,
  onChange,
  placeholder = "เลือกวันและเวลา",
}: DateTimePickerProps) {
  const parsed = useMemo(() => parseLocalDateTimeString(value), [value]);

  const [isOpen, setIsOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<"month" | "year" | null>(null);
  const [viewYear, setViewYear] = useState<number>(() => parsed?.year ?? 2026);
  const [viewMonth, setViewMonth] = useState<number>(() => parsed?.month ?? 0);
  const [today, setToday] = useState<{ year: number; month: number; day: number } | null>(
    null,
  );

  const containerRef = useRef<HTMLDivElement | null>(null);
  const hourListRef = useRef<HTMLDivElement | null>(null);
  const minuteListRef = useRef<HTMLDivElement | null>(null);

  // ปิด Popover เมื่อคลิกนอกกรอบหรือกด Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleMouseDown = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        setOpenMenu(null);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (openMenu) {
          setOpenMenu(null);
        } else {
          setIsOpen(false);
        }
      }
    };

    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, openMenu]);

  // เลื่อนรายการชั่วโมงและนาทีไปยังค่าที่เลือกเมื่อเปิด Popover
  useEffect(() => {
    if (!isOpen || !parsed) return;
    const scrollContainer = (
      container: HTMLDivElement | null,
      selectedIndex: number,
    ) => {
      if (!container) return;
      const itemHeight = 32;
      container.scrollTop = Math.max(0, selectedIndex * itemHeight - itemHeight * 2);
    };
    scrollContainer(hourListRef.current, parsed.hour);
    scrollContainer(minuteListRef.current, parsed.minute);
  }, [isOpen, parsed]);

  const handleToggleOpen = () => {
    if (!isOpen) {
      const now = new Date();
      setToday({
        year: now.getFullYear(),
        month: now.getMonth(),
        day: now.getDate(),
      });
      if (parsed) {
        setViewYear(parsed.year);
        setViewMonth(parsed.month);
      } else {
        setViewYear(now.getFullYear());
        setViewMonth(now.getMonth());
      }
    }
    setOpenMenu(null);
    setIsOpen((prev) => !prev);
  };

  const ensureBaseDateTime = (): ParsedDateTime => {
    if (parsed) return parsed;
    const now = new Date();
    return {
      year: now.getFullYear(),
      month: now.getMonth(),
      day: now.getDate(),
      hour: now.getHours(),
      minute: now.getMinutes(),
    };
  };

  const handleSelectDay = (cell: CalendarCellItem) => {
    const base = ensureBaseDateTime();
    setViewYear(cell.year);
    setViewMonth(cell.month);
    setOpenMenu(null);
    onChange(
      buildLocalDateTimeString({
        ...base,
        year: cell.year,
        month: cell.month,
        day: cell.day,
      }),
    );
  };

  const handleSelectHour = (hour: number) => {
    const base = ensureBaseDateTime();
    setOpenMenu(null);
    onChange(buildLocalDateTimeString({ ...base, hour }));
  };

  const handleSelectMinute = (minute: number) => {
    const base = ensureBaseDateTime();
    setOpenMenu(null);
    onChange(buildLocalDateTimeString({ ...base, minute }));
  };

  const handlePrevMonth = () => {
    setOpenMenu(null);
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    setOpenMenu(null);
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleSetNow = () => {
    const now = new Date();
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
    setToday({
      year: now.getFullYear(),
      month: now.getMonth(),
      day: now.getDate(),
    });
    setOpenMenu(null);
    onChange(formatToLocalDateTimeInput(now));
  };

  const calendarCells = useMemo(
    () => buildCalendarGrid(viewYear, viewMonth),
    [viewYear, viewMonth],
  );

  const yearOptions = useMemo(() => {
    const baseYear = parsed?.year ?? viewYear;
    const start = baseYear - 5;
    return Array.from({ length: 11 }, (_, i) => start + i);
  }, [parsed?.year, viewYear]);

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Trigger Pill Button */}
      <button
        type="button"
        onClick={handleToggleOpen}
        className={`w-full h-11 px-5 bg-white border rounded-full text-sm font-medium flex items-center justify-between transition-all cursor-pointer ${
          isOpen
            ? "border-sky-400 ring-2 ring-sky-100"
            : "border-slate-200/90 hover:bg-slate-50/70 hover:border-slate-300"
        }`}
      >
        {parsed ? (
          <div className="flex items-center gap-2.5 truncate">
            <span className="text-slate-700 font-medium">
              {parsed.day} {THAI_MONTHS[parsed.month]} {parsed.year + 543}
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-[#0288d1] border border-sky-200/70">
              <Clock className="w-3 h-3" />
              {pad(parsed.hour)}:{pad(parsed.minute)} น.
            </span>
          </div>
        ) : (
          <span className="text-slate-400">{placeholder}</span>
        )}
        <CalendarIcon
          className={`w-4 h-4 shrink-0 transition-colors ${
            isOpen ? "text-[#0288d1]" : "text-slate-400"
          }`}
        />
      </button>

      {/* Popover Calendar + 24h Time Picker */}
      {isOpen && (
        <div className="absolute right-0 bottom-[calc(100%+10px)] z-50 w-full sm:w-[468px] bg-white rounded-[28px] border border-slate-200/90 shadow-[0_14px_45px_rgba(15,23,42,0.14)] p-4 sm:p-5 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Left: Calendar Grid */}
            <div className="flex-1">
              {/* Month & Year Navigation Header */}
              <div className="flex items-center justify-between gap-1 mb-3">
                <button
                  type="button"
                  onClick={handlePrevMonth}
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
                      onClick={() =>
                        setOpenMenu((prev) => (prev === "month" ? null : "month"))
                      }
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
                                setViewMonth(idx);
                                setOpenMenu(null);
                              }}
                              className={`w-full px-3 py-1.5 text-xs rounded-xl text-left transition-colors flex items-center justify-between cursor-pointer ${
                                isSelectedMonth
                                  ? "bg-sky-50 text-[#0288d1] font-bold"
                                  : "text-slate-700 font-medium hover:bg-slate-50"
                              }`}
                            >
                              <span>{m}</span>
                              {isSelectedMonth && (
                                <Check className="w-3.5 h-3.5 text-[#0288d1]" />
                              )}
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
                      onClick={() =>
                        setOpenMenu((prev) => (prev === "year" ? null : "year"))
                      }
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
                                setViewYear(y);
                                setOpenMenu(null);
                              }}
                              className={`w-full px-3 py-1.5 text-xs rounded-xl text-left transition-colors flex items-center justify-between cursor-pointer ${
                                isSelectedYear
                                  ? "bg-sky-50 text-[#0288d1] font-bold"
                                  : "text-slate-700 font-medium hover:bg-slate-50"
                              }`}
                            >
                              <span>พ.ศ. {y + 543}</span>
                              {isSelectedYear && (
                                <Check className="w-3.5 h-3.5 text-[#0288d1]" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleNextMonth}
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
                      onClick={() => handleSelectDay(cell)}
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

            {/* Right: 24-Hour Time Picker */}
            <div className="sm:w-36 sm:border-l sm:border-slate-100 sm:pl-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-slate-600 mb-2 py-1.5 bg-slate-50 rounded-full border border-slate-100">
                  <Clock className="w-3.5 h-3.5 text-[#29b6f6]" />
                  <span>
                    {parsed
                      ? `${pad(parsed.hour)} : ${pad(parsed.minute)} น.`
                      : "00 : 00 น."}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-1.5 text-center text-[10px] font-bold text-slate-400 mb-1">
                  <span>ชม. (00-23)</span>
                  <span>นาที (00-59)</span>
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  {/* Hours Column */}
                  <div
                    ref={hourListRef}
                    className="h-44 overflow-y-auto rounded-2xl border border-slate-100 bg-slate-50/60 p-1 space-y-0.5 scrollbar-thin"
                  >
                    {HOURS.map((h) => {
                      const active = parsed?.hour === h;
                      return (
                        <button
                          key={h}
                          type="button"
                          onClick={() => handleSelectHour(h)}
                          className={`w-full h-7 rounded-full text-xs font-semibold flex items-center justify-center transition-colors cursor-pointer ${
                            active
                              ? "bg-[#29b6f6] text-white font-bold shadow-2xs"
                              : "text-slate-600 hover:bg-white hover:text-slate-900"
                          }`}
                        >
                          {pad(h)}
                        </button>
                      );
                    })}
                  </div>

                  {/* Minutes Column */}
                  <div
                    ref={minuteListRef}
                    className="h-44 overflow-y-auto rounded-2xl border border-slate-100 bg-slate-50/60 p-1 space-y-0.5 scrollbar-thin"
                  >
                    {MINUTES.map((m) => {
                      const active = parsed?.minute === m;
                      return (
                        <button
                          key={m}
                          type="button"
                          onClick={() => handleSelectMinute(m)}
                          className={`w-full h-7 rounded-full text-xs font-semibold flex items-center justify-center transition-colors cursor-pointer ${
                            active
                              ? "bg-[#29b6f6] text-white font-bold shadow-2xs"
                              : "text-slate-600 hover:bg-white hover:text-slate-900"
                          }`}
                        >
                          {pad(m)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Bar */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleSetNow}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-sky-600 bg-sky-50 hover:bg-sky-100/80 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>วันเวลาปัจจุบัน</span>
            </button>

            <div className="flex items-center gap-2">
              {parsed && (
                <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
                  {parsed.day} {THAI_SHORT_MONTHS[parsed.month]} {parsed.year + 543} •{" "}
                  {pad(parsed.hour)}:{pad(parsed.minute)} น.
                </span>
              )}
              <button
                type="button"
                onClick={() => {
                  setOpenMenu(null);
                  setIsOpen(false);
                }}
                className="inline-flex items-center gap-1 px-4 py-1.5 rounded-full text-xs font-semibold bg-[#29b6f6] hover:bg-[#0288d1] text-white shadow-xs transition-all cursor-pointer active:scale-95"
              >
                <Check className="w-3.5 h-3.5" />
                <span>ตกลง</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
