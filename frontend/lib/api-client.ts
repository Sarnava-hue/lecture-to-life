import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

const TOKEN_STORAGE_KEY = "lecture_to_life_access_token";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") ||
  "http://localhost:8000";

export function isMockModeEnabled(): boolean {
  return process.env.NEXT_PUBLIC_USE_MOCK_DATA !== "false";
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setAccessToken(token: string): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } catch {
    // Ignore storage failures in restricted contexts.
  }
}

export function clearAccessToken(): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch {
    // Ignore storage failures in restricted contexts.
  }
}

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status = 500, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

interface FastApiValidationIssue {
  loc?: Array<string | number>;
  msg?: string;
}

interface FastApiErrorPayload {
  detail?: string | FastApiValidationIssue[];
  message?: string;
}

export function extractApiErrorMessage(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  if (axios.isAxiosError(error)) {
    const axiosErr = error as AxiosError<FastApiErrorPayload>;
    const status = axiosErr.response?.status ?? 0;
    const data = axiosErr.response?.data;

    if (typeof data?.detail === "string") {
      return new ApiError(data.detail, status, data);
    }

    if (Array.isArray(data?.detail) && data.detail.length > 0) {
      const joined = data.detail
        .map((issue) => issue.msg || "Validation error")
        .join("; ");
      return new ApiError(joined, status, data.detail);
    }

    if (typeof data?.message === "string") {
      return new ApiError(data.message, status, data);
    }

    if (axiosErr.code === "ERR_CANCELED") {
      return new ApiError("Request was cancelled.", 0);
    }

    if (status === 0) {
      return new ApiError(
        "Could not reach the backend server. Check NEXT_PUBLIC_API_URL or CORS.",
        0
      );
    }

    return new ApiError(axiosErr.message || "Unexpected API error.", status);
  }

  if (error instanceof Error) {
    return new ApiError(error.message, 500);
  }

  return new ApiError("Unknown error occurred.", 500);
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30_000,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const normalized = extractApiErrorMessage(error);
    if (normalized.status === 401) {
      clearAccessToken();
    }
    return Promise.reject(normalized);
  }
);
