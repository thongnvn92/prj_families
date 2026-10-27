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

/**
 * Hồ sơ cá nhân: ưu tiên Họ và tên, Quê quán, Ngày sinh (dương + con giáp) và
 * Ngày mất. Backend là nguồn quyết định dữ liệu và quyền, frontend chỉ hiển thị.
 */
class PersonalProfileApiTest extends TestCase
{
    use DatabaseTransactions;

    private function family(): Family
    {
        return Family::query()->orderBy('id')->firstOrFail();
    }

    private function userFor(UserRole $role, ?Member $member = null): User
    {
        return User::query()->create([
            'name' => 'Người dùng hồ sơ',
            'email' => uniqid('profile').'@example.test',
            'password' => 'password-123',
            'role' => $role,
            'family_id' => $this->family()->id,
            'member_id' => $member?->id,
        ]);
    }

    private function memberFor(User $user, array $attributes = []): Member
    {
        return Member::query()->create(array_merge([
            'family_id' => $user->family_id,
            'full_name' => 'Nguyễn Văn A',
            'gender' => MemberGender::Male,
            'generation' => 1,
            'is_alive' => true,
        ], $attributes));
    }

    public function test_member_resource_exposes_prioritised_profile_fields(): void
    {
        $user = $this->userFor(UserRole::Member);
        // 1968 là năm Mậu Thân nên nhãn con giáp phải khớp dù không có năm âm.
        $member = $this->memberFor($user, [
            'birthplace' => 'An Lão, Kiến An, Hải Phòng',
            'birth_date_solar' => '1968-05-21',
        ]);
        Passport::actingAs($user);

        $response = $this->getJson("/api/v1/members/{$member->id}")
            ->assertOk()
            ->assertJsonPath('full_name', 'Nguyễn Văn A')
            ->assertJsonPath('birthplace', 'An Lão, Kiến An, Hải Phòng')
            ->assertJsonPath('birth_date_solar', '1968-05-21')
            ->assertJsonPath('birth_zodiac', 'Mậu Thân')
            ->assertJsonPath('death_zodiac', null);

        $this->assertNull($response->json('death_date_solar'), 'Chưa mất thì ngày mất phải để trống để frontend hiển thị "-".');
    }

    public function test_recorded_lunar_year_wins_over_the_solar_year(): void
    {
        $user = $this->userFor(UserRole::Member);
        // Năm âm 1968 (Mậu Thân) khác năm dương 1962 (Nhâm Dần): con giáp phải
        // theo năm âm vì Tết nằm giữa tháng 1-2 dương.
        $member = $this->memberFor($user, [
            'birth_date_solar' => '1962-01-20',
            'birth_year_lunar' => 1968,
        ]);
        Passport::actingAs($user);

        $this->getJson("/api/v1/members/{$member->id}")
            ->assertOk()
            ->assertJsonPath('birth_zodiac', 'Mậu Thân');
    }

    public function test_admin_can_update_hometown_and_dates_of_a_member(): void
    {
        $admin = $this->userFor(UserRole::Admin);
        $member = $this->memberFor($admin);
        Passport::actingAs($admin);

        $this->putJson("/api/v1/members/{$member->id}", [
            'full_name' => 'Nguyễn Văn A',
            'gender' => MemberGender::Male,
            'generation' => 1,
            'is_alive' => false,
            'birthplace' => 'An Lão, Kiến An, Hải Phòng',
            'birth_date_solar' => '1962-05-21',
            'death_date_solar' => '2020-02-10',
        ])->assertOk()
            ->assertJsonPath('birthplace', 'An Lão, Kiến An, Hải Phòng')
            ->assertJsonPath('birth_zodiac', 'Nhâm Dần')
            ->assertJsonPath('death_date_solar', '2020-02-10');

        $this->assertDatabaseHas('members', [
            'id' => $member->id,
            'birthplace' => 'An Lão, Kiến An, Hải Phòng',
        ]);
    }

    public function test_guest_projection_never_exposes_hometown_or_zodiac(): void
    {
        $member = Member::query()->create([
            'family_id' => $this->family()->id,
            'full_name' => 'Nguyễn Văn Công khai',
            'gender' => MemberGender::Male,
            'generation' => 1,
            'is_alive' => true,
            'birthplace' => 'An Lão, Kiến An, Hải Phòng',
            'address' => 'Địa chỉ riêng',
            'birth_date_solar' => '1962-05-21',
        ]);

        $items = $this->getJson('/api/v1/members?search=Công khai')->assertOk()->json('data');
        $this->assertNotEmpty($items);
        $this->assertSame($member->id, $items[0]['id']);
        foreach (['birthplace', 'birth_zodiac', 'death_zodiac', 'address', 'birth_date_solar'] as $privateField) {
            $this->assertArrayNotHasKey($privateField, $items[0]);
        }
    }

    public function test_auth_profile_returns_the_linked_member_with_profile_fields(): void
    {
        $editor = $this->userFor(UserRole::Editor);
        $member = $this->memberFor($editor, [
            'birthplace' => 'An Lão, Kiến An, Hải Phòng',
            'birth_date_solar' => '1962-05-21',
        ]);
        $editor->update(['member_id' => $member->id]);
        Passport::actingAs($editor);

        $this->getJson('/api/v1/auth/me')
            ->assertOk()
            ->assertJsonPath('member.full_name', 'Nguyễn Văn A')
            ->assertJsonPath('member.birthplace', 'An Lão, Kiến An, Hải Phòng')
            ->assertJsonPath('member.birth_zodiac', 'Nhâm Dần');
    }

    public function test_member_role_can_only_propose_hometown_changes(): void
    {
        $reviewer = $this->userFor(UserRole::Mod);
        $target = $this->memberFor($reviewer);
        Passport::actingAs($this->userFor(UserRole::Member));

        $this->postJson('/api/v1/pending-edits', [
            'edit_type' => 'update_info',
            'target_member_id' => $target->id,
            'proposed_data' => ['birthplace' => 'An Lão, Kiến An, Hải Phòng'],
        ])->assertCreated()
            ->assertJsonPath('data.proposed_data.birthplace', 'An Lão, Kiến An, Hải Phòng');

        // Đề xuất chưa được duyệt nên hồ sơ thành viên phải giữ nguyên.
        $this->assertDatabaseMissing('members', [
            'id' => $target->id,
            'birthplace' => 'An Lão, Kiến An, Hải Phòng',
        ]);
        $this->assertDatabaseHas('pending_edits', [
            'target_member_id' => $target->id,
            'status' => 'pending',
        ]);
    }
}
