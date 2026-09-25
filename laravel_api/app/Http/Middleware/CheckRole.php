<?php

namespace App\Http\Middleware;

use App\Enums\UserRole;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();
        $role = $user?->role;

        if (! $role instanceof UserRole) {
            return response()->json(['message' => 'Bạn cần đăng nhập để thực hiện thao tác này.'], 401);
        }

        $allowed = array_map(static fn (string $role): UserRole => UserRole::from($role), $roles);
        abort_unless(in_array($role, $allowed, true), 403, 'Bạn không có quyền thực hiện thao tác này.');

        return $next($request);
    }
}
