"use client";

import { useState, useEffect, useCallback } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// ============================================================
// Types & Interfaces
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
  [key: string]: unknown;
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
// Main Hook: useApiRequest
// ============================================================

export function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(?:^|;\\s*)" + name + "=([^;]*)"));
  return match ? decodeURIComponent(match[1]) : null;
}

export function setCookie(name: string, value: string, days?: number): void {
  if (typeof document === "undefined") return;
  let expires = "";
  if (days) {
    const d = new Date();
    d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
    expires = `; expires=${d.toUTCString()}`;
  }
  document.cookie = `${name}=${encodeURIComponent(value)}${expires}; path=/; SameSite=Lax`;
}

export function deleteCookie(name: string): void {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
}

function getAuthHeaders(extraHeaders: Record<string, string> = {}): Record<string, string> {
  const headers: Record<string, string> = {
    ...extraHeaders,
  };
  if (typeof window !== "undefined") {
    let token =
      getCookie("moph_token") ||
      getCookie("token");

    // 1. ถ้ายังไม่มีใน Cookie หรือ Storage ลองดึงจาก URL Hash หรือ Query
    if (!token) {
      if (window.location.hash) {
        const hashStr = window.location.hash.startsWith("#")
          ? window.location.hash.substring(1)
          : window.location.hash;
        const hashParams = new URLSearchParams(hashStr);
        token =
          hashParams.get("token") ||
          hashParams.get("moph_token") ||
          hashParams.get("access_token");
      }
      if (!token && window.location.search) {
        const searchParams = new URLSearchParams(window.location.search);
        token =
          searchParams.get("token") ||
          searchParams.get("moph_token") ||
          searchParams.get("access_token") ||
          searchParams.get("id_token");
      }
    }

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }
  return headers;
}

export default function useApiRequest() {
  // ---- Core Fetcher ----
  const apiRequest = async (
    endpoint: string,
    method = "GET",
    body: Record<string, unknown> | null = null,
  ) => {
    const headers = getAuthHeaders({
      "Content-Type": "application/json",
    });

    const options: RequestInit = {
      method,
      headers,
      cache: "no-store",
    };

    if (body && method !== "GET") {
      options.body = JSON.stringify(body);
    }

    const res = await fetch(`${API_URL}${endpoint}`, options);
    const data = await res.json();

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        // หาก Token หมดอายุ หรือไม่ได้รับอนุญาต ให้ล้างข้อมูลแล้วกลับหน้า Login
        if (typeof window !== "undefined" && window.location.pathname !== "/login") {
          deleteCookie("moph_token");
          deleteCookie("token");
          deleteCookie("eye_donation_user");
          deleteCookie("provider_profile");
          sessionStorage.clear();
          localStorage.clear();
          window.location.href = "/login";
        }
      }
      throw new Error(data?.message || "Request failed");
    }

    return data;
  };

  // ============================================================
  // Donor Cases
  // ============================================================

  const getCases = async (params: DonorCaseParams = {}): Promise<ApiResponse<{ data: DonorCaseItem[]; pagination: PaginationInfo }>> => {
    const query = new URLSearchParams();
    if (params.search) query.set("search", params.search);
    if (params.page) query.set("page", String(params.page));
    if (params.limit) query.set("limit", String(params.limit));
    return apiRequest(`/donor-cases?${query.toString()}`);
  };

  const getCaseById = async (id: number | string): Promise<ApiResponse<DonorCaseItem>> => {
    return apiRequest(`/donor-cases/${id}`);
  };

  const createCase = async (value: DonorCasePayload | Record<string, unknown>): Promise<ApiResponse<DonorCaseItem>> => {
    return apiRequest("/deceased-patients", "POST", value);
  };

  const updateCase = async (
    id: number | string,
    value: Partial<DonorCasePayload> | Record<string, unknown>,
  ): Promise<ApiResponse<DonorCaseItem>> => {
    return apiRequest(`/donor-cases/${id}`, "PUT", value);
  };

  const deleteCase = async (id: number | string): Promise<ApiResponse<null>> => {
    return apiRequest(`/donor-cases/${id}`, "DELETE");
  };

  // ============================================================
  // Patient Search (HIS)
  // ============================================================

  const searchPatient = async (hn: string): Promise<ApiResponse<PatientInfo>> => {
    return apiRequest(`/deceased-patients?hn=${encodeURIComponent(hn)}`);
  };

  // ============================================================
  // Statistics
  // ============================================================

  const getStatistics = async (params: StatisticsParams = {}): Promise<ApiResponse<StatisticsData>> => {
    const query = new URLSearchParams();
    if (params.year) query.set("year", String(params.year));
    if (params.month && params.month !== "all") query.set("month", String(params.month));
    if (params.startDate) query.set("startDate", params.startDate);
    if (params.endDate) query.set("endDate", params.endDate);
    const qs = query.toString();
    return apiRequest(`/statistics${qs ? `?${qs}` : ""}`);
  };

  return {
    // Donor Cases
    getCases,
    getCaseById,
    createCase,
    updateCase,
    deleteCase,

    // Patient
    searchPatient,

    // Statistics
    getStatistics,
  };
}

// ============================================================
// Standalone api object (for backward compatibility)
// ============================================================

async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: { ...getAuthHeaders(), ...options.headers },
  });
  
  if (res.status === 401 || res.status === 403) {
    if (typeof window !== "undefined" && window.location.pathname !== "/login") {
      deleteCookie("moph_token");
      deleteCookie("token");
      deleteCookie("eye_donation_user");
      deleteCookie("provider_profile");
      sessionStorage.clear();
      localStorage.clear();
      window.location.href = "/login";
    }
  }
  
  return res.json();
}

export const api = {
  getCases: (params: DonorCaseParams = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.set("search", params.search);
    if (params.page) query.set("page", String(params.page));
    if (params.limit) query.set("limit", String(params.limit));
    return apiFetch(`/donor-cases?${query.toString()}`, {
      cache: "no-store",
    }) as Promise<ApiResponse<{ data: DonorCaseItem[]; pagination: PaginationInfo }>>;
  },

  getCaseById: (id: number | string) =>
    apiFetch(`/donor-cases/${id}`, {
      cache: "no-store",
    }) as Promise<ApiResponse<DonorCaseItem>>,

  searchPatient: (hn: string) =>
    apiFetch(`/deceased-patients?hn=${encodeURIComponent(hn)}`, {
      cache: "no-store",
    }) as Promise<ApiResponse<PatientInfo>>,

  createCase: async (data: DonorCasePayload | Record<string, unknown>): Promise<ApiResponse<DonorCaseItem>> => {
    const result = await apiFetch(`/deceased-patients`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }) as any;
    if (result && !result.success && result.message) throw new Error(result.message);
    return result;
  },

  updateCase: async (id: number | string, data: Partial<DonorCasePayload> | Record<string, unknown>): Promise<ApiResponse<DonorCaseItem>> => {
    const result = await apiFetch(`/donor-cases/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }) as any;
    if (result && !result.success && result.message) throw new Error(result.message);
    return result;
  },

  deleteCase: async (id: number | string): Promise<ApiResponse<null>> => {
    const result = await apiFetch(`/donor-cases/${id}`, {
      method: "DELETE",
    }) as any;
    if (result && !result.success && result.message) throw new Error(result.message);
    return result;
  },

  getStatistics: (params: StatisticsParams = {}) => {
    const query = new URLSearchParams();
    if (params.year) query.set("year", String(params.year));
    if (params.month && params.month !== "all") query.set("month", String(params.month));
    if (params.startDate) query.set("startDate", params.startDate);
    if (params.endDate) query.set("endDate", params.endDate);
    const qs = query.toString();
    return apiFetch(`/statistics${qs ? `?${qs}` : ""}`, {
      cache: "no-store",
    }) as Promise<ApiResponse<StatisticsData>>;
  },
};

// ============================================================
// Custom Hook: useDonorCases
// ============================================================

export function useDonorCases(params: DonorCaseParams = {}) {
  const [cases, setCases] = useState<DonorCaseItem[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: params.page || 1,
    limit: params.limit || 10,
    totalPages: 1,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadTrigger, setReloadTrigger] = useState<number>(0);

  const { search, page, limit } = params;

  useEffect(() => {
    let isMounted = true;

    api.getCases({ search, page, limit })
      .then((res) => {
        if (!isMounted) return;
        if (res.success && res.data) {
          setCases(res.data.data || []);
          if (res.data.pagination) setPagination(res.data.pagination);
        } else {
          setCases([]);
        }
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการโหลดข้อมูล");
        setLoading(false);
      });

    return () => { isMounted = false; };
  }, [search, page, limit, reloadTrigger]);

  const refetch = useCallback(() => {
    setLoading(true);
    setError(null);
    setReloadTrigger((prev) => prev + 1);
  }, []);

  return { cases, pagination, loading, error, refetch, setCases };
}

// ============================================================
// Custom Hook: useDonorCase (single case by ID)
// ============================================================

export function useDonorCase(id: number | string | null | undefined) {
  const [caseData, setCaseData] = useState<DonorCaseItem | null>(null);
  const [loading, setLoading] = useState<boolean>(Boolean(id));
  const [error, setError] = useState<string | null>(null);
  const [reloadTrigger, setReloadTrigger] = useState<number>(0);

  useEffect(() => {
    if (!id) return;
    let isMounted = true;

    api.getCaseById(id)
      .then((res) => {
        if (!isMounted) return;
        setCaseData(res.success && res.data ? res.data : null);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการดึงข้อมูลเคส");
        setLoading(false);
      });

    return () => { isMounted = false; };
  }, [id, reloadTrigger]);

  const refetch = useCallback(() => {
    setLoading(true);
    setError(null);
    setReloadTrigger((prev) => prev + 1);
  }, []);

  return { caseData, loading, error, refetch };
}

// ============================================================
// Custom Hook: useStatistics
// ============================================================

export function useStatistics(params: StatisticsParams = {}) {
  const [stats, setStats] = useState<StatisticsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadTrigger, setReloadTrigger] = useState<number>(0);

  const { year, month, startDate, endDate } = params;

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    api.getStatistics({ year, month, startDate, endDate })
      .then((res) => {
        if (!isMounted) return;
        if (res.success && res.data) {
          setStats(res.data);
        } else {
          setStats(null);
        }
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการโหลดสถิติ");
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [year, month, startDate, endDate, reloadTrigger]);

  const refetch = useCallback(() => {
    setLoading(true);
    setError(null);
    setReloadTrigger((prev) => prev + 1);
  }, []);

  return { stats, loading, error, refetch };
}
