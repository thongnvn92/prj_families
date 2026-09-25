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

export const { authLoginStarted, authLoginSucceeded, authUserLoaded, authLoggedOut } = authSlice.actions;
export const authReducer = authSlice.reducer;
