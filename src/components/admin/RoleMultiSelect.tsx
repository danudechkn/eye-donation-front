"use client";

import { Check, ChevronDown } from "lucide-react";
import { Popover, Button } from "@heroui/react";
import { APP_ROLE_BADGE_STYLES, APP_ROLE_LABELS } from "@/lib/roles";
import type { AppRole } from "@/types";

interface RoleMultiSelectProps {
  value: AppRole;
  onChange: (nextRole: AppRole) => void;
  disabled?: boolean;
}

const ROLE_CHOICES: {
  key: "eye" | "organ" | "admin";
  label: string;
  hint?: string;
  dotColor: string;
  activeRow: string;
  activeText: string;
  activeCheck: string;
}[] = [
  {
    key: "eye",
    label: "บริจาคดวงตา (Eye)",
    dotColor: "bg-sky-500",
    activeRow: "bg-sky-50/90 text-sky-800",
    activeText: "font-bold text-sky-700",
    activeCheck: "bg-sky-500 border-sky-500 text-white shadow-2xs",
  },
  {
    key: "organ",
    label: "บริจาคอวัยวะ (Organ)",
    dotColor: "bg-rose-500",
    activeRow: "bg-rose-50/90 text-rose-800",
    activeText: "font-bold text-rose-700",
    activeCheck: "bg-rose-500 border-rose-500 text-white shadow-2xs",
  },
  {
    key: "admin",
    label: "ผู้ดูแลระบบ (เห็นทั้งหมด)",
    hint: "ดวงตา + อวัยวะ + จัดการสิทธิ์",
    dotColor: "bg-emerald-500",
    activeRow: "bg-emerald-50/90 text-emerald-800",
    activeText: "font-bold text-emerald-700",
    activeCheck: "bg-emerald-500 border-emerald-500 text-white shadow-2xs",
  },
];

export function RoleMultiSelect({
  value,
  onChange,
  disabled = false,
}: RoleMultiSelectProps) {
  const isEyeChecked = value === "eye" || value === "both";
  const isOrganChecked = value === "organ" || value === "both";
  const isAdminChecked = value === "admin";

  const isChecked = (key: "eye" | "organ" | "admin") => {
    if (key === "eye") return isEyeChecked;
    if (key === "organ") return isOrganChecked;
    return isAdminChecked;
  };

  const handleToggle = (key: "eye" | "organ" | "admin") => {
    if (disabled) return;

    if (key === "admin") {
      onChange(value === "admin" ? "both" : "admin");
      return;
    }

    if (key === "eye") {
      if (value === "admin") {
        onChange("eye");
      } else if (value === "organ") {
        onChange("both");
      } else if (value === "both") {
        onChange("organ");
      }
      return;
    }

    if (key === "organ") {
      if (value === "admin") {
        onChange("organ");
      } else if (value === "eye") {
        onChange("both");
      } else if (value === "both") {
        onChange("eye");
      }
    }
  };

  const style = APP_ROLE_BADGE_STYLES[value];

  return (
    <Popover>
      <Button
        isDisabled={disabled}
        variant="outline"
        className={`w-full h-10 px-3.5 border rounded-full text-xs sm:text-sm font-semibold flex items-center justify-between gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${style.pill}`}
      >
        <span className="flex items-center gap-2 min-w-0">
          <span className="flex items-center -space-x-0.5 shrink-0">
            {style.dots.map((dotCls, idx) => (
              <span
                key={idx}
                className={`w-2 h-2 rounded-full ring-1 ring-white ${dotCls}`}
              />
            ))}
          </span>
          <span className="truncate">{APP_ROLE_LABELS[value]}</span>
        </span>
        <ChevronDown className={`w-4 h-4 shrink-0 ${style.chevron}`} />
      </Button>

      <Popover.Content
        placement="bottom start"
        offset={6}
        className="z-[95] w-64 bg-white border border-slate-200/90 rounded-2xl shadow-[0_12px_32px_rgba(15,23,42,0.14)] p-1.5"
      >
        <Popover.Dialog className="outline-none focus:outline-none space-y-0.5">
          <p className="px-3 pt-1 pb-1.5 text-[11px] font-medium text-slate-400">
            เลือกได้ 2 สิทธิ์ (ดวงตา + อวัยวะ)
          </p>

          {ROLE_CHOICES.map((opt) => {
            const checked = isChecked(opt.key);
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => handleToggle(opt.key)}
                className={`w-full px-3 py-2 rounded-xl text-left flex items-center gap-2.5 transition-colors cursor-pointer ${
                  checked ? opt.activeRow : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span
                  className={`w-4.5 h-4.5 rounded-md border flex items-center justify-center shrink-0 transition-all ${
                    checked ? opt.activeCheck : "bg-white border-slate-300"
                  }`}
                >
                  {checked && <Check className="w-3 h-3 stroke-[3]" />}
                </span>
                <div className="min-w-0 flex-1">
                  <span
                    className={`flex items-center gap-1.5 text-xs sm:text-sm leading-snug ${
                      checked ? opt.activeText : "font-medium text-slate-700"
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full shrink-0 ${opt.dotColor}`} />
                    <span className="truncate">{opt.label}</span>
                  </span>
                  {opt.hint && (
                    <span className="block text-[10px] text-slate-400 leading-tight mt-0.5 pl-3.5">
                      {opt.hint}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </Popover.Dialog>
      </Popover.Content>
    </Popover>
  );
}
