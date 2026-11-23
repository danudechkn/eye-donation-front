"use client";

import Link from "next/link";
import { Plus, ClipboardList } from "lucide-react";
import { Select, ListBox } from "@heroui/react";
import { CiCalendar } from "react-icons/ci";
import { MONTH_OPTIONS } from "./constants";

interface DashboardHeaderProps {
  selectedYear: string;
  selectedMonth: string;
  yearOptions: number[];
  onYearChange: (year: string) => void;
  onMonthChange: (month: string) => void;
}

export function DashboardHeader({
  selectedYear,
  selectedMonth,
  yearOptions,
  onYearChange,
  onMonthChange,
}: DashboardHeaderProps) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.02)]">
      <div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">
            แดชบอร์ดภาพรวมการบริจาคดวงตา
          </h1>
        </div>
        <p className="text-sm text-slate-500 mt-1.5 font-medium max-w-2xl">
          รายงานสถิติแบบเรียลไทม์ ติดตามกระบวนการคัดกรอง เจรจาขอความยินยอม และการจัดเก็บดวงตา
        </p>
      </div>

      <div className="flex items-center gap-2.5 flex-wrap">
        {/* Filter: ปี */}
        <Select
          aria-label="เลือกปี"
          selectedKey={selectedYear}
          onSelectionChange={(key) => {
            if (key != null) onYearChange(String(key));
          }}
          className="w-auto"
        >
          <Select.Trigger className="h-[42px] pl-3.5 pr-8 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 font-semibold text-sm rounded-xl shadow-2xs transition-all relative flex items-center gap-1.5 cursor-pointer active:scale-[0.98] data-[focus=true]:border-sky-400 data-[focus=true]:ring-2 data-[focus=true]:ring-sky-100">
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <CiCalendar className="w-4.5 h-4.5 text-slate-500 shrink-0" />
              <Select.Value className="text-sm font-semibold text-slate-700" />
            </div>
            <Select.Indicator className="text-slate-400 shrink-0 absolute right-2.5 inset-y-0 my-auto" />
          </Select.Trigger>
          <Select.Popover className="z-50 min-w-[140px] max-h-72 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg p-1">
            <ListBox className="outline-none">
              {yearOptions.map((y) => (
                <ListBox.Item
                  key={String(y)}
                  id={String(y)}
                  textValue={`พ.ศ. ${y + 543}`}
                  className="px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg cursor-pointer outline-none data-[selected=true]:bg-sky-50 data-[selected=true]:text-[#0288d1] data-[selected=true]:font-bold transition-colors"
                >
                  พ.ศ. {y + 543}
                </ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>

        {/* Filter: เดือน */}
        <Select
          aria-label="เลือกเดือน"
          selectedKey={selectedMonth}
          onSelectionChange={(key) => {
            if (key != null) onMonthChange(String(key));
          }}
          className="w-auto"
        >
          <Select.Trigger className="h-[42px] pl-3.5 pr-8 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 font-semibold text-sm rounded-xl shadow-2xs transition-all relative flex items-center gap-1.5 cursor-pointer active:scale-[0.98] data-[focus=true]:border-sky-400 data-[focus=true]:ring-2 data-[focus=true]:ring-sky-100">
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="text-xs font-bold text-slate-500 shrink-0">เดือน :</span>
              <Select.Value className="text-sm font-semibold text-slate-700" />
            </div>
            <Select.Indicator className="text-slate-400 shrink-0 absolute right-2.5 inset-y-0 my-auto" />
          </Select.Trigger>
          <Select.Popover className="z-50 min-w-[180px] max-h-72 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg p-1">
            <ListBox className="outline-none">
              {MONTH_OPTIONS.map((m) => (
                <ListBox.Item
                  key={m.value}
                  id={m.value}
                  textValue={m.label}
                  className="px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg cursor-pointer outline-none data-[selected=true]:bg-sky-50 data-[selected=true]:text-[#0288d1] data-[selected=true]:font-bold transition-colors"
                >
                  {m.label}
                </ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>

        <Link
          href="/cases"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-semibold text-sm rounded-xl shadow-2xs transition-all hover:bg-slate-50 cursor-pointer active:scale-[0.98]"
        >
          <ClipboardList className="w-4 h-4 text-slate-500" />
          <span>ทะเบียนเคส</span>
        </Link>

        <Link
          href="/cases/form"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#29b6f6] hover:bg-[#0288d1] text-white font-semibold text-sm rounded-xl shadow-2xs transition-all active:scale-[0.98] cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>บันทึกเคสใหม่</span>
        </Link>
      </div>
    </div>
  );
}
