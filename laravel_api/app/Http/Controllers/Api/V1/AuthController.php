<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\Family;
use App\Models\User;
use App\Rules\SafeEmail;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class AuthController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', new SafeEmail, 'max:255', 'unique:users,email'],
            'password' => ['required', 'confirmed', Password::min(8)],
            'phone' => ['nullable', 'string', 'max:30'],
            'family_code' => ['required', 'string', 'exists:families,code'],
            'member_id' => ['nullable', 'integer', 'exists:members,id'],
        ]);
        $family = Family::query()->where('code', $data['family_code'])->firstOrFail();
        if (isset($data['member_id'])) {
            abort_unless(Family::query()->whereKey($family->id)->whereHas('members', fn ($query) => $query->whereKey($data['member_id']))->exists(), 422, 'Thành viên liên kết không thuộc dòng họ này.');
        }
        $user = User::query()->create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => $data['password'],
            'phone' => $data['phone'] ?? null,
            'role' => UserRole::Member,
            'member_id' => $data['member_id'] ?? null,
            'family_id' => $family->id,
        ]);
        $token = $user->createToken('gia-pha-'.$request->ip());

        return response()->json(['data' => new UserResource($user), 'token' => $token->accessToken, 'token_type' => 'Bearer'], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', new SafeEmail],
            'password' => ['required', 'string'],
            'device_name' => ['nullable', 'string', 'max:100'],
        ]);
        $user = User::query()->where('email', $data['email'])->first();
        if (! $user || ! Hash::check($data['password'], $user->password)) {
            return response()->json(['message' => 'Email hoặc mật khẩu không đúng.', 'errors' => ['email' => ['Thông tin đăng nhập không hợp lệ.']]], 422);
        }
        $token = $user->createToken($data['device_name'] ?? 'gia-pha-'.$request->ip());

        return response()->json([
            'data' => new UserResource($user->load('member')),
            'token' => $token->accessToken,
            'token_type' => 'Bearer',
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $token = $request->user()?->token();
        if ($token && method_exists($token, 'revoke')) {
            $token->revoke();
        }

        return response()->json(['message' => 'Đã đăng xuất.']);
    }

    public function profile(Request $request): UserResource
    {
        return new UserResource($request->user()->load(['member.father', 'member.mother', 'member.spouse']));
    }

    public function updateProfile(Request $request): UserResource
    {
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', new SafeEmail, 'max:255', Rule::unique('users', 'email')->ignore($request->user()->id)],
            'phone' => ['sometimes', 'nullable', 'string', 'max:30'],
        ]);
        $request->user()->update($data);

        return new UserResource($request->user()->fresh(['member']));
    }
}
