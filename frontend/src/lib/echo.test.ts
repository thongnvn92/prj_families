import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Cấu hình env phải được set TRƯỚC khi import src/lib/echo.ts vì module đọc
 * import.meta.env lúc nạp. Do đó import động trong beforeAll.
 */
vi.stubEnv("VITE_REVERB_APP_KEY", "gia-pha-test-key");
vi.stubEnv("VITE_REVERB_HOST", "reverb.test");
vi.stubEnv("VITE_REVERB_PORT", "9999");
vi.stubEnv("VITE_REVERB_SCHEME", "https");

/**
 * Pusher giả: `src/lib/echo.ts` truyền constructor pusher-js qua `options.Pusher` nên
 * phải mock module "pusher-js". Trước đây test fakes `window.Pusher` — cách đó **che
 * mất bug thật** vì app không hề gắn global này, dẫn tới lỗi "Pusher client not found".
 * Dùng `vi.hoisted` vì factory của `vi.mock` được nâng lên đầu file.
 */
const { FakePusher } = vi.hoisted(() => {
  class FakePusher {
    static instances: FakePusher[] = [];
    /** Bật để giả lập pusher-js ném lỗi khi khởi tạo. */
    static failNext = false;
    key: string;
    options: Record<string, unknown>;
    disconnected = false;
    connection = { socket_id: "123.456", state: "connected", bind: vi.fn(), unbind: vi.fn() };
    channels = { channels: {} as Record<string, unknown>, subscribe: vi.fn(), unsubscribe: vi.fn() };
    disconnect = vi.fn(() => {
      this.disconnected = true;
    });

    constructor(key: string, options: Record<string, unknown>) {
      if (FakePusher.failNext) throw new Error("Pusher client not found. Should be globally available or passed via options.client");
      this.key = key;
      this.options = options;
      FakePusher.instances.push(this);
    }
  }
  return { FakePusher };
});

vi.mock("pusher-js", () => ({ default: FakePusher }));

type EchoModule = typeof import("./echo");

let echoModule: EchoModule;

beforeEach(async () => {
  echoModule = await import("./echo");
  echoModule.disposeEcho();
  FakePusher.instances = [];
  FakePusher.failNext = false;
  window.localStorage.clear();
  // Xoá global để test phải đúng nhờ options.Pusher chứ không dựa vào window.Pusher.
  delete (window as unknown as { Pusher?: unknown }).Pusher;
});

describe("lib/echo – khởi tạo singleton Echo cho Reverb", () => {
  it("truyền constructor pusher-js qua options.Pusher nên không phụ thuộc window.Pusher", () => {
    // Regression: thiếu `Pusher` khiến laravel-echo ném
    // "Pusher client not found" và làm sập component FamilyChatView.
    expect((window as unknown as { Pusher?: unknown }).Pusher).toBeUndefined();
    window.localStorage.setItem("gia_pha_token", "token-1");

    expect(() => echoModule.getEcho()).not.toThrow();
    expect(FakePusher.instances).toHaveLength(1);
  });

  it("trả null thay vì ném lỗi ra component khi khởi tạo Echo thất bại", () => {
    // Realtime chỉ là tiện ích: lỗi không được làm sập cả cây React.
    FakePusher.failNext = true;
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    window.localStorage.setItem("gia_pha_token", "token-1");

    expect(echoModule.getEcho()).toBeNull();
    expect(warn).toHaveBeenCalled();
  });

  it("trả null khi khách chưa đăng nhập (không có token)", () => {
    expect(echoModule.getEcho()).toBeNull();
    expect(FakePusher.instances).toHaveLength(0);
  });

  it("tạo đúng một instance và tái dùng khi gọi lại", () => {
    window.localStorage.setItem("gia_pha_token", "token-1");

    const first = echoModule.getEcho();
    const second = echoModule.getEcho();

    expect(first).not.toBeNull();
    expect(second).toBe(first);
    expect(FakePusher.instances).toHaveLength(1);
  });

  it("truyền cấu hình Reverb đúng từ biến môi trường", () => {
    window.localStorage.setItem("gia_pha_token", "token-1");

    echoModule.getEcho();
    const options = FakePusher.instances[0].options as Record<string, unknown>;

    expect(FakePusher.instances[0].key).toBe("gia-pha-test-key");
    expect(options.broadcaster).toBe("pusher");
    expect(options.wsHost).toBe("reverb.test");
    expect(options.wsPort).toBe(9999);
    expect(options.wssPort).toBe(9999);
    // https => forceTLS; Reverb không dùng cluster nên cluster rỗng.
    expect(options.forceTLS).toBe(true);
    expect(options.cluster).toBe("");
    expect(options.enabledTransports).toEqual(["ws", "wss"]);
    expect(options.disableStats).toBe(true);
  });

  it("gắn Authorization Bearer token cho endpoint authorize private channel", () => {
    window.localStorage.setItem("gia_pha_token", "token-abc");

    echoModule.getEcho();
    const options = FakePusher.instances[0].options as { authEndpoint?: string; auth?: { headers?: Record<string, string> } };

    expect(options.authEndpoint).toBe(`${import.meta.env.VITE_API_URL}/broadcasting/auth`);
    expect(options.auth?.headers?.Authorization).toBe("Bearer token-abc");
  });

  it("tạo lại instance và ngắt instance cũ khi token đổi", () => {
    window.localStorage.setItem("gia_pha_token", "token-1");
    const first = echoModule.getEcho();

    window.localStorage.setItem("gia_pha_token", "token-2");
    const second = echoModule.getEcho();

    expect(second).not.toBe(first);
    expect(FakePusher.instances).toHaveLength(2);
    expect(FakePusher.instances[0].disconnected).toBe(true);
    const options = FakePusher.instances[1].options as { auth?: { headers?: Record<string, string> } };
    expect(options.auth?.headers?.Authorization).toBe("Bearer token-2");
  });

  it("disposeEcho ngắt kết nối và tạo lại được sau đó", () => {
    window.localStorage.setItem("gia_pha_token", "token-1");
    const first = echoModule.getEcho();

    echoModule.disposeEcho();

    expect(FakePusher.instances[0].disconnected).toBe(true);
    expect(echoModule.getEcho()).not.toBe(first);
  });

  it("xoá singleton khi token bị xoá (đăng xuất)", () => {
    window.localStorage.setItem("gia_pha_token", "token-1");
    const first = echoModule.getEcho();

    window.localStorage.removeItem("gia_pha_token");
    const second = echoModule.getEcho();

    expect(second).toBeNull();
    expect(FakePusher.instances[0].disconnected).toBe(true);
  });

  it("dựng tên channel đúng với routes/channels.php của Laravel", () => {
    expect(echoModule.chatGroupChannel("7")).toBe("chat-groups.7");
    expect(echoModule.chatGroupPrivateChannel("7")).toBe("private-chat-groups.7");
    expect(echoModule.userPrivateChannel(42)).toBe("private-users.42");
    expect(echoModule.userPrivateChannel("42")).toBe("private-users.42");
  });

  it("dùng event name có dấu chấm dẫn đầu để Echo bỏ qua namespace", () => {
    // EventFormatter chỉ bỏ tiền tố "App.Events" khi tên bắt đầu bằng "." hoặc "\".
    expect(echoModule.MESSAGE_SENT_EVENTS).toContain(".message.sent");
    expect(echoModule.MESSAGE_SENT_EVENTS.every((event) => event.startsWith("."))).toBe(true);
  });
});
