import { render, type RenderOptions, type RenderResult } from "@testing-library/react";
import { Provider } from "react-redux";
import { vi } from "vitest";
import { store } from "../app/store";
import { apiSlice } from "../app/apiSlice";
import { authLoginSucceeded, authLoggedOut, storeToken } from "../app/authSlice";
import type { AuthUser } from "../app/authSlice";

/*
 * Bộ công cụ cho INTEGRATION test: dùng store + apiSlice THẬT (không mock RTK Query)
 * và chỉ chặn tầng `fetch` để kiểm chứng chuỗi
 * Component -> RTK Query -> fetchBaseQuery -> mapper -> Redux store.
 */

export interface FetchCall { url: string; method: string; body: unknown; headers: Record<string, string> }

export interface MockRoute {
  status?: number;
  body?: unknown;
}

/** Đọc body của request thành JSON/FormData dạng plain object (null nếu không có). */
async function readBody(input: RequestInfo | URL, init?: RequestInit): Promise<unknown> {
  const raw = init?.body;
  if (typeof FormData !== "undefined" && raw instanceof FormData) {
    return mapFormData(raw);
  }
  if (typeof raw === "string" && raw.length) {
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  }
  // RTK Query truyền object Request; đọc trực tiếp (không clone) để tránh OOM.
  if (typeof Request !== "undefined" && input instanceof Request) {
    const method = (init?.method ?? input.method ?? "GET").toUpperCase();
    if (method === "GET" || method === "HEAD") return null;
    const contentType = input.headers.get("content-type") ?? "";
    try {
      if (contentType.includes("multipart/form-data") || contentType.includes("x-www-form-urlencoded")) {
        return mapFormData(await input.formData());
      }
      if (contentType.includes("application/json")) {
        const text = await input.text();
        return text ? JSON.parse(text) : null;
      }
    } catch {
      return null;
    }
  }
  return null;
}

function mapFormData(form: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of form.entries()) {
    const text = typeof value === "string" ? value : `File(${(value as File).name})`;
    out[key] = key in out ? `${out[key]}, ${text}` : text;
  }
  return out;
}

/** Đăng ký route theo `"<METHOD> <path>"`; path được so khớp sau khi bỏ origin. */
export function mockFetch(routes: Record<string, MockRoute | ((call: FetchCall) => MockRoute)>) {
  const calls: FetchCall[] = [];
  const impl = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const isRequest = typeof Request !== "undefined" && input instanceof Request;
    const url = isRequest ? input.url : String(input);
    const method = (init?.method ?? (isRequest ? input.method : "GET") ?? "GET").toUpperCase();
    // Header do prepareHeaders gắn vào Request, không nằm trong init.headers.
    const headerSource = init?.headers ? new Headers(init.headers) : isRequest ? input.headers : new Headers();
    const headers = Object.fromEntries(headerSource.entries()) as Record<string, string>;
    const call: FetchCall = { url, method, body: await readBody(input, init), headers };
    calls.push(call);

    const path = url.replace(/^https?:\/\/[^/]+/, "").split("?")[0];
    const match = routes[`${method} ${path}`] ?? routes[`${method} ${path}/*`] ?? routes[path];
    if (!match) {
      return jsonResponse(404, { message: `Chưa mock route: ${method} ${path}` });
    }
    const resolved = typeof match === "function" ? match(call) : match;
    return jsonResponse(resolved.status ?? 200, resolved.body ?? {});
  });
  vi.stubGlobal("fetch", impl);
  return { calls, impl };
}

/**
 * RTK Query gọi `response.clone()` nên phải trả về **Response thật** của jsdom,
 * không dùng object giả (thiếu clone sẽ ném TypeError trong baseQuery).
 */
export function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body ?? {}), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/** Render với store thật (Provider) + AuthProvider để hook useAuth hoạt động. */
export async function renderWithProviders(ui: React.ReactElement, options?: RenderOptions): Promise<RenderResult> {
  const result = render(<Provider store={store}>{ui}</Provider>, options);
  // Cho RTK Query flush queue trước khi test assert.
  await Promise.resolve();
  return result;
}

/** Đặt session đã đăng nhập (token trong localStorage + token/user trong store). */
export function signIn(user: AuthUser, token = "test-token-abc") {
  storeToken(token);
  // authLoginSucceeded set cả token lẫn user nên mô phỏng đúng trạng thái sau login.
  store.dispatch(authLoginSucceeded({ token, user }));
  return token;
}

export function resetApiState() {
  store.dispatch(apiSlice.util.resetApiState());
  store.dispatch(authLoggedOut());
}
