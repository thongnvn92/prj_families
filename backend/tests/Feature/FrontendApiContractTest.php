<?php

namespace Tests\Feature;

use App\Enums\MemberGender;
use App\Enums\UserRole;
use App\Models\Family;
use App\Models\Member;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Laravel\Passport\Passport;
use Tests\TestCase;

class FrontendApiContractTest extends TestCase
{
    use DatabaseTransactions;

    public function test_auth_me_alias_returns_the_authenticated_user(): void
    {
        $family = Family::query()->orderBy('id')->firstOrFail();
        $user = User::query()->create([
            'name' => 'Frontend Member',
            'email' => uniqid().'@example.test',
            'password' => 'password-123',
            'role' => UserRole::Member,
            'family_id' => $family->id,
        ]);
        Passport::actingAs($user);

        $response = $this->getJson('/api/v1/auth/me')
            ->assertOk()
            ->assertJsonPath('id', $user->id)
            ->assertJsonPath('email', $user->email)
            ->assertJsonPath('role', UserRole::Member->value);

        $this->assertArrayNotHasKey('password', $response->json());
    }

    public function test_admin_can_create_and_update_a_member_without_changing_family_on_update(): void
    {
        $family = Family::query()->orderBy('id')->firstOrFail();
        $user = User::query()->create([
            'name' => 'Frontend Admin',
            'email' => uniqid().'@example.test',
            'password' => 'password-123',
            'role' => UserRole::Admin,
            'family_id' => $family->id,
        ]);
        Passport::actingAs($user);

        $created = $this->postJson('/api/v1/members', [
            'family_id' => $family->id,
            'full_name' => 'Thành viên CRUD frontend',
            'gender' => MemberGender::Other->value,
            'generation' => 1,
            'order_in_family' => 99,
            'is_alive' => true,
        ])->assertCreated();
        $memberId = $created->json('data.id');

        $this->putJson("/api/v1/members/{$memberId}", [
            'full_name' => 'Thành viên CRUD đã cập nhật',
            'gender' => MemberGender::Other->value,
            'generation' => 1,
            'order_in_family' => 99,
            'is_alive' => true,
        ])->assertOk()
            ->assertJsonPath('full_name', 'Thành viên CRUD đã cập nhật')
            ->assertJsonPath('family_id', $family->id);

        $this->deleteJson("/api/v1/members/{$memberId}")->assertOk();
        $this->assertDatabaseMissing('members', ['id' => $memberId]);
    }

    public function test_public_member_search_and_alive_filter_keep_private_fields_hidden(): void
    {
        $family = Family::query()->orderBy('id')->firstOrFail();
        $suffix = uniqid('Frontend');
        $alive = Member::query()->create([
            'family_id' => $family->id,
            'full_name' => "Nguyễn Sống {$suffix}",
            'gender' => MemberGender::Male,
            'generation' => 1,
            'is_alive' => true,
            'phone' => '0900000000',
            'address' => 'Địa chỉ không được công khai',
            'birth_date_solar' => '1980-01-02',
            'bio' => 'Tiểu sử riêng',
            'burial_place' => 'Nơi an táng riêng',
        ]);
        Member::query()->create([
            'family_id' => $family->id,
            'full_name' => "Nguyễn Đã Mất {$suffix}",
            'gender' => MemberGender::Male,
            'generation' => 1,
            'is_alive' => false,
        ]);

        $response = $this->getJson('/api/v1/members?'.http_build_query([
            'search' => $suffix,
            'is_alive' => true,
            'per_page' => 100,
        ]))->assertOk();
        $items = $response->json('data');

        $this->assertCount(1, $items);
        $this->assertSame($alive->id, $items[0]['id']);
        $this->assertTrue($items[0]['is_alive']);
        foreach (['phone', 'address', 'gender', 'birth_date_solar', 'birth_day_lunar', 'bio', 'burial_place', 'burial_map_url', 'home_map_url', 'avatar_url'] as $privateField) {
            $this->assertArrayNotHasKey($privateField, $items[0]);
        }
    }
}
