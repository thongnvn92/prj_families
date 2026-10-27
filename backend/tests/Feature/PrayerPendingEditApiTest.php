<?php

namespace Tests\Feature;

use App\Enums\MemberGender;
use App\Enums\PendingEditStatus;
use App\Enums\PrayerCategory;
use App\Enums\UserRole;
use App\Models\Family;
use App\Models\Member;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Laravel\Passport\Passport;
use Tests\TestCase;

class PrayerPendingEditApiTest extends TestCase
{
    use DatabaseTransactions;

    public function test_admin_can_create_and_list_prayers_with_author_name(): void
    {
        [$admin] = $this->userContext(UserRole::Admin);
        Passport::actingAs($admin);

        $created = $this->postJson('/api/v1/prayers', [
            'title' => 'Văn khấn kiểm thử',
            'category' => PrayerCategory::GioTo->value,
            'content' => 'Nội dung văn khấn đủ dài để vượt qua quy tắc kiểm tra.',
        ])->assertCreated()
            ->assertJsonPath('data.title', 'Văn khấn kiểm thử')
            ->assertJsonPath('data.category', PrayerCategory::GioTo->value)
            ->assertJsonPath('data.author_name', $admin->name);

        $this->assertDatabaseHas('prayers', ['id' => $created->json('data.id'), 'author_id' => $admin->id]);

        $this->getJson('/api/v1/prayers?category=gio_to')
            ->assertOk()
            ->assertJsonPath('data.0.category', PrayerCategory::GioTo->value);
    }

    public function test_prayer_creation_requires_admin_role(): void
    {
        [$member] = $this->userContext(UserRole::Member);
        Passport::actingAs($member);

        $this->postJson('/api/v1/prayers', [
            'title' => 'Văn khấn trái phép',
            'category' => PrayerCategory::Tet->value,
            'content' => 'Nội dung văn khấn đủ dài để vượt qua quy tắc kiểm tra.',
        ])->assertForbidden();

        $this->assertDatabaseMissing('prayers', ['title' => 'Văn khấn trái phép']);
    }

    public function test_member_proposal_is_reviewed_by_admin_and_applies_to_member(): void
    {
        [$member, $target] = $this->familyContext(UserRole::Member);
        $this->assertDatabaseHas('members', ['id' => $target->id]);
        Passport::actingAs($member);

        $proposal = $this->postJson('/api/v1/pending-edits', [
            'edit_type' => 'update_info',
            'target_member_id' => $target->id,
            'proposed_data' => ['nickname' => 'Biệt danh đề xuất'],
        ])->assertCreated()
            ->assertJsonPath('data.status', PendingEditStatus::Pending->value)
            ->assertJsonPath('data.requester_role', UserRole::Member->value)
            ->assertJsonPath('data.target_member_id', $target->id)
            ->assertJsonPath('data.proposed_data.nickname', 'Biệt danh đề xuất');

        $this->assertDatabaseHas('pending_edits', ['id' => $proposal->json('data.id'), 'status' => 'pending']);
        $this->assertNull($target->fresh()?->nickname);

        [$admin] = $this->userContext(UserRole::Admin);
        Passport::actingAs($admin);

        $this->postJson("/api/v1/pending-edits/{$proposal->json('data.id')}/approve")
            ->assertOk()
            ->assertJsonPath('data.status', PendingEditStatus::Approved->value);

        $this->assertDatabaseHas('members', ['id' => $target->id, 'nickname' => 'Biệt danh đề xuất']);
    }

    public function test_rejected_proposal_cannot_be_approved_twice(): void
    {
        [$admin] = $this->userContext(UserRole::Admin);
        [$member, $target] = $this->familyContext(UserRole::Member, $admin);
        Passport::actingAs($member);

        $editId = $this->postJson('/api/v1/pending-edits', [
            'edit_type' => 'update_info',
            'target_member_id' => $target->id,
            'proposed_data' => ['role' => 'Trưởng chi nháp'],
        ])->assertCreated()->json('data.id');

        Passport::actingAs($admin);

        $this->postJson("/api/v1/pending-edits/{$editId}/reject", [
            'reason' => 'Tài liệu chưa đủ căn cứ xác nhận thay đổi này.',
        ])->assertOk()
            ->assertJsonPath('data.status', PendingEditStatus::Rejected->value)
            ->assertJsonPath('data.reject_reason', 'Tài liệu chưa đủ căn cứ xác nhận thay đổi này.');

        $this->postJson("/api/v1/pending-edits/{$editId}/approve")->assertUnprocessable();
        $this->assertDatabaseHas('members', ['id' => $target->id, 'role' => 'Thành viên']);
    }

    public function test_member_cannot_read_pending_edit_queue(): void
    {
        [$member] = $this->userContext(UserRole::Member);
        Passport::actingAs($member);

        $this->getJson('/api/v1/pending-edits')->assertForbidden();
    }

    /**
     * @return array{0: User}
     */
    private function userContext(UserRole $role): array
    {
        $family = Family::query()->orderBy('id')->firstOrFail();

        return [$this->createUser($role, $family)];
    }

    /**
     * @return array{0: User, 1: Member}
     */
    private function familyContext(UserRole $role, ?User $owner = null): array
    {
        $family = Family::query()->create(['name' => 'Gia đình đề xuất', 'code' => 'pe-'.uniqid()]);
        $user = $owner ?? $this->createUser($role, $family);
        $member = Member::query()->create([
            'family_id' => $family->id,
            'full_name' => 'Nguyễn Văn Đích',
            'gender' => MemberGender::Male,
            'generation' => 1,
            'is_alive' => true,
        ]);

        return [$user, $member];
    }

    private function createUser(UserRole $role, Family $family): User
    {
        return User::query()->create([
            'name' => 'Người dùng '.ucfirst($role->value),
            'email' => uniqid().'@example.test',
            'password' => 'password',
            'role' => $role,
            'family_id' => $family->id,
        ]);
    }
}
