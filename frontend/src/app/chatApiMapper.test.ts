import { describe, expect, it } from "vitest";
import {
  chatGroupFromApi,
  chatMessageFromApi,
  chatMessageFromBroadcast,
  chatMessageListFromApi,
  upsertChatMessage,
  type ChatMessageApiRecord,
} from "./chatApiMapper";
import type { ChatMessage } from "../types/chat";

const record = (overrides: Partial<ChatMessageApiRecord> = {}): ChatMessageApiRecord => ({
  id: 1,
  group_id: 10,
  sender_id: 100,
  sender_name: "Nguyễn Văn An",
  sender_role: "member",
  message_text: "Xin chào",
  created_at: "2026-09-26T10:00:00+07:00",
  ...overrides,
});

const message = (overrides: Partial<ChatMessage> = {}): ChatMessage => ({
  id: "1",
  groupId: "10",
  senderId: "100",
  senderName: "Nguyễn Văn An",
  senderAvatar: "NA",
  senderRole: "Thành Viên",
  messageText: "Xin chào",
  imageUrl: null,
  createdAt: "2026-09-26T10:00:00+07:00",
  ...overrides,
});

describe("chatApiMapper – chuyển dữ liệu API sang domain", () => {
  it("map tin nhắn snake_case sang ChatMessage", () => {
    const result = chatMessageFromApi(record({ image_url: "http://cdn.test/a.webp" }));

    expect(result.id).toBe("1");
    expect(result.groupId).toBe("10");
    expect(result.senderId).toBe("100");
    expect(result.messageText).toBe("Xin chào");
    expect(result.imageUrl).toBe("http://cdn.test/a.webp");
  });

  it("đổi role tài khoản sang nhãn chức vụ dòng họ", () => {
    expect(chatMessageFromApi(record({ sender_role: "admin" })).senderRole).toBe("Trưởng Tộc");
    expect(chatMessageFromApi(record({ sender_role: "mod" })).senderRole).toBe("Trưởng Chi");
    expect(chatMessageFromApi(record({ sender_role: "member" })).senderRole).toBe("Thành Viên");
    expect(chatMessageFromApi(record({ sender_role: null })).senderRole).toBe("Thành Viên");
  });

  it("thiếu sender_avatar thì dùng chữ cái đầu làm avatar", () => {
    expect(chatMessageFromApi(record({ sender_avatar: null })).senderAvatar).toBe("AN");
  });

  it("bóc data khỏi response phân trang và sắp xếp theo thời gian", () => {
    const list = chatMessageListFromApi({
      data: [record({ id: 2, created_at: "2026-09-26T11:00:00+07:00" }), record({ id: 1, created_at: "2026-09-26T09:00:00+07:00" })],
      meta: { current_page: 1, last_page: 2, total: 2 },
    });

    expect(list.map((item) => item.id)).toEqual(["1", "2"]);
  });

  it("map nhóm chat và áp dụng giá trị mặc định an toàn", () => {
    const group = chatGroupFromApi({ id: 3, family_id: 1, name: "  ", type: "custom", member_count: null, last_message: null });

    expect(group.id).toBe("3");
    expect(group.name).toBe("Nhóm chat");
    expect(group.unreadCount).toBe(0);
    expect(group.lastMessage).toBe("Chưa có tin nhắn nào.");
  });

  it("map payload broadcast thành ChatMessage", () => {
    const result = chatMessageFromBroadcast({ message: record(), socket: null });

    expect(result?.id).toBe("1");
    expect(result?.messageText).toBe("Xin chào");
  });

  it("broadcast thiếu message thì trả null thay vì lỗi", () => {
    expect(chatMessageFromBroadcast({ socket: null })).toBeNull();
  });
});

describe("chatApiMapper – upsertChatMessage chống trùng tin nhắn", () => {
  it("chèn tin mới vào cuối danh sách", () => {
    const existing = [message({ id: "1" })];
    const result = upsertChatMessage(existing, message({ id: "2", createdAt: "2026-09-26T11:00:00+07:00" }));

    expect(result).toHaveLength(2);
    expect(result.map((item) => item.id)).toEqual(["1", "2"]);
    // Không được đụng vào mảng gốc (RTK Query dựa vào immutability).
    expect(existing).toHaveLength(1);
  });

  it("không thêm lần nữa khi tin đã có (HTTP + WebSocket trùng id)", () => {
    const existing = [message({ id: "1" })];
    const result = upsertChatMessage(existing, message({ id: "1" }));

    expect(result).toHaveLength(1);
  });

  it("làm mới nội dung khi cùng id nhưng dữ liệu mới hơn", () => {
    const existing = [message({ id: "1", messageText: "bản cũ" })];
    const result = upsertChatMessage(existing, message({ id: "1", messageText: "bản mới" }));

    expect(result).toHaveLength(1);
    expect(result[0].messageText).toBe("bản mới");
  });

  it("giữ nguyên vị trí khi cập nhật tin đã có", () => {
    const existing = [message({ id: "1" }), message({ id: "2" }), message({ id: "3" })];
    const result = upsertChatMessage(existing, message({ id: "2", messageText: "sửa" }));

    expect(result.map((item) => item.id)).toEqual(["1", "2", "3"]);
    expect(result[1].messageText).toBe("sửa");
  });

  it("sắp xếp lại theo thời gian khi tin tới muộn", () => {
    const existing = [message({ id: "2", createdAt: "2026-09-26T11:00:00+07:00" })];
    const result = upsertChatMessage(existing, message({ id: "1", createdAt: "2026-09-26T09:00:00+07:00" }));

    expect(result.map((item) => item.id)).toEqual(["1", "2"]);
  });

  it("trả về bản sao khi danh sách rỗng", () => {
    const result = upsertChatMessage([], message({ id: "9" }));

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("9");
  });
});
