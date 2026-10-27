<?php

use App\Http\Controllers\Api\V1\AiController;
use App\Http\Controllers\Api\V1\AlbumController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\CalendarController;
use App\Http\Controllers\Api\V1\ChatController;
use App\Http\Controllers\Api\V1\FamilySettingController;
use App\Http\Controllers\Api\V1\MemberController;
use App\Http\Controllers\Api\V1\PendingEditController;
use App\Http\Controllers\Api\V1\PrayerController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function (): void {
    Route::post('auth/register', [AuthController::class, 'register'])->middleware('throttle:10,1');
    Route::post('auth/login', [AuthController::class, 'login'])->middleware('throttle:10,1');
    // Khách ngoài dòng họ chỉ được đọc cây gia phả (GET /members) và cấu hình tính năng
    // (GET /family-settings) — đủ để giao diện công khai dựng cây và biết chat có bật hay không.
    // Album ảnh dòng họ là dữ liệu nội bộ nên nằm dưới auth:api + role bên dưới.
    Route::middleware('auth.optional')->group(function (): void {
        Route::get('members', [MemberController::class, 'index']);
        Route::get('members/{member}', [MemberController::class, 'show']);
        // Cấu hình tính năng: khách cũng đọc được để UI biết chat đang bật/tắt.
        Route::get('family-settings', [FamilySettingController::class, 'show']);
    });

    Route::middleware('auth:api')->group(function (): void {
        Route::get('auth/profile', [AuthController::class, 'profile']);
        Route::get('auth/me', [AuthController::class, 'profile']);
        Route::patch('auth/profile', [AuthController::class, 'updateProfile']);
        Route::post('auth/logout', [AuthController::class, 'logout']);

        Route::middleware('role:admin,mod,editor')->group(function (): void {
            Route::post('members', [MemberController::class, 'store']);
            Route::put('members/{member}', [MemberController::class, 'update']);
            Route::post('calendar/events', [CalendarController::class, 'store']);
            Route::delete('calendar/events/{event}', [CalendarController::class, 'destroy']);
            Route::delete('album/{photo}', [AlbumController::class, 'destroy']);
        });

        // Upload ảnh: role gốc do Admin cấu hình (mặc định admin/mod/editor), middleware
        // image.upload là nguồn quyết định cuối cùng nên route mở cho cả member.
        Route::middleware(['role:admin,mod,editor,member', 'image.upload'])->group(function (): void {
            Route::post('album', [AlbumController::class, 'store']);
        });

        // Chat bị khoá hoàn toàn khi Admin tắt "Trò chuyện nội bộ".
        Route::middleware(['role:admin,mod', 'chat.enabled'])->group(function (): void {
            Route::post('chat/groups', [ChatController::class, 'store']);
        });

        Route::middleware('role:admin,mod')->group(function (): void {
            Route::delete('members/{member}', [MemberController::class, 'destroy']);
            Route::get('pending-edits', [PendingEditController::class, 'index']);
            Route::post('pending-edits/{edit}/approve', [PendingEditController::class, 'approve']);
            Route::post('pending-edits/{edit}/reject', [PendingEditController::class, 'reject']);
        });

        Route::middleware('role:admin')->group(function (): void {
            Route::post('prayers', [PrayerController::class, 'store']);
            Route::put('prayers/{prayer}', [PrayerController::class, 'update']);
            Route::delete('prayers/{prayer}', [PrayerController::class, 'destroy']);
            // Cấu hình tính năng dòng họ: bật/tắt chat, quyền đưa hình ảnh lên hệ thống.
            Route::get('family-settings/roles', [FamilySettingController::class, 'roles']);
            Route::put('family-settings', [FamilySettingController::class, 'update']);
        });

        Route::middleware('role:member,editor,mod,admin')->group(function (): void {
            // Album ảnh dòng họ là dữ liệu nội bộ: khách ngoài dòng họ bị chặn hoàn toàn,
            // kể cả ảnh có visibility=public.
            Route::get('album', [AlbumController::class, 'index']);
            Route::get('album/{photo}', [AlbumController::class, 'show']);
            Route::get('calendar/events', [CalendarController::class, 'index']);
            Route::get('calendar/lunar-month', [CalendarController::class, 'lunarMonth']);
            Route::post('calendar/events/{event}/register-duty', [CalendarController::class, 'registerDuty']);
            Route::post('pending-edits', [PendingEditController::class, 'store']);
            Route::get('prayers', [PrayerController::class, 'index']);
            Route::get('prayers/{prayer}', [PrayerController::class, 'show']);
            // Trợ lý AI Gia tộc: chỉ thành viên dòng họ, Guest bị chặn 403.
            Route::post('ai/chat', [AiController::class, 'chat'])->middleware('throttle:30,1');
            Route::get('ai/suggestions', [AiController::class, 'suggestions']);
            Route::get('ai/status', [AiController::class, 'status']);
        });

        // Chat: read/write group + messages. Gửi ảnh trong tin nhắn còn bị image.upload chặn.
        Route::middleware(['role:member,editor,mod,admin', 'chat.enabled'])->group(function (): void {
            Route::get('chat/groups', [ChatController::class, 'index']);
            Route::get('chat/groups/{group}/messages', [ChatController::class, 'messages']);
            Route::post('chat/groups/{group}/messages', [ChatController::class, 'sendMessage']);
        });
    });
});
