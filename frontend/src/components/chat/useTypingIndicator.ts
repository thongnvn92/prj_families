import { useCallback, useEffect, useRef, useState } from "react";
import { chatGroupChannel, getEcho } from "../../lib/echo";

/** Tên whisper typing — backend không broadcast, Reverb chỉ chuyển tiếp client event. */
const TYPING_EVENT = "typing";
/** Giới hạn tần suất gửi whisper để không spam kết nối WebSocket khi gõ nhanh. */
const TYPING_THROTTLE_MS = 2000;
/** Tự tắt chỉ báo "đang soạn tin" nếu người kia ngừng gõ. */
const TYPING_TTL_MS = 4000;

interface TypingIndicatorPayload {
  userId?: string | number;
  userName?: string;
}

interface UseTypingIndicatorArgs {
  /** Nhóm chat đang mở; chỉ báo soạn tin chỉ có ý nghĩa trong nhóm đang xem. */
  groupId: string | null;
  /** Chỉ bật khi người dùng đã đăng nhập và được phép xem chat nhóm. */
  enabled: boolean;
  userId: string | null;
  userName: string;
}

/**
 * Chỉ báo "… đang soạn tin" hai chiều bằng whisper của Echo/Pusher.
 *
 * Whisper là client event nên không cần backend broadcast; Reverb chỉ chuyển tiếp cho
 * các thành viên đang subscribe cùng private channel (config `accept_client_events_from`).
 */
export function useTypingIndicator({ groupId, enabled, userId, userName }: UseTypingIndicatorArgs) {
  const [typingNames, setTypingNames] = useState<string[]>([]);
  const timers = useRef<Record<string, number>>({});
  const lastSentAt = useRef(0);
  const channelRef = useRef<ReturnType<NonNullable<ReturnType<typeof getEcho>>["private"]> | null>(null);

  const clear = useCallback(() => {
    Object.values(timers.current).forEach((timer) => window.clearTimeout(timer));
    timers.current = {};
    setTypingNames([]);
  }, []);

  useEffect(() => {
    if (!enabled || !groupId || !userId) {
      channelRef.current = null;
      clear();
      return undefined;
    }
    const echo = getEcho();
    if (!echo) {
      channelRef.current = null;
      return undefined;
    }
    const channel = echo.private(chatGroupChannel(groupId));
    channelRef.current = channel;
    const receiveTyping = (payload?: TypingIndicatorPayload) => {
      const typingId = payload?.userId === undefined ? null : String(payload.userId);
      // Bỏ qua chính mình: người gõ không cần thấy chỉ báo của chính mình.
      if (!typingId || typingId === userId) return;
      const name = payload?.userName?.trim() || "Thành viên";
      window.clearTimeout(timers.current[typingId]);
      timers.current[typingId] = window.setTimeout(() => {
        delete timers.current[typingId];
        setTypingNames((current) => current.filter((item) => item !== name));
      }, TYPING_TTL_MS);
      setTypingNames((current) => (current.includes(name) ? current : [...current, name]));
    };
    channel.listenForWhisper(TYPING_EVENT, receiveTyping);
    return () => {
      channel.stopListeningForWhisper(TYPING_EVENT, receiveTyping);
      channelRef.current = null;
      clear();
    };
  }, [clear, enabled, groupId, userId]);

  /** Báo nhóm biết người dùng đang gõ; tự bỏ qua nếu gửi quá dày. */
  const notifyTyping = useCallback(() => {
    if (!userId || !channelRef.current) return;
    const now = Date.now();
    if (now - lastSentAt.current < TYPING_THROTTLE_MS) return;
    lastSentAt.current = now;
    channelRef.current.whisper(TYPING_EVENT, { userId, userName });
  }, [userId, userName]);

  return { typingNames, notifyTyping };
}
