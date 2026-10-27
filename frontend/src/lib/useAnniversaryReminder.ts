import { useEffect } from "react";
import { anniversaryReminderFromBroadcast } from "../app/calendarApiMapper";
import { getEcho } from "./echo";
import type { AnniversaryReminder } from "../types/calendar";

interface UseAnniversaryReminderArgs {
  /** Chỉ mở khi đã đăng nhập và có userId (channel nền cần id cụ thể). */
  enabled: boolean;
  /** AuthUser.id là number; null khi chưa đăng nhập. */
  userId: number | null;
  onReminder: (reminder: AnniversaryReminder) => void;
}

/**
 * Nhận thông báo nhắc giỗ do job `RemindUpcomingAnniversaries` phát qua Reverb.
 *
 * Backend broadcast trên channel nền `users.{id}` với event `anniversary.reminder`
 * (xem `App\Events\AnniversaryReminderSent`). Tên event phải có dấu chấm dẫn đầu vì
 * Echo chỉ bỏ qua namespace khi tên bắt đầu bằng "." hoặc "\".
 *
 * Hook tự gỡ listener khi đóng màn hình hoặc đổi tài khoản.
 */
export const ANNIVERSARY_REMINDER_EVENT = ".anniversary.reminder";

export function useAnniversaryReminder({ enabled, userId, onReminder }: UseAnniversaryReminderArgs): void {
  // onReminder cố tình không nằm trong deps: parent truyền callback mới mỗi render sẽ
  // khiến effect chạy lại liên tục và ngắt kết nối WebSocket.
  const handler = onReminder;

  useEffect(() => {
    if (!enabled || !userId) return undefined;
    const echo = getEcho();
    if (!echo) return undefined;

    // echo.private() tự thêm tiền tố "private-" nên phải truyền tên channel thô.
    const channel = echo.private(`users.${userId}`);
    const listener = (payload: unknown) => {
      const reminder = anniversaryReminderFromBroadcast(payload);
      if (reminder) handler(reminder);
    };
    channel.listen(ANNIVERSARY_REMINDER_EVENT, listener);

    return () => {
      // Chỉ gỡ listener, KHÔNG leaveChannel: useChatRealtime dùng chung channel nền này
      // cho bộ đếm tin chưa đọc nên rời channel sẽ phá vỡ tính năng chat.
      channel.stopListening(ANNIVERSARY_REMINDER_EVENT, listener);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, userId]);
}