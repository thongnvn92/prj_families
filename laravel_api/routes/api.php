<?php

use App\Http\Controllers\Api\V1\AlbumController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\CalendarController;
use App\Http\Controllers\Api\V1\ChatController;
use App\Http\Controllers\Api\V1\MemberController;
use App\Http\Controllers\Api\V1\PendingEditController;
use App\Http\Controllers\Api\V1\PrayerController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function (): void {
    Route::post('auth/register', [AuthController::class, 'register'])->middleware('throttle:10,1');
    Route::post('auth/login', [AuthController::class, 'login'])->middleware('throttle:10,1');
    Route::middleware('auth.optional')->group(function (): void {
        Route::get('members', [MemberController::class, 'index']);
        Route::get('members/{member}', [MemberController::class, 'show']);
        Route::get('album', [AlbumController::class, 'index']);
        Route::get('album/{photo}', [AlbumController::class, 'show']);
    });

    Route::middleware('auth:api')->group(function (): void {
        Route::get('auth/profile', [AuthController::class, 'profile']);
        Route::get('auth/me', [AuthController::class, 'profile']);
        Route::patch('auth/profile', [AuthController::class, 'updateProfile']);
        Route::post('auth/logout', [AuthController::class, 'logout']);

        Route::middleware('role:admin,mod,editor')->group(function (): void {
            Route::post('members', [MemberController::class, 'store']);
            Route::put('members/{member}', [MemberController::class, 'update']);
            Route::post('album', [AlbumController::class, 'store']);
            Route::post('calendar/events', [CalendarController::class, 'store']);
            Route::delete('calendar/events/{event}', [CalendarController::class, 'destroy']);
            Route::delete('album/{photo}', [AlbumController::class, 'destroy']);
        });

        Route::middleware('role:admin,mod')->group(function (): void {
            Route::delete('members/{member}', [MemberController::class, 'destroy']);
            Route::post('chat/groups', [ChatController::class, 'store']);
            Route::get('pending-edits', [PendingEditController::class, 'index']);
            Route::post('pending-edits/{edit}/approve', [PendingEditController::class, 'approve']);
            Route::post('pending-edits/{edit}/reject', [PendingEditController::class, 'reject']);
        });

        Route::middleware('role:admin')->group(function (): void {
            Route::post('prayers', [PrayerController::class, 'store']);
            Route::put('prayers/{prayer}', [PrayerController::class, 'update']);
            Route::delete('prayers/{prayer}', [PrayerController::class, 'destroy']);
        });

        Route::middleware('role:member,editor,mod,admin')->group(function (): void {
            Route::get('calendar/events', [CalendarController::class, 'index']);
            Route::post('calendar/events/{event}/register-duty', [CalendarController::class, 'registerDuty']);
            Route::get('chat/groups', [ChatController::class, 'index']);
            Route::get('chat/groups/{group}/messages', [ChatController::class, 'messages']);
            Route::post('chat/groups/{group}/messages', [ChatController::class, 'sendMessage']);
            Route::post('pending-edits', [PendingEditController::class, 'store']);
            Route::get('prayers', [PrayerController::class, 'index']);
            Route::get('prayers/{prayer}', [PrayerController::class, 'show']);
        });
    });
});
