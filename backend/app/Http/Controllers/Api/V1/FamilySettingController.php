<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Resources\FamilySettingResource;
use App\Models\Family;
use App\Support\FamilySettings;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * Cấu hình tính năng do Admin (Trưởng Tộc) điều khiển:
 * bật/tắt Trò chuyện nội bộ và chọn vai trò được đưa hình ảnh lên hệ thống.
 */
class FamilySettingController extends Controller
{
    /**
     * Mọi tài khoản đã xác thực đều đọc được để frontend ẩn/hiện mục chat và nút tải ảnh.
     * Route này đặt trong nhóm auth.optional để khách cũng biết chat có đang mở hay không
     * mà không cần token.
     */
    public function show(Request $request): JsonResponse
    {
        $user = $request->user();
        $familyId = $user?->family_id ?? Family::query()->orderBy('id')->value('id');

        return response()->json(['data' => new FamilySettingResource(FamilySettings::forFamily($familyId))]);
    }

    public function update(Request $request): JsonResponse
    {
        $user = $request->user();
        $data = $request->validate([
            'chat_enabled' => ['required', 'boolean'],
            'image_upload_roles' => ['required', 'array', 'min:1'],
            'image_upload_roles.*' => ['string', Rule::in(array_map(
                static fn (UserRole $role): string => $role->value,
                FamilySettings::CONFIGURABLE_UPLOAD_ROLES,
            ))],
            'family_id' => ['nullable', 'integer', 'exists:families,id'],
        ]);

        // Admin có thể không được gán family_id; mặc định lấy dòng họ đầu tiên.
        $familyId = $request->filled('family_id')
            ? $request->integer('family_id')
            : ($user->family_id ?? Family::query()->orderBy('id')->value('id'));
        abort_if(! $familyId, 422, 'Chưa có dòng họ để áp dụng cấu hình.');

        $roles = array_values(array_unique($data['image_upload_roles']));
        $setting = FamilySettings::update($familyId, (bool) $data['chat_enabled'], $roles, $user->id);

        return response()->json([
            'data' => new FamilySettingResource($setting),
            'message' => 'Đã cập nhật cấu hình dòng họ.',
        ]);
    }

    /** Danh sách role hợp lệ để frontend render lựa chọn mà không hard-code lệch với server. */
    public function roles(): JsonResponse
    {
        return response()->json([
            'data' => array_map(static fn (UserRole $role): array => [
                'value' => $role->value,
                'label' => match ($role) {
                    UserRole::Admin => 'Admin (Trưởng Tộc)',
                    UserRole::Mod => 'Mod (Trưởng Chi)',
                    UserRole::Editor => 'Editor (Tác viên)',
                    UserRole::Member => 'Member (Thành viên)',
                    UserRole::Guest => 'Guest (Khách)',
                },
            ], FamilySettings::CONFIGURABLE_UPLOAD_ROLES),
        ]);
    }
}
