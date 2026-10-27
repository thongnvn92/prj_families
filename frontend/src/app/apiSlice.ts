import {
  createApi,
  fetchBaseQuery,
  type FetchBaseQueryError,
  type FetchBaseQueryMeta,
  type QueryReturnValue,
} from "@reduxjs/toolkit/query/react";

import { clearStoredToken, getStoredToken, authLoggedOut } from "./authSlice";

/**
 * Base URL của Laravel API. Nguồn duy nhất để RTK Query và Echo auth endpoint
 * không bị lệch cấu hình; đọc từ VITE_API_URL (xem .env.example).
 */
export const API_BASE_URL = import.meta.env.VITE_API_URL?.trim() || "http://127.0.0.1:8080/api/v1";

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  credentials: "include",
  prepareHeaders: (headers) => {
    const token = getStoredToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
    headers.set("Accept", "application/json");
    return headers;
  },
});

const baseQueryWithAuth: typeof rawBaseQuery = async (args, api, extraOptions) => {
  const result = await rawBaseQuery(args, api, extraOptions);
  if (result.error?.status === 401) {
    clearStoredToken();
    api.dispatch(authLoggedOut());
    api.dispatch(apiSlice.util.resetApiState());
  }
  return result;
};

export const apiSlice = createApi({
  reducerPath: "giaPhaApi",
  baseQuery: baseQueryWithAuth,
  tagTypes: [
    "Members",
    "CalendarEvents",
    "LunarMonth",
    "ChatGroups",
    "ChatMessages",
    "PendingEdits",
    "Prayers",
    "Photos",
    "Auth",
    "AiContext",
    "FamilySettings",
  ],
  endpoints: () => ({}),
});

export function getApiErrorMessage(error: unknown, fallback = "Không thể xử lý yêu cầu."): string {
  if (error instanceof Error && error.message) return error.message;
  if (!error || typeof error !== "object") return fallback;
  if ("data" in error) {
    const data = (error as { data?: unknown }).data;
    if (data && typeof data === "object" && "message" in data && typeof (data as { message?: unknown }).message === "string") {
      return (data as { message: string }).message;
    }
  }
  if ("error" in error && typeof (error as { error?: unknown }).error === "string") return (error as { error: string }).error;
  return fallback;
}
