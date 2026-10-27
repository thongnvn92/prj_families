/** Vai trò được Admin cho phép đưa hình ảnh lên hệ thống. */
export type ImageUploadRole = "admin" | "mod" | "editor" | "member";

export interface FamilySettings {
  familyId: string | null;
  /** Admin bật/tắt Trò chuyện nội bộ. */
  chatEnabled: boolean;
  imageUploadRoles: ImageUploadRole[];
  updatedAt: string | null;
}

export interface UpdateFamilySettingsInput {
  chatEnabled: boolean;
  imageUploadRoles: ImageUploadRole[];
}
