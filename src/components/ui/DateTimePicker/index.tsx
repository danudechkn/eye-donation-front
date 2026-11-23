"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Calendar as CalendarIcon, Clock, RotateCcw, Check } from "lucide-react";
import { formatToLocalDateTimeInput } from "@/lib/caseHelpers";
import { CalendarPanel } from "./CalendarPanel";
import { TimePickerPanel } from "./TimePickerPanel";
import {
  THAI_MONTHS,
  THAI_SHORT_MONTHS,
  buildCalendarGrid,
  buildLocalDateTimeString,
  pad2,
  parseLocalDateTimeString,
  type CalendarCellItem,
  type ParsedDateTime,
} from "./dateTimeUtils";

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
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
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
    const scrollContainer = (container: HTMLDivElement | null, selectedIndex: number) => {
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
              {pad2(parsed.hour)}:{pad2(parsed.minute)} น.
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
            <CalendarPanel
              viewYear={viewYear}
              viewMonth={viewMonth}
              yearOptions={yearOptions}
              calendarCells={calendarCells}
              parsed={parsed}
              today={today}
              openMenu={openMenu}
              onToggleMenu={(menu) => setOpenMenu((prev) => (prev === menu ? null : menu))}
              onCloseMenu={() => setOpenMenu(null)}
              onSelectMonth={setViewMonth}
              onSelectYear={setViewYear}
              onPrevMonth={handlePrevMonth}
              onNextMonth={handleNextMonth}
              onSelectDay={handleSelectDay}
            />

            <TimePickerPanel
              parsed={parsed}
              hourListRef={hourListRef}
              minuteListRef={minuteListRef}
              onSelectHour={handleSelectHour}
              onSelectMinute={handleSelectMinute}
            />
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
                  {pad2(parsed.hour)}:{pad2(parsed.minute)} น.
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
