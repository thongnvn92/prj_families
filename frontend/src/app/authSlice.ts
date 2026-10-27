import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { AppRole } from "../context/AuthContext";

export const TOKEN_STORAGE_KEY = "gia_pha_token";
const LEGACY_DEV_ROLE_KEY = "gia-pha-dev-role";

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: AppRole;
  member_id: number | null;
  family_id: number | null;
  email_verified_at: string | null;
  created_at: string | null;
  /**
   * Hồ sơ thành viên liên kết (`user.member_id`). Backend chỉ trả khi đã liên
   * kết nút trên cây; giá trị này là nguồn cho màn hình Hồ sơ cá nhân.
   */
  member?: AuthUserMember | null;
}

/** Projection MemberResource mà UserResource nhúng lại cho hồ sơ cá nhân. */
export interface AuthUserMember {
  id: number;
  full_name: string;
  nickname?: string | null;
  role?: string | null;
  generation: number;
  is_alive?: boolean;
  birthplace?: string | null;
  birth_date_solar?: string | null;
  birth_zodiac?: string | null;
  birth_day_lunar?: number | null;
  birth_month_lunar?: number | null;
  birth_year_lunar?: number | null;
  death_date_solar?: string | null;
  death_zodiac?: string | null;
  death_day_lunar?: number | null;
  death_month_lunar?: number | null;
  death_year_lunar?: number | null;
  address?: string | null;
  phone?: string | null;
  bio?: string | null;
}

export type AuthStatus = "guest" | "authenticating" | "authenticated";

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  status: AuthStatus;
  sessionVersion: number;
}

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    window.localStorage.removeItem(LEGACY_DEV_ROLE_KEY);
    return window.localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function storeToken(token: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
    window.localStorage.removeItem(LEGACY_DEV_ROLE_KEY);
  } catch {
    // Storage can be unavailable in restricted browser contexts.
  }
}

export function clearStoredToken(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    window.localStorage.removeItem(LEGACY_DEV_ROLE_KEY);
  } catch {
    // Storage can be unavailable in restricted browser contexts.
  }
}

const initialState: AuthState = {
  token: getStoredToken(),
  user: null,
  status: getStoredToken() ? "authenticating" : "guest",
  sessionVersion: 0,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    authLoginStarted(state) {
      state.status = "authenticating";
    },
    /**
     * Login thất bại: đưa status về đúng trạng thái thay vì kẹt "authenticating".
     * Nếu đã có user/token (đăng nhập lại từ phiên cũ) thì giữ "authenticated".
     */
    authLoginFailed(state) {
      state.status = state.token && state.user ? "authenticated" : "guest";
    },
    authLoginSucceeded(state, action: PayloadAction<{ token: string; user: AuthUser }>) {
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.status = "authenticated";
      state.sessionVersion += 1;
    },
    authUserLoaded(state, action: PayloadAction<AuthUser>) {
      state.user = action.payload;
      state.status = "authenticated";
    },
    authLoggedOut(state) {
      state.token = null;
      state.user = null;
      state.status = "guest";
      state.sessionVersion += 1;
    },
  },
});

export const { authLoginStarted, authLoginFailed, authLoginSucceeded, authUserLoaded, authLoggedOut } = authSlice.actions;
export const authReducer = authSlice.reducer;
