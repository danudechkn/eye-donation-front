"use client";

import { useState, useEffect, useCallback } from "react";
import { getAuthHeaders, clearSession } from "@/lib/cookies";
import {
  logoutFromBackend,
  notifyAuthChange,
  notifyUnauthorized,
  syncBackendAuthCookie,
} from "@/lib/auth";
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

// Re-export shared types & cookie helpers for convenience
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
// API Core
// ============================================================

const API_URL = process.env.NEXT_PUBLIC_API_URL;

async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    credentials: "include",
    headers: { ...getAuthHeaders(), ...options.headers },
  });

  if (res.status === 401 || res.status === 403) {
    if (typeof window !== "undefined" && window.location.pathname !== "/login") {
      void logoutFromBackend();
      clearSession();
      notifyAuthChange();
      notifyUnauthorized();
    }
  }

  return (await res.json()) as ApiResponse<T>;
}

async function apiMutate<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  const result = await apiFetch<T>(endpoint, options);
  if (result && !result.success && result.message) {
    throw new Error(result.message);
  }
  return result;
}

// ============================================================
// API Client
// ============================================================

export const api = {
  /** ซิงค์ JWT กับ Backend เพื่อเซ็ต HttpOnly Cookie (POST /api/auth/login) */
  login: (token: string) => syncBackendAuthCookie(token),

  /** สั่งลบ HttpOnly Cookie ที่ Backend (POST /api/auth/logout) */
  logout: () => logoutFromBackend(),

  getCases: (params: DonorCaseParams = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.set("search", params.search);
    if (params.page) query.set("page", String(params.page));
    if (params.limit) query.set("limit", String(params.limit));
    return apiFetch<{ data: DonorCaseItem[]; pagination: PaginationInfo }>(
      `/donor-cases?${query.toString()}`,
      { cache: "no-store" },
    );
  },

  getCaseById: (id: number | string) =>
    apiFetch<DonorCaseItem>(`/donor-cases/${id}`, { cache: "no-store" }),

  searchPatient: (hn: string) =>
    apiFetch<PatientInfo>(`/deceased-patients?hn=${encodeURIComponent(hn)}`, {
      cache: "no-store",
    }),

  createCase: (data: DonorCasePayload | Record<string, unknown>) =>
    apiMutate<DonorCaseItem>(`/deceased-patients`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),

  updateCase: (
    id: number | string,
    data: Partial<DonorCasePayload> | Record<string, unknown>,
  ) =>
    apiMutate<DonorCaseItem>(`/donor-cases/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),

  deleteCase: (id: number | string) =>
    apiMutate<null>(`/donor-cases/${id}`, { method: "DELETE" }),

  getStatistics: (params: StatisticsParams = {}) => {
    const query = new URLSearchParams();
    if (params.year) query.set("year", String(params.year));
    if (params.month && params.month !== "all") query.set("month", String(params.month));
    if (params.startDate) query.set("startDate", params.startDate);
    if (params.endDate) query.set("endDate", params.endDate);
    const qs = query.toString();
    return apiFetch<StatisticsData>(`/statistics${qs ? `?${qs}` : ""}`, {
      cache: "no-store",
    });
  },

  sendToMoph: (id: number | string) =>
    apiMutate<MophSendResponse>(`/donor-cases/send-moph/${id}`, {
      method: "POST",
    }),

  previewMoph: (id: number | string) =>
    apiMutate<MophPreviewResponse>(`/donor-cases/${id}/preview-moph`, {
      method: "GET",
      cache: "no-store",
    }),
};

// ============================================================
// Custom Hook: useDonorCases
// ============================================================

export function useDonorCases(params: DonorCaseParams = {}) {
  const { search, page, limit } = params;
  const [reloadTrigger, setReloadTrigger] = useState(0);
  const queryKey = `${search ?? ""}|${page ?? ""}|${limit ?? ""}|${reloadTrigger}`;

  const [cases, setCases] = useState<DonorCaseItem[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: page || 1,
    limit: limit || 10,
    totalPages: 1,
  });
  const [error, setError] = useState<string | null>(null);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);

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
        setError(null);
        setLoadedKey(queryKey);
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการโหลดข้อมูล");
        setLoadedKey(queryKey);
      });

    return () => {
      isMounted = false;
    };
  }, [search, page, limit, queryKey]);

  const refetch = useCallback(() => {
    setError(null);
    setReloadTrigger((prev) => prev + 1);
  }, []);

  return {
    cases,
    pagination,
    loading: loadedKey !== queryKey,
    error,
    refetch,
    setCases,
  };
}

// ============================================================
// Custom Hook: useDonorCase
// ============================================================

export function useDonorCase(id: number | string | null | undefined) {
  const [reloadTrigger, setReloadTrigger] = useState(0);
  const queryKey = id ? `${id}|${reloadTrigger}` : null;

  const [caseData, setCaseData] = useState<DonorCaseItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);

  useEffect(() => {
    if (!id || !queryKey) return;
    let isMounted = true;
    api
      .getCaseById(id)
      .then((res) => {
        if (!isMounted) return;
        setCaseData(res.success && res.data ? res.data : null);
        setError(null);
        setLoadedKey(queryKey);
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการดึงข้อมูลเคส");
        setLoadedKey(queryKey);
      });

    return () => {
      isMounted = false;
    };
  }, [id, queryKey]);

  const refetch = useCallback(() => {
    setError(null);
    setReloadTrigger((prev) => prev + 1);
  }, []);

  return {
    caseData,
    loading: Boolean(queryKey) && loadedKey !== queryKey,
    error,
    refetch,
  };
}

// ============================================================
// Custom Hook: useStatistics
// ============================================================

export function useStatistics(params: StatisticsParams = {}) {
  const { year, month, startDate, endDate } = params;
  const [reloadTrigger, setReloadTrigger] = useState(0);
  const queryKey = `${year ?? ""}|${month ?? ""}|${startDate ?? ""}|${endDate ?? ""}|${reloadTrigger}`;

  const [stats, setStats] = useState<StatisticsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    api
      .getStatistics({ year, month, startDate, endDate })
      .then((res) => {
        if (!isMounted) return;
        setStats(res.success && res.data ? res.data : null);
        setError(null);
        setLoadedKey(queryKey);
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการโหลดสถิติ");
        setLoadedKey(queryKey);
      });

    return () => {
      isMounted = false;
    };
  }, [year, month, startDate, endDate, queryKey]);

  const refetch = useCallback(() => {
    setError(null);
    setReloadTrigger((prev) => prev + 1);
  }, []);

  return {
    stats,
    loading: loadedKey !== queryKey,
    error,
    refetch,
  };
}
