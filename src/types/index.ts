// ============================================================
// Donor Cases
// ============================================================

export interface DonorCaseItem {
  id: number;
  hn: string;
  fullname: string;
  cid?: string | null;
  deathtext?: string | null;
  icd10?: string | null;
  braincardiac: number;
  potential: number;
  chkpotential: number;
  commentnonchk?: string | null;
  wardtotc: number;
  negotiate: number;
  negotiate_succ?: number | null;
  commentnonnego?: string | null;
  geteye: number;
  eyetotal: number;
  commentnoget?: string | null;
  negotiate_staff?: string | null;
  geteye_staff?: string | null;
  firststaff: string;
  fristtime?: string | null;
  status?: number;
  is_complete?: number;
  missing_fields?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface DonorCasePayload {
  hn: string;
  fullname?: string;
  cid?: string | null;
  deathtext?: string | null;
  icd10?: string | null;
  braincardiac?: number;
  potential?: number;
  chkpotential?: number;
  commentnonchk?: string | null;
  wardtotc?: number;
  negotiate?: number;
  negotiate_succ?: number | null;
  commentnonnego?: string | null;
  geteye?: number;
  eyetotal?: number;
  commentnoget?: string | null;
  negotiate_staff?: string | null;
  geteye_staff?: string | null;
  firststaff?: string;
  firsttime?: string | null;
  status?: number;
  [key: string]: unknown;
}

export interface MophSendResponse {
  id: number;
  status: number;
  message: string;
  mophResponse?: unknown;
  payloadSent?: Record<string, unknown>;
}

export interface MophPreviewResponse {
  donorCase: DonorCaseItem;
  payload: Record<string, unknown>;
}

export interface DonorCaseParams {
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============================================================
// API Generic
// ============================================================

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface PatientInfo {
  hn: string;
  prename?: string;
  firstname?: string;
  lastname?: string;
  citizencardno?: string;
  [key: string]: unknown;
}

// ============================================================
// Statistics
// ============================================================

export interface StatisticsSummary {
  total_cases: number;
  potential_cases: number;
  potential_rate: number;
  consented_cases: number;
  consented_rate: number;
  negotiated_cases: number;
  total_eyes_collected: number;
  total_donors: number;
  negotiate_success_rate: number;
  procurement_success_rate: number;
}

export interface StatisticsFunnel {
  total_cases: number;
  potential_cases: number;
  evaluated_cases: number;
  ward_notified: number;
  negotiated: number;
  negotiate_success: number;
  geteye_success: number;
}

export interface StatisticsBreakdown {
  death_type: {
    brain_death: number;
    cardiac_death: number;
  };
  negotiate_status: {
    success: number;
    failed: number;
    not_yet: number;
  };
  geteye_status: {
    success: number;
    failed: number;
  };
  eyes_yield: {
    two_eyes: number;
    one_eye: number;
    zero_eye: number;
  };
}

export interface StatisticsMonthlyTrend {
  month: string;
  year: number;
  month_num: number;
  label: string;
  month_name: string;
  cases: number;
  screened: number;
  total_cases: number;
  consented: number;
  negotiate_succ: number;
  eyes_collected: number;
  donors: number;
}

export interface StatisticsTopReasons {
  non_evaluated: { reason: string; count: number }[];
  non_negotiated: { reason: string; count: number }[];
  non_retrieved: { reason: string; count: number }[];
}

export interface StatisticsData {
  summary: StatisticsSummary;
  funnel: StatisticsFunnel;
  breakdown: StatisticsBreakdown;
  monthly_trend?: StatisticsMonthlyTrend[];
  available_years?: number[];
  selected_year?: number;
  selected_month?: number | null;
  top_reasons?: StatisticsTopReasons;
}

export interface StatisticsParams {
  year?: number | string;
  month?: number | string;
  startDate?: string;
  endDate?: string;
}

// ============================================================
// Auth / User
// ============================================================

export interface AuthUser {
  cid: string;
  name: string;
  role: string;
  hospcode: string;
  providerId: string;
  loginAt: string;
}
