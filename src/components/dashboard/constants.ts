export const MONTH_OPTIONS = [
  { value: "all", label: "ทุกเดือน (ทั้งปี)" },
  { value: "1", label: "มกราคม (ม.ค.)" },
  { value: "2", label: "กุมภาพันธ์ (ก.พ.)" },
  { value: "3", label: "มีนาคม (มี.ค.)" },
  { value: "4", label: "เมษายน (เม.ย.)" },
  { value: "5", label: "พฤษภาคม (พ.ค.)" },
  { value: "6", label: "มิถุนายน (มิ.ย.)" },
  { value: "7", label: "กรกฎาคม (ก.ค.)" },
  { value: "8", label: "สิงหาคม (ส.ค.)" },
  { value: "9", label: "กันยายน (ก.ย.)" },
  { value: "10", label: "ตุลาคม (ต.ค.)" },
  { value: "11", label: "พฤศจิกายน (พ.ย.)" },
  { value: "12", label: "ธันวาคม (ธ.ค.)" },
] as const;

export const THAI_MONTH_NAMES = [
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

export interface MonthlyChartPoint {
  name: string;
  monthKey: string;
  monthNum: number;
  cases: number;
  consented: number;
  eyes: number;
}
