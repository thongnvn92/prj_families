<?php

namespace App\Http\Middleware;

use App\Support\FamilySettings;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Chặn toàn bộ API chat khi Admin (Trưởng Tộc) đã tắt "Trò chuyện nội bộ".
 * Middleware này là security boundary; việc ẩn mục chat ở frontend chỉ là UX.
 */
class EnsureChatEnabled
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        abort_if($user === null, 401, 'Bạn cần đăng nhập để thực hiện thao tác này.');

        FamilySettings::assertChatEnabled($user);

        return $next($request);
    }
}
