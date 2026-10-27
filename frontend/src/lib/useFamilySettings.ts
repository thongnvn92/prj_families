import { useMemo } from "react";
import { useGetFamilySettingsQuery } from "../app/familySettingsApi";
import { useAuth, type AppRole } from "../context/AuthContext";
import type { ImageUploadRole } from "../types/familySettings";

/**
 * Công tắc do Admin (Trưởng Tộc) điều khiển ở family_settings.
 * Server mới là security boundary; hook này chỉ để UI hiển thị đúng và bỏ nút thao tác.
 * Trong lúc chưa tải được cấu hình thì áp dụng mặc định khớp backend
 * (chat bật, chỉ admin/mod/editor được upload ảnh) để không mở nhầm quyền.
 */
export const DEFAULT_IMAGE_UPLOAD_ROLES: ImageUploadRole[] = ["admin", "mod", "editor"];

export interface FamilySettingsState {
  settings: { chatEnabled: boolean; imageUploadRoles: ImageUploadRole[] };
  chatEnabled: boolean;
  canUploadImages: boolean;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}

export function useFamilySettings(): FamilySettingsState {
  const { currentRole, isInitializing } = useAuth();
  const { data, isLoading, isError, refetch } = useGetFamilySettingsQuery(`settings-${currentRole}`, { skip: isInitializing });
  const settings = useMemo(
    () => ({ chatEnabled: data?.chatEnabled !== false, imageUploadRoles: data?.imageUploadRoles ?? DEFAULT_IMAGE_UPLOAD_ROLES }),
    [data],
  );

  return {
    settings,
    chatEnabled: settings.chatEnabled,
    // Guest không bao giờ được upload ảnh, kể cả khi Admin cấp quyền cho các role khác.
    canUploadImages: currentRole !== "guest" && settings.imageUploadRoles.includes(currentRole as ImageUploadRole),
    isLoading,
    isError,
    refetch: () => {
      void refetch();
    },
  };
}
