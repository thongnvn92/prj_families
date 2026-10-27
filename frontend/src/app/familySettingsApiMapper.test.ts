import { describe, expect, it } from "vitest";
import { familySettingsFromApi, familySettingsPayload, familySettingsRolesFromApi, type FamilySettingApiRecord } from "./familySettingsApiMapper";
import type { ImageUploadRole } from "../types/familySettings";

const record = (overrides: Partial<FamilySettingApiRecord> = {}): FamilySettingApiRecord => ({
  family_id: 1,
  chat_enabled: true,
  image_upload_roles: ["admin", "mod", "editor"],
  updated_at: "2026-09-30T09:00:00+07:00",
  ...overrides,
});

describe("familySettingsApiMapper – chuyển dữ liệu API sang domain", () => {
  it("map cấu hình snake_case sang FamilySettings", () => {
    const result = familySettingsFromApi(record());

    expect(result.familyId).toBe("1");
    expect(result.chatEnabled).toBe(true);
    expect(result.imageUploadRoles).toEqual(["admin", "mod", "editor"]);
    expect(result.updatedAt).toBe("2026-09-30T09:00:00+07:00");
  });

  it("giữ nguyên trạng thái chat bị tắt", () => {
    expect(familySettingsFromApi(record({ chat_enabled: false })).chatEnabled).toBe(false);
  });

  it("mặc định bật chat khi backend không trả chat_enabled", () => {
    // Không vô tình khoá chat chỉ vì dữ liệu thiếu field.
    expect(familySettingsFromApi({ family_id: 1 }).chatEnabled).toBe(true);
  });

  it("family_id null giữ lại null thay vì chuỗi rỗng", () => {
    expect(familySettingsFromApi(record({ family_id: null })).familyId).toBeNull();
  });

  it("lọc bỏ role lạ do backend trả về", () => {
    const result = familySettingsFromApi(record({ image_upload_roles: ["admin", "root", "guest"] }));

    expect(result.imageUploadRoles).toEqual(["admin"]);
  });

  it("image_upload_roles thiếu thì trả mảng rỗng thay vì undefined", () => {
    expect(familySettingsFromApi({ family_id: 1, chat_enabled: true, image_upload_roles: null }).imageUploadRoles).toEqual([]);
  });
});

describe("familySettingsApiMapper – payload và danh sách role", () => {
  it("payload đổi camelCase sang snake_case", () => {
    const payload = familySettingsPayload({ chatEnabled: false, imageUploadRoles: ["admin", "member"] });

    expect(payload).toEqual({ chat_enabled: false, image_upload_roles: ["admin", "member"] });
  });

  it("payload loại trùng lặp trước khi gửi", () => {
    const payload = familySettingsPayload({ chatEnabled: true, imageUploadRoles: ["admin", "admin", "editor"] });

    expect(payload.image_upload_roles).toEqual(["admin", "editor"]);
  });

  it("lọc danh sách role cấu hình về các role hợp lệ", () => {
    const roles = familySettingsRolesFromApi([
      { value: "admin" as ImageUploadRole, label: "Admin (Trưởng Tộc)" },
      { value: "guest" as ImageUploadRole, label: "Guest (Khách)" },
    ]);

    expect(roles.map((role) => role.value)).toEqual(["admin"]);
  });
});
