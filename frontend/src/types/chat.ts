export type ChatGroupType = "all" | "branch" | "custom";
export type ChatMemberRole = "Trưởng Tộc" | "Trưởng Chi" | "Thành Viên" | "Khách";

export interface ChatGroup {
  id: string;
  familyId: string;
  name: string;
  type: ChatGroupType;
  memberCount: number;
  lastMessage: string;
  avatarUrl?: string;
  unreadCount?: number;
  creatorRole?: ChatMemberRole;
}

export interface ChatMessage {
  id: string;
  groupId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  senderRole: ChatMemberRole;
  messageText: string;
  /** Backend lưu ảnh trên disk và trả URL; chỉ dùng để hiển thị lại. */
  imageUrl?: string | null;
  createdAt: string;
}

export interface CreateChatGroupInput {
  name: string;
  type: ChatGroupType;
  /** Danh sách id của bảng members; backend resolve sang tài khoản qua users.member_id. */
  memberIds: string[];
}

