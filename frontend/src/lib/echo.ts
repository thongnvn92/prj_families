import Echo, { type ConnectionStatus } from "laravel-echo";
import PusherClient from "pusher-js";

import { API_BASE_URL } from "../app/apiSlice";
import { getStoredToken } from "../app/authSlice";

/** Trạng thái realtime dùng cho badge UI; "idle" = chưa có Echo instance (guest hoặc đã logout). */
export type RealtimeStatus = ConnectionStatus | "idle";

/** Endpoint cấp chữ ký subscribe cho private channel; phải khớp prefix của withBroadcasting. */
export const REVERB_AUTH_ENDPOINT = `${API_BASE_URL}/broadcasting/auth`;

const reverbAppKey = import.meta.env.VITE_REVERB_APP_KEY?.trim() || "gia-pha-dev-key";
const reverbHost = import.meta.env.VITE_REVERB_HOST?.trim() || "127.0.0.1";
const reverbPort = Number.parseInt(import.meta.env.VITE_REVERB_PORT?.trim() ?? "", 10) || 8081;
const reverbForceTls = (import.meta.env.VITE_REVERB_SCHEME?.trim() || "http") === "https";

/**
 * Tên channel chat khai báo ở laravel_api/routes/channels.php và phát ra từ
 * App\Events\MessageSent::broadcastOn(). Backend là nguồn sự thật nên frontend
 * subscribe đúng tên này thay vì tự đặt tên riêng.
 */
export function chatGroupChannel(groupId: string): string {
  return `chat-groups.${groupId}`;
}

/** Tên channel đầy đủ phía Reverb/Pusher (Echo tự thêm tiền tố "private-"). */
export function chatGroupPrivateChannel(groupId: string): string {
  return `private-${chatGroupChannel(groupId)}`;
}

/**
 * Channel nền riêng của tài khoản, khai báo trong laravel_api/routes/channels.php
 * (`users.{userId}` — chỉ chính chủ được subscribe). Nhờ vậy client luôn giữ kết nối
 * để cập nhật bộ đếm tin chưa đọc cho các nhóm chưa mở.
 */
export function userPrivateChannel(userId: string | number): string {
  return `private-users.${userId}`;
}

/**
 * Event name của App\Events\MessageSent.
 *
 * Backend khai báo `broadcastAs(): 'message.sent'` nên Pusher phát đúng chuỗi
 * `message.sent`; EventFormatter của Echo chỉ bỏ qua namespace khi tên event bắt
 * đầu bằng "." hoặc "\" — vì vậy phải truyền dạng có dấu chấm dẫn đầu.
 * Hai alias còn lại giúp client vẫn nhận tin nếu backend sau này bỏ broadcastAs()
 * (tên mặc định của Laravel là FQCN `App\Events\MessageSent`).
 */
export const MESSAGE_SENT_EVENTS = [".message.sent", ".MessageSent", ".App\\Events\\MessageSent"] as const;

let echoInstance: Echo<"pusher"> | null = null;
let echoToken: string | null = null;

/** Ngắt kết nối và xoá singleton; dùng khi logout hoặc khi token Passport đổi. */
export function disposeEcho(): void {
  if (!echoInstance) return;
  echoInstance.disconnect();
  echoInstance = null;
  echoToken = null;
}

/**
 * Trả về Echo singleton đã gắn Bearer token, hoặc null khi khách chưa đăng nhập.
 * Tự tạo lại instance khi token trong localStorage thay đổi để private channel
 * luôn được authorize bằng token còn hiệu lực.
 *
 * Realtime là tính năng bổ sung nên lỗi khởi tạo (sai cấu hình Reverb, thiếu
 * pusher-js…) chỉ được hạ xuống `null` — hook gọi sẽ hiển thị trạng thái
 * "ngoại tuyến" thay vì ném lỗi làm sập cả cây component.
 */
export function getEcho(): Echo<"pusher"> | null {
  if (typeof window === "undefined") return null;
  const token = getStoredToken();
  if (!token) {
    disposeEcho();
    return null;
  }
  if (echoInstance && echoToken === token) return echoInstance;
  disposeEcho();
  let created: Echo<"pusher">;
  try {
    created = new Echo({
      broadcaster: "pusher",
      // BẮT BUỘC: laravel-echo v2 không tự bundle pusher-js. PusherConnector.connect()
      // dò theo thứ tự options.client (instance) -> options.Pusher (class) ->
      // window.Pusher rồi mới ném "Pusher client not found". Vì pusher-js là ESM nên
      // không tự gắn window.Pusher, nên phải truyền constructor tường minh.
      Pusher: PusherClient,
      key: reverbAppKey,
      // Reverb không dùng cluster; pusher-js bắt buộc có key này nên gán chuỗi rỗng.
      cluster: "",
      wsHost: reverbHost,
      wsPort: reverbPort,
      wssPort: reverbPort,
      forceTLS: reverbForceTls,
      enabledTransports: ["ws", "wss"],
      disableStats: true,
      // Private channel cần đăng nhập nên endpoint phải kèm header Authorization.
      authEndpoint: REVERB_AUTH_ENDPOINT,
      auth: { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } },
    });
  } catch (error) {
    console.warn("[echo] Không khởi tạo được realtime, tạm tắt WebSocket.", error);
    return null;
  }
  echoInstance = created;
  echoToken = token;
  return created;
}

/**
 * Theo dõi trạng thái kết nối. laravel-echo v2 bind sẵn vào
 * `pusher.connection` các event `state_change` / `connected` / `disconnected`
 * (chính là cơ chế reconnect của pusher-js) và trả về hàm gỡ listener.
 */
export function onRealtimeStatusChange(handler: (status: RealtimeStatus) => void): () => void {
  const echo = getEcho();
  if (!echo) {
    handler("idle");
    return () => undefined;
  }
  handler(echo.connector.connectionStatus());
  return echo.connector.onConnectionChange(handler);
}
