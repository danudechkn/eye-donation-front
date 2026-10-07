"use client";

import { useState, useEffect, useCallback } from "react";
import { getAuthHeaders, clearSession } from "@/lib/cookies";
import type {
  DonorCaseItem,
  DonorCasePayload,
  DonorCaseParams,
  PaginationInfo,
  ApiResponse,
  PatientInfo,
  StatisticsData,
  StatisticsParams,
  MophSendResponse,
  MophPreviewResponse,
} from "@/types";

// re-export so existing imports from "@/hooks/useApi" still work
export type {
  DonorCaseItem,
  DonorCasePayload,
  DonorCaseParams,
  PaginationInfo,
  ApiResponse,
  PatientInfo,
  StatisticsData,
  StatisticsParams,
};
export type {
  StatisticsSummary,
  StatisticsFunnel,
  StatisticsBreakdown,
  StatisticsMonthlyTrend,
  StatisticsTopReasons,
  AuthUser,
  MophSendResponse,
  MophPreviewResponse,
} from "@/types";
export {
  getCookie,
  setCookie,
  deleteCookie,
  SESSION_DURATION_MS,
  setSessionExpiry,
  getSessionExpiry,
  isSessionExpired,
  clearSession,
} from "@/lib/cookies";

// ============================================================
// API URL
// ============================================================

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// ============================================================
// Core fetch helper
// ============================================================

async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: { ...getAuthHeaders(), ...options.headers },
  });

  if (res.status === 401 || res.status === 403) {
    if (typeof window !== "undefined" && window.location.pathname !== "/login") {
      clearSession();
      window.location.href = "/login";
    }
  }

  return res.json();
}

// ============================================================
// Standalone api object (for direct use in hooks/components)
// ============================================================

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
    apiFetch(`/donor-cases/${id}`, { cache: "no-store" }) as Promise<ApiResponse<DonorCaseItem>>,

  searchPatient: (hn: string) =>
    apiFetch(`/deceased-patients?hn=${encodeURIComponent(hn)}`, {
      cache: "no-store",
    }) as Promise<ApiResponse<PatientInfo>>,

  createCase: async (data: DonorCasePayload | Record<string, unknown>): Promise<ApiResponse<DonorCaseItem>> => {
    const result = (await apiFetch(`/deceased-patients`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })) as any;
    if (result && !result.success && result.message) throw new Error(result.message);
    return result;
  },

  updateCase: async (
    id: number | string,
    data: Partial<DonorCasePayload> | Record<string, unknown>,
  ): Promise<ApiResponse<DonorCaseItem>> => {
    const result = (await apiFetch(`/donor-cases/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })) as any;
    if (result && !result.success && result.message) throw new Error(result.message);
    return result;
  },

  deleteCase: async (id: number | string): Promise<ApiResponse<null>> => {
    const result = (await apiFetch(`/donor-cases/${id}`, { method: "DELETE" })) as any;
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

  sendToMoph: async (id: number | string): Promise<ApiResponse<MophSendResponse>> => {
    const result = (await apiFetch(`/donor-cases/${id}/send-moph`, {
      method: "POST",
    })) as any;
    if (result && !result.success && result.message) throw new Error(result.message);
    return result;
  },

  previewMoph: async (id: number | string): Promise<ApiResponse<MophPreviewResponse>> => {
    const result = (await apiFetch(`/donor-cases/${id}/preview-moph`, {
      method: "GET",
      cache: "no-store",
    })) as any;
    if (result && !result.success && result.message) throw new Error(result.message);
    return result;
  },
};

// ============================================================
// useApiRequest hook (backward-compat)
// ============================================================

export default function useApiRequest() {
  const apiRequest = async (
    endpoint: string,
    method = "GET",
    body: Record<string, unknown> | null = null,
  ) => {
    const headers = getAuthHeaders({ "Content-Type": "application/json" });
    const options: RequestInit = { method, headers, cache: "no-store" };
    if (body && method !== "GET") options.body = JSON.stringify(body);

    const res = await fetch(`${API_URL}${endpoint}`, options);
    const data = await res.json();

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        if (typeof window !== "undefined" && window.location.pathname !== "/login") {
          clearSession();
          window.location.href = "/login";
        }
      }
      throw new Error(data?.message || "Request failed");
    }
    return data;
  };

  const getCases = (params: DonorCaseParams = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.set("search", params.search);
    if (params.page) query.set("page", String(params.page));
    if (params.limit) query.set("limit", String(params.limit));
    return apiRequest(`/donor-cases?${query.toString()}`);
  };

  const getCaseById = (id: number | string) => apiRequest(`/donor-cases/${id}`);
  const createCase = (value: DonorCasePayload | Record<string, unknown>) =>
    apiRequest("/deceased-patients", "POST", value);
  const updateCase = (id: number | string, value: Partial<DonorCasePayload> | Record<string, unknown>) =>
    apiRequest(`/donor-cases/${id}`, "PUT", value);
  const deleteCase = (id: number | string) => apiRequest(`/donor-cases/${id}`, "DELETE");
  const searchPatient = (hn: string) =>
    apiRequest(`/deceased-patients?hn=${encodeURIComponent(hn)}`);
  const getStatistics = (params: StatisticsParams = {}) => {
    const query = new URLSearchParams();
    if (params.year) query.set("year", String(params.year));
    if (params.month && params.month !== "all") query.set("month", String(params.month));
    if (params.startDate) query.set("startDate", params.startDate);
    if (params.endDate) query.set("endDate", params.endDate);
    const qs = query.toString();
    return apiRequest(`/statistics${qs ? `?${qs}` : ""}`);
  };

  const sendToMoph = (id: number | string) =>
    apiRequest(`/donor-cases/${id}/send-moph`, "POST");
  const previewMoph = (id: number | string) =>
    apiRequest(`/donor-cases/${id}/preview-moph`, "GET");

  return { getCases, getCaseById, createCase, updateCase, deleteCase, searchPatient, getStatistics, sendToMoph, previewMoph };
}

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
    api
      .getCases({ search, page, limit })
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
// Custom Hook: useDonorCase
// ============================================================

export function useDonorCase(id: number | string | null | undefined) {
  const [caseData, setCaseData] = useState<DonorCaseItem | null>(null);
  const [loading, setLoading] = useState<boolean>(Boolean(id));
  const [error, setError] = useState<string | null>(null);
  const [reloadTrigger, setReloadTrigger] = useState<number>(0);

  useEffect(() => {
    if (!id) return;
    let isMounted = true;
    api
      .getCaseById(id)
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
    api
      .getStatistics({ year, month, startDate, endDate })
      .then((res) => {
        if (!isMounted) return;
        setStats(res.success && res.data ? res.data : null);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการโหลดสถิติ");
        setLoading(false);
      });
    return () => { isMounted = false; };
  }, [year, month, startDate, endDate, reloadTrigger]);

  const refetch = useCallback(() => {
    setLoading(true);
    setError(null);
    setReloadTrigger((prev) => prev + 1);
  }, []);

  return { stats, loading, error, refetch };
}
