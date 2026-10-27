import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LoginDialog } from "../../components/auth/LoginDialog";
import { store } from "../../app/store";
import { TOKEN_STORAGE_KEY } from "../../app/authSlice";
import { memberApiSlice } from "../../app/memberApi";
import { mockFetch, renderWithProviders, resetApiState, signIn } from "../integration";
import { authUser } from "../fixtures";

const { getMembers } = memberApiSlice.endpoints;

/*
 * IT Flow 1 — Auth & Session:
 * Guest đăng nhập -> lưu Bearer token -> store chuyển authenticated
 * -> refetch profile -> xử lý 401 (clear session + reset cache).
 */

beforeEach(() => {
  resetApiState();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("IT-AUTH – Normal / Happy Path", () => {
  it("đăng nhập thành công lưu token vào localStorage và cập nhật store", async () => {
    const user = authUser("member");
    mockFetch({ "POST /api/v1/auth/login": { body: { data: user, token: "tok-123", token_type: "Bearer" } } });
    const onOpenChange = vi.fn();
    const userEvent_ = userEvent.setup();
    renderWithProviders(<LoginDialog open onOpenChange={onOpenChange} />);

    await userEvent_.type(screen.getByLabelText("Email"), "member@gia-pha.local");
    await userEvent_.type(screen.getByLabelText("Mật khẩu"), "password");
    await userEvent_.click(screen.getByRole("button", { name: "Đăng nhập" }));

    await waitFor(() => expect(window.localStorage.getItem(TOKEN_STORAGE_KEY)).toBe("tok-123"));
    expect(store.getState().auth.status).toBe("authenticated");
    expect(store.getState().auth.user?.email).toBe("member@gia-pha.local");
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  });

  it("gửi device_name và cắt khoảng trắng ở email", async () => {
    const { calls } = mockFetch({ "POST /api/v1/auth/login": { body: { data: authUser(), token: "t", token_type: "Bearer" } } });
    const user = userEvent.setup();
    renderWithProviders(<LoginDialog open onOpenChange={vi.fn()} />);

    await user.type(screen.getByLabelText("Email"), "  admin@gia-pha.local  ");
    await user.type(screen.getByLabelText("Mật khẩu"), "password");
    await user.click(screen.getByRole("button", { name: "Đăng nhập" }));

    await waitFor(() => expect(calls).toHaveLength(1));
    expect(calls[0].body).toMatchObject({ email: "admin@gia-pha.local", device_name: "gia-pha-web" });
  });

  it("gửi kèm Authorization header khi đã có token trong localStorage", async () => {
    signIn(authUser("member"), "tok-existing");
    const { calls } = mockFetch({ "POST /api/v1/auth/login": { body: { data: authUser(), token: "t", token_type: "Bearer" } } });
    const user = userEvent.setup();
    renderWithProviders(<LoginDialog open onOpenChange={vi.fn()} />);

    await user.type(screen.getByLabelText("Email"), "a@b.local");
    await user.type(screen.getByLabelText("Mật khẩu"), "pw");
    await user.click(screen.getByRole("button", { name: "Đăng nhập" }));

    await waitFor(() => expect(calls).toHaveLength(1));
    // Headers chuẩn hoá key thành chữ thường.
    expect(calls[0].headers.authorization).toBe("Bearer tok-existing");
  });
});

describe("IT-AUTH – Abnormal / Validation", () => {
  it("disable nút đăng nhập khi thiếu email hoặc mật khẩu", () => {
    renderWithProviders(<LoginDialog open onOpenChange={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Đăng nhập" })).toBeDisabled();
    expect(screen.getByLabelText("Email")).toBeRequired();
    expect(screen.getByLabelText("Mật khẩu")).toBeRequired();
  });

  it("disable nút khi email chỉ gồm khoảng trắng", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginDialog open onOpenChange={vi.fn()} />);

    await user.type(screen.getByLabelText("Email"), "   ");
    await user.type(screen.getByLabelText("Mật khẩu"), "password");

    expect(screen.getByRole("button", { name: "Đăng nhập" })).toBeDisabled();
  });
});




describe("IT-AUTH – Exception Cases", () => {
  it("422 sai thông tin đăng nhập: hiện toast tiếng Việt và giữ nguyên phiên", async () => {
    mockFetch({ "POST /api/v1/auth/login": { status: 422, body: { message: "Email hoặc mật khẩu không đúng." } } });
    const user = userEvent.setup();
    renderWithProviders(<LoginDialog open onOpenChange={vi.fn()} />);

    await user.type(screen.getByLabelText("Email"), "sai@gia-pha.local");
    await user.type(screen.getByLabelText("Mật khẩu"), "saisai");
    await user.click(screen.getByRole("button", { name: "Đăng nhập" }));

    // Radix Dialog đặt aria-hidden lên phần còn lại của body nên phải truyền hidden:true.
    expect(await screen.findByRole("alert", { hidden: true })).toHaveTextContent("Email hoặc mật khẩu không đúng.");
    expect(window.localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull();
    // DEFECT-04 đã fix: onQueryStarted dispatch authLoginFailed() nên status về guest.
    await waitFor(() => expect(store.getState().auth.status).toBe("guest"));
  });

  it("login thất bại khi đã có phiên cũ thì giữ status authenticated", async () => {
    signIn(authUser("member"), "tok-existing");
    mockFetch({ "POST /api/v1/auth/login": { status: 422, body: { message: "Email hoặc mật khẩu không đúng." } } });
    const user = userEvent.setup();
    renderWithProviders(<LoginDialog open onOpenChange={vi.fn()} />);

    await user.type(screen.getByLabelText("Email"), "sai@gia-pha.local");
    await user.type(screen.getByLabelText("Mật khẩu"), "saisai");
    await user.click(screen.getByRole("button", { name: "Đăng nhập" }));

    await screen.findByRole("alert", { hidden: true });
    // authLoginFailed chỉ hạ về guest khi không còn user/token hợp lệ.
    expect(store.getState().auth.status).toBe("authenticated");
    expect(store.getState().auth.user?.email).toBe("member@gia-pha.local");
  });

  it("500 Internal Server Error: hiện thông báo lỗi thay vì crash", async () => {
    mockFetch({ "POST /api/v1/auth/login": { status: 500, body: { message: "Lỗi máy chủ." } } });
    const user = userEvent.setup();
    renderWithProviders(<LoginDialog open onOpenChange={vi.fn()} />);

    await user.type(screen.getByLabelText("Email"), "a@b.local");
    await user.type(screen.getByLabelText("Mật khẩu"), "pw");
    await user.click(screen.getByRole("button", { name: "Đăng nhập" }));

    expect(await screen.findByRole("alert", { hidden: true })).toHaveTextContent("Lỗi máy chủ.");
    expect(store.getState().auth.token).toBeNull();
  });

  it("mất kết nối mạng (fetch reject): báo lỗi tiếng Việt qua getApiErrorMessage", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new TypeError("Failed to fetch"); }));
    const user = userEvent.setup();
    renderWithProviders(<LoginDialog open onOpenChange={vi.fn()} />);

    await user.type(screen.getByLabelText("Email"), "a@b.local");
    await user.type(screen.getByLabelText("Mật khẩu"), "pw");
    await user.click(screen.getByRole("button", { name: "Đăng nhập" }));

    expect(await screen.findByRole("alert", { hidden: true })).toBeInTheDocument();
    expect(window.localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull();
    expect(store.getState().auth.token).toBeNull();
  });

  it("401 từ API: baseQuery tự clear token, reset cache và đưa về trạng thái guest", async () => {
    signIn(authUser("member"), "tok-expired");
    mockFetch({ "GET /api/v1/members": { status: 401, body: { message: "Unauthenticated." } } });

    // Dùng dispatch one-off thay vì hook có subscriber: resetApiState() sẽ xoá cache
    // và khiến hook subscribe lại gọi lại API vô hạn (lỗi) — 401 vẫn được kiểm tra
    // đúng qua cùng một baseQuery.
    // Lưu ý: sau resetApiState() mutation đang chạy bị xoá nên promise resolve
    // undefined thay vì reject — ta assert hậu quả quan sát được thay vì lỗi.
    await store.dispatch(getMembers.initiate({ authKey: "member", filters: {} }));

    await waitFor(() => expect(store.getState().auth.status).toBe("guest"));
    expect(window.localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull();
  });
});


