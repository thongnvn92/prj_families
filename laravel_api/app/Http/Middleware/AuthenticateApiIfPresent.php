<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use League\OAuth2\Server\Exception\OAuthServerException;
use Symfony\Component\HttpFoundation\Response;

/**
 * Resolve a Passport token when one is present without requiring authentication.
 * Requests without a token continue as guests and receive the public projection.
 */
class AuthenticateApiIfPresent
{
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->bearerToken() === null) {
            return $next($request);
        }

        try {
            $user = Auth::guard('api')->user();
        } catch (AuthenticationException|OAuthServerException) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        if ($user === null) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        Auth::shouldUse('api');
        $request->setUserResolver(static fn () => $user);

        return $next($request);
    }
}
