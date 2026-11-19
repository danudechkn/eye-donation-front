"use client";

import { Select, ListBox } from "@heroui/react";
import type { SelectOption } from "@/lib/caseHelpers";

interface CustomSelectProps<T extends string | number> {
  value?: T | null;
  onChange: (val: T) => void;
  options: SelectOption<T>[];
  placeholder?: string;
  popoverClassName?: string;
}

export function CustomSelect<T extends string | number>({
  value,
  onChange,
  options,
  placeholder = "-- เลือก --",
  popoverClassName,
}: CustomSelectProps<T>) {
  const isNumberValue =
    typeof value === "number" ||
    (options.length > 0 && typeof options[0].value === "number");

  const selectedKey =
    value != null && (!isNumberValue || value !== 0) ? String(value) : null;

  return (
    <Select
      aria-label="Select option"
      placeholder={placeholder}
      selectedKey={selectedKey}
      onSelectionChange={(key) => {
        if (key == null) return;
        const parsed = (isNumberValue ? Number(key) : String(key)) as T;
        onChange(parsed);
      }}
    >
      <Select.Trigger className="h-11 px-5 bg-white border border-slate-200/90 rounded-full data-[focus=true]:border-sky-400 data-[focus=true]:ring-2 data-[focus=true]:ring-sky-100 shadow-none data-[hover=true]:bg-slate-50 transition-all w-full flex items-center justify-between">
        <Select.Value className="text-sm font-medium text-slate-700 data-[placeholder]:text-slate-400 group-data-[has-value=true]:text-slate-700" />
      </Select.Trigger>
      <Select.Popover className={popoverClassName}>
        <ListBox>
          {options.map((opt) => (
            <ListBox.Item
              key={String(opt.value)}
              id={String(opt.value)}
              textValue={opt.label}
            >
              {opt.label}
            </ListBox.Item>
          ))}
        </ListBox>
      </Select.Popover>
    </Select>
  );
}
