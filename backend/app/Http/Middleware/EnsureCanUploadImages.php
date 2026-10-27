<?php

namespace App\Http\Middleware;

use App\Support\FamilySettings;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Chặn mọi thao tác đưa hình ảnh lên hệ thống (Album gia đình và ảnh trong tin nhắn chat)
 * khi vai trò của tài khoản không nằm trong danh sách Admin đã cấu hình.
 */
class EnsureCanUploadImages
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        abort_if($user === null, 401, 'Bạn cần đăng nhập để thực hiện thao tác này.');

        FamilySettings::assertCanUploadImages($user);

        return $next($request);
    }
}
