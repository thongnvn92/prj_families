import type { FamilySettings, ImageUploadRole, UpdateFamilySettingsInput } from "../types/familySettings";

export interface FamilySettingApiRecord {
  family_id: number | null;
  /** Để optional vì backend có thể không trả field; mapper mặc định bật chat để không khoá nhầm. */
  chat_enabled?: boolean | null;
  image_upload_roles?: string[] | null;
  updated_at?: string | null;
}

export interface FamilySettingResponse { data?: FamilySettingApiRecord; message?: string }
export interface FamilySettingRoleApiRecord { value: ImageUploadRole; label: string }

const uploadRoles: ImageUploadRole[] = ["admin", "mod", "editor", "member"];

function toUploadRoles(value: unknown): ImageUploadRole[] {
  if (!Array.isArray(value)) return [];
  // Backend là nguồn quyết định nên mapper chỉ lọc bỏ giá trị lạ thay vì tự suy diễn.
  return value.filter((role): role is ImageUploadRole => (uploadRoles as string[]).includes(String(role)));
}

export function familySettingsFromApi(record: FamilySettingApiRecord): FamilySettings {
  return {
    familyId: record.family_id != null ? String(record.family_id) : null,
    // Mặc định bật khi backend không trả về để không vô tình khoá chat do dữ liệu thiếu.
    chatEnabled: record.chat_enabled !== false,
    imageUploadRoles: toUploadRoles(record.image_upload_roles),
    updatedAt: record.updated_at ?? null,
  };
}

export function familySettingsRolesFromApi(records: FamilySettingRoleApiRecord[]): FamilySettingRoleApiRecord[] {
  return records.filter((record) => uploadRoles.includes(record.value));
}

export function familySettingsPayload(input: UpdateFamilySettingsInput): Record<string, unknown> {
  return {
    chat_enabled: input.chatEnabled,
    image_upload_roles: Array.from(new Set(input.imageUploadRoles)),
  };
}
