<?php

use App\Models\ChatGroup;
use App\Models\User;
use App\Support\FamilySettings;
use Illuminate\Support\Facades\Broadcast;

/*
|--------------------------------------------------------------------------
| Broadcast Channels
|--------------------------------------------------------------------------
|
| Endpoint cấp chữ ký subscribe được đăng ký trong bootstrap/app.php với prefix
| 'api/v1' -> POST /api/v1/broadcasting/auth (middleware auth:api).
|
| Tên channel phải khớp với App\Events\MessageSent::broadcastOn() là
| PrivateChannel('chat-groups.'.$groupId). Frontend (src/lib/echo.ts) subscribe
| private-chat-groups.{groupId} và nghe event 'message.sent'.
|
| Ngoài ra có channel riêng users.{userId} (channel nền) để client luôn mở kết nối
| và cập nhật bộ đếm tin chưa đọc cho các nhóm chưa mở. Tin nhắn phát tới đúng
| channel cá nhân của từng thành viên nên không rò rỉ ra ngoài nhóm.
|
| Chỉ thành viên trong chat_group_members của đúng dòng họ mới được subscribe;
| Admin (Trưởng Tộc) được bypass để khớp với ChatController::assertMember().
|
*/
Broadcast::channel('chat-groups.{chatGroup}', function (User $user, ChatGroup $chatGroup): bool {
    // Cổng chat của nhóm cũng tuân theo công tắc chat_enabled trong family_settings:
    // khi Admin tắt tính năng thì không ai subscribe được nữa.
    if (! FamilySettings::isChatEnabled($user)) {
        return false;
    }

    if ($user->role->value === 'admin') {
        return true;
    }

    return $user->family_id !== null
        && (int) $user->family_id === (int) $chatGroup->family_id
        && $chatGroup->members()->whereKey($user->id)->exists();
});

/*
 * Channel nền riêng cho từng tài khoản: mỗi người chỉ được subscribe chính channel
 * của mình, client dùng để duy trì bộ đếm tin chưa đọc khi đang ở mục khác.
 */
Broadcast::channel('users.{userId}', fn (User $user, int $userId): bool => (int) $user->id === $userId);
