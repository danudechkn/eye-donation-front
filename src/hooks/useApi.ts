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

// ============================================================
// Main Hook: useApiRequest
// ============================================================

export default function useApiRequest() {
  // ---- Core Fetcher ----
  const apiRequest = async (
    endpoint: string,
    method = "GET",
    body: Record<string, unknown> | null = null,
  ) => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

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

  return {
    // Donor Cases
    getCases,
    getCaseById,
    createCase,
    updateCase,
    deleteCase,

    // Patient
    searchPatient,
  };
}

// ============================================================
// Standalone api object (for backward compatibility)
// ============================================================

export const api = {
  getCases: (params: DonorCaseParams = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.set("search", params.search);
    if (params.page) query.set("page", String(params.page));
    if (params.limit) query.set("limit", String(params.limit));
    return fetch(`${API_URL}/donor-cases?${query.toString()}`, { cache: "no-store" })
      .then((r) => r.json()) as Promise<ApiResponse<{ data: DonorCaseItem[]; pagination: PaginationInfo }>>;
  },

  getCaseById: (id: number | string) =>
    fetch(`${API_URL}/donor-cases/${id}`, { cache: "no-store" })
      .then((r) => r.json()) as Promise<ApiResponse<DonorCaseItem>>,

  searchPatient: (hn: string) =>
    fetch(`${API_URL}/deceased-patients?hn=${encodeURIComponent(hn)}`, { cache: "no-store" })
      .then((r) => r.json()) as Promise<ApiResponse<PatientInfo>>,

  createCase: async (data: DonorCasePayload | Record<string, unknown>): Promise<ApiResponse<DonorCaseItem>> => {
    const res = await fetch(`${API_URL}/deceased-patients`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || "Failed to create donor case");
    return result;
  },

  updateCase: async (id: number | string, data: Partial<DonorCasePayload> | Record<string, unknown>): Promise<ApiResponse<DonorCaseItem>> => {
    const res = await fetch(`${API_URL}/donor-cases/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || "Failed to update donor case");
    return result;
  },

  deleteCase: async (id: number | string): Promise<ApiResponse<null>> => {
    const res = await fetch(`${API_URL}/donor-cases/${id}`, { method: "DELETE" });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || "Failed to delete donor case");
    return result;
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
