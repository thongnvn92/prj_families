import { useEffect, useState } from "react";
import { chatApiSlice } from "../../app/chatApi";
import { chatMessageFromBroadcast, upsertChatMessage, type MessageSentBroadcastEvent } from "../../app/chatApiMapper";
import { useAppDispatch } from "../../app/hooks";
import { chatGroupChannel, chatGroupPrivateChannel, disposeEcho, getEcho, MESSAGE_SENT_EVENTS, onRealtimeStatusChange, userPrivateChannel, type RealtimeStatus } from "../../lib/echo";
import type { AppRole } from "../../context/AuthContext";

interface UseChatRealtimeArgs {
  /** Nhóm chat đang mở; null nghĩa là chưa chọn nhóm nào. */
  groupId: string | null;
  /** Khoá cache RTK Query phải khớp với tham số hook useGetGroupMessagesQuery. */
  authKey: AppRole;
  /** Chỉ mở WebSocket khi người dùng đã đăng nhập và được phép xem chat nhóm. */
  enabled: boolean;
  /** Passport token; đổi token thì tạo lại Echo để channel được authorize lại. */
  token: string | null;
  /** Id tài khoản để subscribe channel nền `users.{userId}`. */
  userId: string | null;
}

/**
 * Kết nối realtime cho màn hình chat:
 *  - subscribe private channel của nhóm đang mở để nhận tin nhắn mới vào cache;
 *  - subscribe channel nền `users.{userId}` để tăng bộ đếm tin chưa đọc của nhóm khác
 *    và cập nhật preview danh sách nhóm kể cả khi đang ở mục khác.
 *
 * Vòng đời: đổi nhóm/chuyển tab sẽ chạy cleanup nên `echo.leaveChannel()` giải phóng
 * channel cũ, tránh rò rỉ listener và bộ nhớ.
 */
export function useChatRealtime({ groupId, authKey, enabled, token, userId }: UseChatRealtimeArgs): RealtimeStatus {
  const dispatch = useAppDispatch();
  const [status, setStatus] = useState<RealtimeStatus>("idle");

  // Channel của nhóm đang mở: nhận tin nhắn mới.
  useEffect(() => {
    if (!enabled || !groupId) {
      setStatus("idle");
      return undefined;
    }
    const echo = getEcho();
    if (!echo) {
      setStatus("idle");
      return undefined;
    }
    const stopStatus = onRealtimeStatusChange(setStatus);
    const channel = echo.private(chatGroupChannel(groupId));
    const receiveMessage = (payload: MessageSentBroadcastEvent) => {
      const message = chatMessageFromBroadcast(payload);
      if (!message) return;
      dispatch(chatApiSlice.util.updateQueryData("getGroupMessages", { authKey, groupId }, (messages) => upsertChatMessage(messages, message)));
    };
    MESSAGE_SENT_EVENTS.forEach((event) => channel.listen(event, receiveMessage));
    return () => {
      MESSAGE_SENT_EVENTS.forEach((event) => channel.stopListening(event, receiveMessage));
      // Bỏ tên channel đầy đủ ("private-...") vì Echo index theo tên đã có tiền tố.
      echo.leaveChannel(chatGroupPrivateChannel(groupId));
      stopStatus();
    };
  }, [authKey, dispatch, enabled, groupId, token]);

  /**
   * Channel nền: luôn mở để nhận thông báo mọi nhóm thành viên. Tin tới nhóm đang xem
   * thì không tính chưa đọc, ngược lại tăng bộ đếm; preview danh sách nhóm luôn cập nhật.
   */
  useEffect(() => {
    if (!enabled || !userId) {
      return undefined;
    }
    const echo = getEcho();
    if (!echo) {
      return undefined;
    }
    const channel = echo.private(`users.${userId}`);
    const receiveMessage = (payload: MessageSentBroadcastEvent) => {
      const message = chatMessageFromBroadcast(payload);
      if (!message) return;
      dispatch(chatApiSlice.util.updateQueryData("getChatGroups", { authKey }, (groups) => groups.map((group) => (group.id === message.groupId
        ? { ...group, lastMessage: message.messageText || "Tin nhắn kèm ảnh", unreadCount: group.id === groupId ? 0 : (group.unreadCount ?? 0) + 1 }
        : group))));
    };
    MESSAGE_SENT_EVENTS.forEach((event) => channel.listen(event, receiveMessage));
    return () => {
      MESSAGE_SENT_EVENTS.forEach((event) => channel.stopListening(event, receiveMessage));
      echo.leaveChannel(userPrivateChannel(userId));
    };
  }, [authKey, dispatch, enabled, groupId, token, userId]);

  // Mở nhóm nào thì xoá bộ đếm chưa đọc của chính nhóm đó.
  useEffect(() => {
    if (!enabled || !groupId) return;
    dispatch(chatApiSlice.util.updateQueryData("getChatGroups", { authKey }, (groups) => groups.map((group) => (group.id === groupId ? { ...group, unreadCount: 0 } : group))));
  }, [authKey, dispatch, enabled, groupId]);

  // Logout thì đóng socket ngay thay vì để Echo giữ token đã hết hiệu lực.
  useEffect(() => {
    if (!token) disposeEcho();
  }, [token]);

  return status;
}
