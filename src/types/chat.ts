export type ChatGroupType = "all" | "branch" | "custom";
export type ChatMemberRole = "Trưởng Tộc" | "Trưởng Chi" | "Thành Viên";

export interface ChatGroup {
  id: string;
  familyId: string;
  name: string;
  type: ChatGroupType;
  memberCount: number;
  lastMessage: string;
  avatarUrl: string;
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
  imageBase64?: string | null;
  createdAt: string;
}
