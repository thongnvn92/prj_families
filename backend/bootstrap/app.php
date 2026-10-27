<?php

use App\Http\Middleware\AuthenticateApiIfPresent;
use App\Http\Middleware\CheckRole;
use App\Http\Middleware\EnsureCanUploadImages;
use App\Http\Middleware\EnsureChatEnabled;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
        apiPrefix: 'api',
    )
    // Prefix 'api/v1' đồng bộ với routes/api.php: frontend gọi /api/v1/broadcasting/auth
    // (config/cors.php đã cho phép 'api/*' nên private channel authorize được từ Vite).
    ->withBroadcasting(__DIR__.'/../routes/channels.php', ['prefix' => 'api/v1', 'middleware' => ['auth:api']])
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->redirectGuestsTo(fn ($request) => $request->is('api/*') ? null : url('/'));
        $middleware->alias([
            'auth.optional' => AuthenticateApiIfPresent::class,
            'role' => CheckRole::class,
            // Công tắc do Admin (Trưởng Tộc) điều khiển trong family_settings.
            'chat.enabled' => EnsureChatEnabled::class,
            'image.upload' => EnsureCanUploadImages::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        $exceptions->shouldRenderJsonWhen(fn ($request) => $request->is('api/*') || $request->expectsJson());
    })->create();
