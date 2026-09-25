import type { ChatGroup, ChatGroupType, ChatMessage } from "../types/chat";
import { hasRolePermission, type AppRole } from "../context/AuthContext";

const MOCK_LATENCY = 200;
const MAX_IMAGE_BASE64_BYTES = 10 * 1024 * 1024;
const familyId = "nguyen-chi-3";

const groups: ChatGroup[] = [
  { id: "all-family", familyId, name: "Toàn Dòng Họ", type: "all", memberCount: 23, lastMessage: "Nhóm đã sẵn sàng cho mùa giỗ sắp tới.", avatarUrl: "", unreadCount: 3, creatorRole: "Trưởng Tộc" },
  { id: "chi-2", familyId, name: "Nhánh Chi 2", type: "branch", memberCount: 8, lastMessage: "Anh Tuấn đã gửi ảnh gia đình.", avatarUrl: "", unreadCount: 1, creatorRole: "Trưởng Chi" },
  { id: "council", familyId, name: "Ban Quản Trị / Hội Đồng Dòng Họ", type: "custom", memberCount: 5, lastMessage: "Lịch họp tháng đã được cập nhật.", avatarUrl: "", unreadCount: 0, creatorRole: "Trưởng Tộc" },
];

const messages: ChatMessage[] = [
  { id: "msg-001", groupId: "all-family", senderId: "duc", senderName: "Nguyễn Văn Đức", senderAvatar: "NĐ", senderRole: "Trưởng Tộc", messageText: "Kính gửi các anh chị em trong toàn dòng họ, Ban quản trị xin thông báo lịch họp trước ngày giỗ cụ Nguyễn Văn Thành.", imageBase64: null, createdAt: "2026-09-24T07:30:00.000Z" },
  { id: "msg-002", groupId: "all-family", senderId: "hien", senderName: "Nguyễn Văn Hiền", senderAvatar: "NH", senderRole: "Trưởng Chi", messageText: "Cháu đã chuẩn bị lư hương, hoa quả và rượu trà theo phần việc đã phân công ạ.", imageBase64: null, createdAt: "2026-09-24T07:42:00.000Z" },
  { id: "msg-003", groupId: "all-family", senderId: "mai", senderName: "Nguyễn Thị Mai", senderAvatar: "NM", senderRole: "Thành Viên", messageText: "Nhánh Bắc Ninh xin xác nhận có thể hỗ trợ số lượng người tham dự.", imageBase64: null, createdAt: "2026-09-24T08:05:00.000Z" },
  { id: "msg-004", groupId: "all-family", senderId: "an", senderName: "Nguyễn Văn An", senderAvatar: "NA", senderRole: "Trưởng Tộc", messageText: "Cảm ơn anh chị em. Ban quản trị sẽ gửi bảng tổng hợp trước 17h chiều nay.", imageBase64: null, createdAt: "2026-09-24T08:12:00.000Z" },
  { id: "msg-005", groupId: "chi-2", senderId: "tuan", senderName: "Nguyễn Văn Tuấn", senderAvatar: "NT", senderRole: "Trưởng Chi", messageText: "Tôi gửi ảnh một số thành viên nhánh Chi 2 qua nhóm này ạ.", imageBase64: null, createdAt: "2026-09-23T10:15:00.000Z" },
  { id: "msg-006", groupId: "council", senderId: "duc", senderName: "Nguyễn Văn Đức", senderAvatar: "NĐ", senderRole: "Trưởng Tộc", messageText: "Lịch họp ban quản trị được giữ vào 9 giờ sáng thứ Bảy tuần sau.", imageBase64: null, createdAt: "2026-09-22T02:00:00.000Z" },
];

function delay<T>(operation: () => T): Promise<T> { return new Promise((resolve, reject) => setTimeout(() => { try { resolve(operation()); } catch (error) { reject(error); } }, MOCK_LATENCY)); }
function clone<T>(value: T): T { return structuredClone(value); }
function getBase64Bytes(value: string): number { const base64 = value.includes(",") ? value.slice(value.indexOf(",") + 1) : value; return Math.ceil((base64.length * 3) / 4); }

export async function getChatGroups(role: AppRole): Promise<ChatGroup[]> { if (!hasRolePermission(role, "canViewGroupChat")) throw new Error("Bạn không có quyền xem nhóm trò chuyện."); return delay(() => groups.map(clone)); }
export async function getGroupMessages(groupId: string, role: AppRole): Promise<ChatMessage[]> { if (!hasRolePermission(role, "canViewGroupChat")) throw new Error("Bạn không có quyền xem lịch sử trò chuyện."); return delay(() => messages.filter((message) => message.groupId === groupId).sort((a, b) => a.createdAt.localeCompare(b.createdAt)).map(clone)); }
export async function sendMessage(groupId: string, text: string, imageBase64: string | null | undefined, role: AppRole): Promise<ChatMessage> { if (!hasRolePermission(role, "canViewGroupChat")) throw new Error("Bạn không có quyền gửi tin nhắn."); return delay(() => { const group = groups.find((item) => item.id === groupId); if (!group) throw new Error("Không tìm thấy nhóm trò chuyện."); const trimmedText = text.trim(); if (!trimmedText && !imageBase64) throw new Error("Vui lòng nhập nội dung hoặc chọn ảnh."); if (imageBase64 && getBase64Bytes(imageBase64) >= MAX_IMAGE_BASE64_BYTES) throw new Error("Ảnh sau khi nén phải nhỏ hơn 10MB."); const message: ChatMessage = { id: `msg-${Date.now()}`, groupId, senderId: "nguyen-an", senderName: "Nguyễn Văn An", senderAvatar: "NA", senderRole: "Trưởng Tộc", messageText: trimmedText, imageBase64: imageBase64 ?? null, createdAt: new Date().toISOString() }; messages.push(message); group.lastMessage = trimmedText || "Đã gửi một hình ảnh."; return clone(message); }); }
export async function createChatGroup(name: string, type: ChatGroupType, memberCount: number, role: AppRole): Promise<ChatGroup> { if (!hasRolePermission(role, "canCreateChatGroup")) throw new Error("Bạn không có quyền tạo nhóm trò chuyện."); return delay(() => { const group: ChatGroup = { id: `group-${Date.now()}`, familyId, name: name.trim(), type, memberCount, lastMessage: "Nhóm chat vừa được tạo.", avatarUrl: "", unreadCount: 0, creatorRole: "Trưởng Tộc" }; if (!group.name) throw new Error("Vui lòng nhập tên nhóm."); groups.unshift(group); return clone(group); }); }
