import { apiSlice } from "./apiSlice";
import { clearStoredToken, storeToken, type AuthUser } from "./authSlice";
import { authLoggedOut, authLoginStarted, authLoginSucceeded, authUserLoaded } from "./authSlice";

export interface AuthSession {
  user: AuthUser;
  token: string;
  token_type: "Bearer";
}

interface LoginInput {
  email: string;
  password: string;
  device_name?: string;
}

interface RawLoginResponse {
  data: AuthUser;
  token: string;
  token_type: "Bearer";
}

export const authApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<AuthSession, LoginInput>({
      query: (body) => ({ url: "/auth/login", method: "POST", body }),
      transformResponse: (response: RawLoginResponse) => ({ user: response.data, token: response.token, token_type: "Bearer" }),
      async onQueryStarted(_body, { dispatch, queryFulfilled }) {
        dispatch(authLoginStarted());
        try {
          const { data: session } = await queryFulfilled;
          storeToken(session.token);
          dispatch(authLoginSucceeded(session));
          dispatch(apiSlice.util.resetApiState());
        } catch {
          // The rejected mutation is exposed to the login form.
        }
      },
    }),
    logout: builder.mutation<{ message: string }, void>({
      query: () => ({ url: "/auth/logout", method: "POST" }),
      async onQueryStarted(_body, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
        } catch {
          // A failed network request must not leave a stale local session.
        } finally {
          clearStoredToken();
          dispatch(authLoggedOut());
          dispatch(apiSlice.util.resetApiState());
        }
      },
    }),
    getMe: builder.query<AuthUser, string>({
      query: () => ({ url: "/auth/me", method: "GET" }),
      async onQueryStarted(_sessionKey, { dispatch, queryFulfilled }) {
        try {
          const { data: user } = await queryFulfilled;
          dispatch(authUserLoaded(user));
        } catch {
          // A 401 is handled centrally by apiSlice.
        }
      },
      providesTags: ["Auth"],
    }),
  }),
});

export const { useLoginMutation, useLogoutMutation, useGetMeQuery } = authApiSlice;
