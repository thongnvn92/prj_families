import type { ChatGroup, ChatGroupType, ChatMemberRole, ChatMessage, CreateChatGroupInput } from "../types/chat";

type ChatUserRole = "admin" | "mod" | "editor" | "member" | "guest";

export interface ChatGroupApiRecord {
  id: number;
  family_id: number;
  name: string;
  type: ChatGroupType;
  member_count?: number | null;
  last_message?: string | null;
  unread_count?: number | null;
  avatar_url?: string | null;
  creator_role?: ChatUserRole | null;
}

export interface ChatMessageApiRecord {
  id: number;
  group_id: number;
  sender_id: number;
  sender_name?: string | null;
  sender_avatar?: string | null;
  sender_role?: ChatUserRole | null;
  message_text?: string | null;
  image_url?: string | null;
  created_at?: string | null;
}

export interface ChatGroupListResponse { data?: ChatGroupApiRecord[] }
export interface ChatMessageListResponse { data?: ChatMessageApiRecord[]; meta?: { current_page?: number; last_page?: number | null; total?: number } }
export interface ChatGroupResponse { data?: ChatGroupApiRecord }
export interface ChatMessageResponse { data?: ChatMessageApiRecord }

const groupTypes: ChatGroupType[] = ["all", "branch", "custom"];

// Backend trả role tài khoản (admin/mod/...) còn UI hiển thị nhãn chức vụ dòng họ.
const memberRoleLabels: Record<ChatUserRole, ChatMemberRole> = {
  admin: "Trưởng Tộc",
  mod: "Trưởng Chi",
  editor: "Trưởng Chi",
  member: "Thành Viên",
  guest: "Khách",
};

function toGroupType(value: unknown): ChatGroupType {
  return typeof value === "string" && (groupTypes as string[]).includes(value) ? (value as ChatGroupType) : "custom";
}

function toMemberRole(value: unknown): ChatMemberRole {
  return typeof value === "string" && value in memberRoleLabels ? memberRoleLabels[value as ChatUserRole] : "Thành Viên";
}

export function chatGroupFromApi(record: ChatGroupApiRecord): ChatGroup {
  return {
    id: String(record.id),
    familyId: String(record.family_id),
    name: record.name?.trim() || "Nhóm chat",
    type: toGroupType(record.type),
    memberCount: record.member_count ?? 0,
    lastMessage: record.last_message?.trim() || "Chưa có tin nhắn nào.",
    avatarUrl: record.avatar_url ?? "",
    unreadCount: record.unread_count ?? 0,
    creatorRole: toMemberRole(record.creator_role),
  };
}

export function chatMessageFromApi(record: ChatMessageApiRecord): ChatMessage {
  const senderName = record.sender_name?.trim() || "Thành viên dòng họ";
  return {
    id: String(record.id),
    groupId: String(record.group_id),
    senderId: String(record.sender_id),
    senderName,
    // sender_avatar là URL ảnh; UI chỉ hiện chữ cái đầu khi không có URL.
    senderAvatar: record.sender_avatar?.trim() || senderName.slice(-2).toUpperCase(),
    senderRole: toMemberRole(record.sender_role),
    messageText: record.message_text?.trim() ?? "",
    imageUrl: record.image_url?.trim() || null,
    createdAt: record.created_at ?? new Date(0).toISOString(),
  };
}

// Backend phân trang nên response có { data, meta, links }; mapper chỉ lấy data.
export function chatGroupListFromApi(response: ChatGroupListResponse): ChatGroup[] {
  return (response.data ?? []).map(chatGroupFromApi);
}

/**
 * Payload broadcast của App\Events\MessageSent: `broadcastWith()` trả về
 * `{ message: {...} }` và BroadcastEvent ghi thêm khoá `socket`.
 */
export interface MessageSentBroadcastEvent {
  message?: ChatMessageApiRecord;
  socket?: string | null;
}

/** Bản ghi trong `broadcastWith()` dùng chung shape với REST nên tái dùng mapper. */
export function chatMessageFromBroadcast(event: MessageSentBroadcastEvent): ChatMessage | null {
  return event?.message ? chatMessageFromApi(event.message) : null;
}

export function chatMessageListFromApi(response: ChatMessageListResponse): ChatMessage[] {
  return (response.data ?? []).map(chatMessageFromApi).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

/**
 * Chèn (hoặc làm mới) một tin nhắn realtime vào danh sách đã tải.
 * Bỏ qua id trùng vì cùng một tin có thể tới cả từ HTTP response lẫn từ WebSocket.
 */
export function upsertChatMessage(messages: ChatMessage[], message: ChatMessage): ChatMessage[] {
  const index = messages.findIndex((item) => item.id === message.id);
  if (index === -1) return [...messages, message].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const next = messages.slice();
  next[index] = { ...next[index], ...message };
  return next;
}

export function chatMessageFormData(text: string, image: File | null): FormData {
  const form = new FormData();
  const trimmed = text.trim();
  // Gửi cả khi rỗng để backend kiểm tra "nội dung hoặc ảnh" một chỗ.
  form.append("message_text", trimmed);
  if (image) form.append("image", image);
  return form;
}

export function chatGroupPayload(input: CreateChatGroupInput): Record<string, unknown> {
  return {
    name: input.name.trim(),
    type: input.type,
    member_ids: input.memberIds.map((id) => Number(id)).filter((id) => Number.isInteger(id) && id > 0),
  };
}
