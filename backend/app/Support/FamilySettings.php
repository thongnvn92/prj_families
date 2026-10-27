<?php

namespace App\Support;

use App\Enums\UserRole;
use App\Models\Family;
use App\Models\FamilySetting;
use App\Models\User;

/**
 * Nguồn quyết định duy nhất cho hai công tắc do Admin (Trưởng Tộc) điều khiển:
 * bật/tắt Trò chuyện nội bộ và quyền đưa hình ảnh lên hệ thống.
 *
 * Mọi endpoint phải gọi qua đây; UI chỉ dùng để hiển thị, không phải security boundary.
 */
class FamilySettings
{
    /**
     * Mặc định giữ nguyên hành vi trước khi có tính năng cấu hình:
     * chat bật, chỉ admin/mod/editor được tải ảnh lên Album.
     */
    public const DEFAULT_IMAGE_UPLOAD_ROLES = [UserRole::Admin, UserRole::Mod, UserRole::Editor];

    /** Danh sách role hợp lệ trong cấu hình (guest không bao giờ được upload ảnh). */
    public const CONFIGURABLE_UPLOAD_ROLES = [UserRole::Admin, UserRole::Mod, UserRole::Editor, UserRole::Member];

    /**
     * Lấy cấu hình của dòng họ. Dòng họ chưa có bản ghi thì trả về cấu hình mặc định
     * (không ghi DB) để các endpoint chỉ đọc không sinh side-effect.
     */
    public static function forFamily(?int $familyId): FamilySetting
    {
        if ($familyId === null) {
            return self::defaults(null);
        }

        $setting = FamilySetting::query()->where('family_id', $familyId)->first();
        if (! $setting) {
            return self::defaults($familyId);
        }

        $setting->image_upload_roles ??= array_map(
            static fn (UserRole $role): string => $role->value,
            self::DEFAULT_IMAGE_UPLOAD_ROLES,
        );

        return $setting;
    }

    /**
     * Cấu hình theo tài khoản. Admin có thể chưa gán family_id nên fallback về
     * dòng họ đầu tiên cho khớp với FamilyScope::publicFamilyId().
     */
    public static function forUser(User $user): FamilySetting
    {
        return self::forFamily($user->family_id ?? Family::query()->orderBy('id')->value('id'));
    }

    public static function isChatEnabled(User $user): bool
    {
        return self::forUser($user)->chat_enabled !== false;
    }

    public static function canUploadImages(User $user): bool
    {
        if ($user->role === UserRole::Guest) {
            return false;
        }

        return self::forUser($user)->allowsImageUpload($user->role);
    }

    /** Chặn mọi thao tác chat (HTTP và WebSocket) khi Admin đã tắt tính năng. */
    public static function assertChatEnabled(User $user): void
    {
        abort_if(
            ! self::isChatEnabled($user),
            403,
            'Tính năng Trò chuyện nội bộ đang tạm khóa. Vui lòng liên hệ Ban quản trị dòng họ.',
        );
    }

    /** Chặn upload ảnh khi vai trò của tài khoản không nằm trong danh sách Admin chọn. */
    public static function assertCanUploadImages(User $user): void
    {
        abort_if(
            ! self::canUploadImages($user),
            403,
            'Ban quản trị dòng họ chưa cho phép vai trò của bạn đưa hình ảnh lên hệ thống.',
        );
    }

    /** Ghi cấu hình, tạo bản ghi nếu dòng họ chưa có. */
    public static function update(int $familyId, bool $chatEnabled, array $uploadRoles, ?int $updatedBy): FamilySetting
    {
        return FamilySetting::query()->updateOrCreate(
            ['family_id' => $familyId],
            [
                'chat_enabled' => $chatEnabled,
                'image_upload_roles' => $uploadRoles,
                'updated_by' => $updatedBy,
            ],
        );
    }

    private static function defaults(?int $familyId): FamilySetting
    {
        $setting = new FamilySetting;
        $setting->family_id = $familyId;
        $setting->chat_enabled = true;
        $setting->image_upload_roles = array_map(
            static fn (UserRole $role): string => $role->value,
            self::DEFAULT_IMAGE_UPLOAD_ROLES,
        );

        return $setting;
    }
}
