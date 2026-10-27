export type PendingEditType = "add_child" | "add_spouse" | "update_info";
export type PendingEditStatus = "pending" | "approved" | "rejected";
export type RequesterRole = "Admin" | "Mod" | "Editor" | "Member";

export interface PendingEdit {
  id: string;
  requesterName: string;
  requesterRole: RequesterRole;
  targetMemberId: string;
  targetMemberName: string;
  editType: PendingEditType;
  proposedData: Record<string, any>;
  currentData?: Record<string, any>;
  status: PendingEditStatus;
  rejectReason?: string;
  createdAt: string;
}
