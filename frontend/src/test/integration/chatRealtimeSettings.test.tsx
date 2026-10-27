import { act, render, renderHook, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Provider } from "react-redux";
import { store } from "../../app/store";
import { chatApiSlice, useGetGroupMessagesQuery } from "../../app/chatApi";
import { familySettingsApiSlice, useGetFamilySettingsQuery, useUpdateFamilySettingsMutation } from "../../app/familySettingsApi";
import { mockFetch, resetApiState, signIn } from "../integration";
import { authUser } from "../fixtures";
import type { ChatMessage } from "../../types/chat";
import { useChatRealtime } from "../../components/chat/useChatRealtime";

/*
 * IT Flow 3 — Realtime Chat: broadcast Event qua Echo -> upsert vào cache RTK Query.
 * IT Flow 4 — Admin Settings: bật/tắt chat -> cache cập nhật -> UI đổi theo.
 */

const wrapper = ({ children }: { children: React.ReactNode }) => <Provider store={store}>{children}</Provider>;

/** Echo giả: gom các handler đăng ký để test trigger broadcast. */
function createFakeEcho() {
  const listeners = new Map<string, Set<(payload: unknown) => void>>();
  const left: string[] = [];
  return {
    left,
    private: (name: string) => ({
      listen: (event: string, cb: (payload: unknown) => void) => {
        const key = `${name}:${event}`;
        if (!listeners.has(key)) listeners.set(key, new Set());
        listeners.get(key)!.add(cb);
      },
      stopListening: (event: string, cb: (payload: unknown) => void) => {
        listeners.get(`${name}:${event}`)?.delete(cb);
      },
    }),
    leaveChannel: (name: string) => { left.push(name); },
    connector: { connectionStatus: () => "connected", onConnectionChange: () => () => undefined },
    disconnect: () => undefined,
    emit: (name: string, event: string, payload: unknown) => {
      listeners.get(`${name}:${event}`)?.forEach((cb) => cb(payload));
    },
    count: (name: string, event: string) => listeners.get(`${name}:${event}`)?.size ?? 0,
  };
}

type FakeEcho = ReturnType<typeof createFakeEcho>;

const h = vi.hoisted(() => ({ echo: null as unknown }));

vi.mock("../../lib/echo", () => ({
  getEcho: () => h.echo,
  disposeEcho: () => undefined,
  onRealtimeStatusChange: () => () => undefined,
  chatGroupChannel: (id: string) => `chat-groups.${id}`,
  chatGroupPrivateChannel: (id: string) => `private-chat-groups.${id}`,
  userPrivateChannel: (id: string) => `private-users.${id}`,
  MESSAGE_SENT_EVENTS: [".message.sent"] as const,
}));

const { updateFamilySettings } = familySettingsApiSlice.endpoints;

function apiMessage(id: number, text: string): Record<string, unknown> {
  return { id, group_id: 7, sender_id: 1, sender_name: "A", sender_role: "member", message_text: text, created_at: "2026-09-30T10:00:00+07:00" };
}

/** Component chủ động mở kết nối realtime cho nhóm 7. */
function RealtimeHost() {
  useChatRealtime({ groupId: "7", authKey: "admin", enabled: true, token: "tok-admin", userId: "1" });
  return null;
}

/** Danh sách tin nhắn thật, subscribe cache RTK Query và render ra DOM. */
function MessageList() {
  const { data } = useGetGroupMessagesQuery({ authKey: "admin", groupId: "7" });
  return (
    <ul data-testid="messages">
      {(data ?? []).map((message) => <li key={message.id}>{message.messageText}</li>)}
    </ul>
  );
}

beforeEach(() => {
  resetApiState();
  h.echo = createFakeEcho();
  signIn(authUser("admin"), "tok-admin");
});

afterEach(() => {
  vi.unstubAllGlobals();
});


describe("IT-CHAT-REALTIME – Broadcast vào cache RTK Query", () => {
  it("broadcast ghi tin mới vào cache và hiển thị trên UI", async () => {
    mockFetch({ "GET /api/v1/chat/groups/7/messages": { body: { data: [apiMessage(1, "Tin cũ")] } } });

    render(
      <>
        <MessageList />
        <RealtimeHost />
      </>,
      { wrapper },
    );
    await waitFor(() => expect(screen.getByText("Tin cũ")).toBeInTheDocument());

    act(() => {
      (h.echo as FakeEcho).emit("chat-groups.7", ".message.sent", { message: apiMessage(2, "Tin mới") });
    });

    await waitFor(() => expect(screen.getByText("Tin mới")).toBeInTheDocument());
    expect(screen.getByTestId("messages").querySelectorAll("li")).toHaveLength(2);
  });

  it("broadcast trùng id không tạo tin lặp", async () => {
    mockFetch({ "GET /api/v1/chat/groups/7/messages": { body: { data: [apiMessage(1, "Tin cũ")] } } });

    render(
      <>
        <MessageList />
        <RealtimeHost />
      </>,
      { wrapper },
    );
    await waitFor(() => expect(screen.getByText("Tin cũ")).toBeInTheDocument());

    act(() => {
      const echo = h.echo as FakeEcho;
      const payload = { message: apiMessage(1, "Tin cũ đã cập nhật") };
      echo.emit("chat-groups.7", ".message.sent", payload);
      echo.emit("chat-groups.7", ".message.sent", payload);
    });

    await waitFor(() => expect(screen.getByText("Tin cũ đã cập nhật")).toBeInTheDocument());
    expect(screen.getByTestId("messages").querySelectorAll("li")).toHaveLength(1);
  });

  it("cleanup: unmount gọi leaveChannel cho channel nhóm và channel nền", () => {
    const echo = h.echo as FakeEcho;
    const { unmount } = renderHook(
      () => useChatRealtime({ groupId: "7", authKey: "admin", enabled: true, token: "tok-admin", userId: "1" }),
      { wrapper },
    );
    expect(echo.count("chat-groups.7", ".message.sent")).toBe(1);

    unmount();

    expect(echo.left).toContain("private-chat-groups.7");
    expect(echo.left).toContain("private-users.1");
    expect(echo.count("chat-groups.7", ".message.sent")).toBe(0);
  });

  it("không subscribe khi enabled = false (khách chưa đăng nhập)", () => {
    const echo = h.echo as FakeEcho;
    renderHook(() => useChatRealtime({ groupId: "7", authKey: "guest", enabled: false, token: null, userId: null }), { wrapper });

    expect(echo.left).toHaveLength(0);
    expect(echo.count("chat-groups.7", ".message.sent")).toBe(0);
  });
});

describe("IT-SETTINGS-TOGGLE – Cập nhật chatEnabled", () => {
  it("mapper chuẩn hoá chat_enabled=false thành chatEnabled=false", async () => {
    mockFetch({ "GET /api/v1/family-settings": { body: { data: { family_id: 1, chat_enabled: false, image_upload_roles: ["admin", "member"] } } } });

    const { result } = renderHook(() => useGetFamilySettingsQuery("admin"), { wrapper });

    await waitFor(() => expect(result.current.data?.chatEnabled).toBe(false));
    expect(result.current.data?.imageUploadRoles).toEqual(["admin", "member"]);
  });

  it("PUT tắt chat rồi invalidate tag -> subscriber nhận giá trị mới", async () => {
    let enabled = true;
    mockFetch({
      "GET /api/v1/family-settings": () => ({ body: { data: { family_id: 1, chat_enabled: enabled, image_upload_roles: ["admin"] } } }),
      "PUT /api/v1/family-settings": () => {
        enabled = false;
        return { body: { data: { family_id: 1, chat_enabled: false, image_upload_roles: ["admin"] }, message: "Đã cập nhật." } };
      },
    });

    const { result } = renderHook(() => useGetFamilySettingsQuery("admin"), { wrapper });
    await waitFor(() => expect(result.current.data?.chatEnabled).toBe(true));

    await act(async () => {
      await store.dispatch(updateFamilySettings.initiate({ chatEnabled: false, imageUploadRoles: ["admin"] })).unwrap();
    });

    await waitFor(() => expect(result.current.data?.chatEnabled).toBe(false));
  });

  it("PUT gửi đúng payload snake_case xuống server", async () => {
    const { calls } = mockFetch({ "PUT /api/v1/family-settings": { body: { data: { family_id: 1, chat_enabled: true, image_upload_roles: ["admin"] } } } });

    await store.dispatch(updateFamilySettings.initiate({ chatEnabled: true, imageUploadRoles: ["admin", "member"] })).unwrap();

    const put = calls.find((c) => c.method === "PUT");
    expect(put?.body).toEqual({ chat_enabled: true, image_upload_roles: ["admin", "member"] });
  });
});