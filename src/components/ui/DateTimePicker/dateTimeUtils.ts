// ============================================================
// DateTimePicker Constants & Pure Date Helpers
// ============================================================

export const THAI_MONTHS = [
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

export const THAI_SHORT_MONTHS = [
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

export const THAI_WEEKDAYS = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"] as const;

export const HOURS = Array.from({ length: 24 }, (_, i) => i);
export const MINUTES = Array.from({ length: 60 }, (_, i) => i);

export interface ParsedDateTime {
  year: number;
  month: number; // 0-11
  day: number; // 1-31
  hour: number; // 0-23
  minute: number; // 0-59
}

export interface CalendarCellItem {
  year: number;
  month: number;
  day: number;
  isCurrentMonth: boolean;
}

export function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

export function parseLocalDateTimeString(value: string): ParsedDateTime | null {
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

export function buildLocalDateTimeString(dt: ParsedDateTime): string {
  return `${dt.year}-${pad2(dt.month + 1)}-${pad2(dt.day)}T${pad2(dt.hour)}:${pad2(dt.minute)}`;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

export function buildCalendarGrid(year: number, month: number): CalendarCellItem[] {
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
