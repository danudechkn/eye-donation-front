"use client";

import type { RefObject } from "react";
import { Clock } from "lucide-react";
import { HOURS, MINUTES, pad2, type ParsedDateTime } from "./dateTimeUtils";

interface TimePickerPanelProps {
  parsed: ParsedDateTime | null;
  hourListRef: RefObject<HTMLDivElement | null>;
  minuteListRef: RefObject<HTMLDivElement | null>;
  onSelectHour: (hour: number) => void;
  onSelectMinute: (minute: number) => void;
}

export function TimePickerPanel({
  parsed,
  hourListRef,
  minuteListRef,
  onSelectHour,
  onSelectMinute,
}: TimePickerPanelProps) {
  return (
    <div className="sm:w-36 sm:border-l sm:border-slate-100 sm:pl-4 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-slate-600 mb-2 py-1.5 bg-slate-50 rounded-full border border-slate-100">
          <Clock className="w-3.5 h-3.5 text-[#29b6f6]" />
          <span>
            {parsed ? `${pad2(parsed.hour)} : ${pad2(parsed.minute)} น.` : "00 : 00 น."}
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
                  onClick={() => onSelectHour(h)}
                  className={`w-full h-7 rounded-full text-xs font-semibold flex items-center justify-center transition-colors cursor-pointer ${
                    active
                      ? "bg-[#29b6f6] text-white font-bold shadow-2xs"
                      : "text-slate-600 hover:bg-white hover:text-slate-900"
                  }`}
                >
                  {pad2(h)}
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
                  onClick={() => onSelectMinute(m)}
                  className={`w-full h-7 rounded-full text-xs font-semibold flex items-center justify-center transition-colors cursor-pointer ${
                    active
                      ? "bg-[#29b6f6] text-white font-bold shadow-2xs"
                      : "text-slate-600 hover:bg-white hover:text-slate-900"
                  }`}
                >
                  {pad2(m)}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
