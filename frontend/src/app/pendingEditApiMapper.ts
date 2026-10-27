import type { AppRole } from "../context/AuthContext";
import type { PendingEdit, PendingEditStatus, PendingEditType, RequesterRole } from "../types/pendingEdit";

export interface PendingEditApiRecord {
  id: number;
  requester_id: number;
  requester_name?: string | null;
  requester_role?: string | null;
  edit_type: PendingEditType;
  target_member_id: number;
  target_member_name?: string | null;
  proposed_data?: Record<string, unknown> | null;
  current_data?: Record<string, unknown> | null;
  status: PendingEditStatus;
  reject_reason?: string | null;
  reviewer_id?: number | null;
  created_at: string | null;
}

export interface PendingEditListResponse {
  data: PendingEditApiRecord[];
}

export interface PendingEditResponse {
  data?: PendingEditApiRecord;
  message?: string;
}

export interface CreatePendingEditPayload {
  editType: PendingEditType;
  targetMemberId: number;
  proposedData: Record<string, unknown>;
}

export type CreatePendingEditInput = CreatePendingEditPayload;

const requesterRoleLabels: Record<RequesterRole, string> = { Admin: "Admin", Mod: "Mod", Editor: "Editor", Member: "Member" };

function toRequesterRole(value: unknown): RequesterRole {
  if (typeof value !== "string") return "Member";
  const key = (value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()) as RequesterRole;
  return key in requesterRoleLabels ? key : "Member";
}

export function pendingEditFromApi(record: PendingEditApiRecord): PendingEdit {
  const currentData = record.current_data ?? undefined;
  return {
    id: String(record.id),
    requesterName: record.requester_name?.trim() || "Thành viên dòng họ",
    requesterRole: toRequesterRole(record.requester_role),
    targetMemberId: String(record.target_member_id),
    targetMemberName: record.target_member_name?.trim() || "Thành viên",
    editType: record.edit_type,
    proposedData: record.proposed_data ?? {},
    currentData,
    status: record.status,
    rejectReason: record.reject_reason ?? undefined,
    createdAt: record.created_at ?? new Date(0).toISOString(),
  };
}

export function pendingEditListFromApi(response: PendingEditListResponse): PendingEdit[] {
  return (response.data ?? []).map(pendingEditFromApi);
}

export function pendingEditPayload(payload: CreatePendingEditPayload): Record<string, unknown> {
  return {
    edit_type: payload.editType,
    target_member_id: payload.targetMemberId,
    proposed_data: payload.proposedData,
  };
}