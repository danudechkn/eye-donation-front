// ============================================================
// Shared Case Domain Constants & Helpers
// ============================================================

import type { DonorCaseItem } from "@/types";

export interface SelectOption<T extends string | number = string> {
  value: T;
  label: string;
}

// ── Filter Options (Cases Table) ────────────────────────────────────────────

export const NEGOTIATE_FILTER_OPTIONS: SelectOption<string>[] = [
  { value: "all", label: "ทั้งหมด" },
  { value: "success", label: "สำเร็จ" },
  { value: "failed", label: "ไม่สำเร็จ" },
];

export const COMPLETENESS_FILTER_OPTIONS: SelectOption<string>[] = [
  { value: "all", label: "ทั้งหมด" },
  { value: "complete", label: "ข้อมูลครบ" },
  { value: "incomplete", label: "ข้อมูลไม่ครบ" },
];

export const GENDER_FILTER_OPTIONS: SelectOption<string>[] = [
  { value: "all", label: "ทั้งหมด" },
  { value: "male", label: "ชาย" },
  { value: "female", label: "หญิง" },
];

export const MOPH_FILTER_OPTIONS: SelectOption<string>[] = [
  { value: "all", label: "ทั้งหมด" },
  { value: "pending", label: "ยังไม่ส่ง (รอส่ง)" },
  { value: "sent", label: "ส่งแล้ว" },
];

// ── Form Select Options (Create / Edit Case) ────────────────────────────────

export const DEATH_TYPE_OPTIONS: SelectOption<number>[] = [
  { value: 1, label: "Brain Death" },
  { value: 2, label: "Cardiac Death" },
];

export const POTENTIAL_OPTIONS: SelectOption<number>[] = [
  { value: 3, label: "Yes" },
  { value: 4, label: "No" },
];

export const CHK_POTENTIAL_OPTIONS: SelectOption<number>[] = [
  { value: 5, label: "Evaluated" },
  { value: 6, label: "Not Evaluated" },
];

export const WARD_TO_TC_OPTIONS: SelectOption<number>[] = [
  { value: 7, label: "แจ้ง TC แล้ว" },
  { value: 8, label: "ไม่ได้แจ้ง" },
];

export const NEGOTIATE_OPTIONS: SelectOption<number>[] = [
  { value: 9, label: "เจรจาแล้ว" },
  { value: 10, label: "ยังไม่เจรจา" },
];

export const NEGOTIATE_SUCC_OPTIONS: SelectOption<number>[] = [
  { value: 11, label: "สำเร็จ" },
  { value: 12, label: "ไม่สำเร็จ" },
];

export const GET_EYE_OPTIONS: SelectOption<number>[] = [
  { value: 13, label: "จัดเก็บได้" },
  { value: 14, label: "จัดเก็บไม่ได้" },
];

export const EYE_TOTAL_OPTIONS: SelectOption<number>[] = [
  { value: 15, label: "ไม่ได้เก็บ" },
  { value: 16, label: "1 ดวง" },
  { value: 17, label: "2 ดวง" },
];

// ── Domain Helpers ──────────────────────────────────────────────────────────

export function isNegotiateSuccess(negotiateSucc?: number | null): boolean {
  return negotiateSucc === 1 || negotiateSucc === 11;
}

export function isNegotiateFailed(negotiateSucc?: number | null): boolean {
  return negotiateSucc === 2 || negotiateSucc === 12;
}

export function isPotentialCase(potential?: number | null): boolean {
  return potential === 1 || potential === 3;
}

/**
 * คำนวณจำนวนดวงตาที่จัดเก็บได้จริงจากเคส
 * 17 หรือ 2 = 2 ดวง, 16 หรือ 1 = 1 ดวง, 15 หรืออื่นๆ = ไม่ได้เก็บ (0 ดวง)
 */
export function getEyeCount(item: { geteye?: number; eyetotal?: number }): number {
  if (item.geteye !== 1 && item.geteye !== 13) return 0;
  if (item.eyetotal === 17 || item.eyetotal === 2) return 2;
  if (item.eyetotal === 16 || item.eyetotal === 1) return 1;
  return 0;
}

export function getStorageStatus(item: DonorCaseItem): string {
  const g = Number(item.geteye);
  if (g === 13 || g === 1) return "จัดเก็บได้";
  if (g === 14 || g === 2) return "จัดเก็บไม่ได้";
  return "-";
}

export function getGender(item: DonorCaseItem): string {
  const raw = item as unknown as Record<string, unknown>;
  const rawSex = raw.sex ?? raw.gender;
  if (rawSex === "1" || rawSex === 1 || rawSex === "M" || rawSex === "ชาย") {
    return "ชาย";
  }
  if (rawSex === "2" || rawSex === 2 || rawSex === "F" || rawSex === "หญิง") {
    return "หญิง";
  }
  const name = item.fullname || "";
  if (name.startsWith("นาย") || name.startsWith("ด.ช.")) return "ชาย";
  if (
    name.startsWith("นางสาว") ||
    name.startsWith("น.ส.") ||
    name.startsWith("นาง") ||
    name.startsWith("ด.ญ.")
  ) {
    return "หญิง";
  }
  return rawSex ? String(rawSex) : "-";
}

/** แปลง Date เป็นรูปแบบ YYYY-MM-DDTHH:mm สำหรับ input[type="datetime-local"] */
export function formatToLocalDateTimeInput(date: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
