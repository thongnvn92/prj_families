import type { PendingEdit } from "../types/pendingEdit";
import { hasRolePermission, type AppRole } from "../context/AuthContext";

const MOCK_LATENCY = 200;
const edits: PendingEdit[] = [
  {
    id: "PE-2026-051", requesterName: "Nguyễn Văn B", requesterRole: "Member", targetMemberId: "van-thanh", targetMemberName: "Nguyễn Văn Thành", editType: "add_child", status: "pending", createdAt: "2026-09-24T08:15:00.000Z",
    currentData: { children: "Nguyễn Văn Hiền, Nguyễn Thị Thảo", childCount: 2 },
    proposedData: { children: "Nguyễn Văn Hiền, Nguyễn Thị Thảo, Nguyễn Văn Khoa", childCount: 3, newMemberName: "Nguyễn Văn Khoa", newMemberBirthYear: 1952 },
  },
  {
    id: "PE-2026-050", requesterName: "Nguyễn Thị Mai", requesterRole: "Mod", targetMemberId: "bao", targetMemberName: "Nguyễn Gia Bảo", editType: "update_info", status: "pending", createdAt: "2026-09-23T14:30:00.000Z",
    currentData: { phone: "091 080 1980", address: "Bắc Ninh", role: "Cháu nội" },
    proposedData: { phone: "091 280 1980", address: "Khu di tích Bắc Ninh, đường Nguyễn Trãi", role: "Trưởng chi thế hệ 4" },
  },
  {
    id: "PE-2026-049", requesterName: "Nguyễn Gia Nhi", requesterRole: "Member", targetMemberId: "ngoc", targetMemberName: "Nguyễn Gia Ngọc", editType: "add_spouse", status: "pending", createdAt: "2026-09-22T10:05:00.000Z",
    currentData: { spouse: "Chưa cập nhật", maritalStatus: "Độc thân" },
    proposedData: { spouse: "Nguyễn Gia Long", relationship: "Chồng tương lai", note: "Đề xuất bổ sung sau lễ cầu hôn gia đình" },
  },
  {
    id: "PE-2026-045", requesterName: "Nguyễn Văn Hiền", requesterRole: "Editor", targetMemberId: "huyen", targetMemberName: "Nguyễn Thị Huyền", editType: "update_info", status: "approved", createdAt: "2026-09-18T09:20:00.000Z",
    currentData: { phone: "091 720 1975", address: "Hoàng Kiếm, Hà Nội" }, proposedData: { phone: "091 720 1975", address: "Long Biên, Hà Nội" },
  },
  {
    id: "PE-2026-041", requesterName: "Nguyễn Văn Tuấn", requesterRole: "Mod", targetMemberId: "minh", targetMemberName: "Nguyễn Văn Minh", editType: "update_info", status: "rejected", rejectReason: "Tài liệu chưa đủ căn cứ xác nhận năm mất.", createdAt: "2026-09-15T16:40:00.000Z",
    currentData: { deathYear: 1974, burialPlace: "Khu di tích gia tộc, Bắc Ninh" }, proposedData: { deathYear: 1975, burialPlace: "Nghĩa trang huyện Yên Đồng" },
  },
];

function delay<T>(operation: () => T): Promise<T> {
  return new Promise((resolve, reject) => setTimeout(() => { try { resolve(operation()); } catch (error) { reject(error); } }, MOCK_LATENCY));
}

function clone(edit: PendingEdit): PendingEdit {
  return { ...edit, proposedData: structuredClone(edit.proposedData), currentData: edit.currentData ? structuredClone(edit.currentData) : undefined };
}

export async function getPendingEdits(role: AppRole): Promise<PendingEdit[]> {
  if (!hasRolePermission(role, "canManagePendingEdits")) throw new Error("Bạn không có quyền xem đề xuất cập nhật.");
  return delay(() => [...edits].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(clone));
}

export async function createPendingEdit(data: Omit<PendingEdit, "id" | "status" | "createdAt">, role: AppRole): Promise<PendingEdit> {
  if (!hasRolePermission(role, "canSuggestEdits")) throw new Error("Bạn không có quyền gửi đề xuất cập nhật.");
  return delay(() => {
    const edit: PendingEdit = { ...data, id: `PE-${new Date().getFullYear()}-${String(edits.length + 1).padStart(3, "0")}`, status: "pending", createdAt: new Date().toISOString() };
    edits.unshift(edit);
    return clone(edit);
  });
}

export async function approveEdit(id: string, role: AppRole): Promise<PendingEdit> {
  if (!hasRolePermission(role, "canApproveEdits")) throw new Error("Bạn không có quyền duyệt đề xuất.");
  return delay(() => {
    const index = edits.findIndex((edit) => edit.id === id);
    if (index < 0) throw new Error("Không tìm thấy đề xuất cần duyệt.");
    const current = edits[index];
    if (current.status !== "pending") throw new Error("Đề xuất này đã được xử lý.");
    edits[index] = { ...current, status: "approved", rejectReason: undefined };
    return clone(edits[index]);
  });
}

export async function rejectEdit(id: string, reason: string, role: AppRole): Promise<PendingEdit> {
  if (!hasRolePermission(role, "canApproveEdits")) throw new Error("Bạn không có quyền từ chối đề xuất.");
  const normalizedReason = reason.trim();
  if (!normalizedReason) return Promise.reject(new Error("Vui lòng nhập lý do từ chối."));
  return delay(() => {
    const index = edits.findIndex((edit) => edit.id === id);
    if (index < 0) throw new Error("Không tìm thấy đề xuất cần từ chối.");
    const current = edits[index];
    if (current.status !== "pending") throw new Error("Đề xuất này đã được xử lý.");
    edits[index] = { ...current, status: "rejected", rejectReason: normalizedReason };
    return clone(edits[index]);
  });
}
