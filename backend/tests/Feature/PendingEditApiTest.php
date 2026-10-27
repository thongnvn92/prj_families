<?php

namespace Tests\Feature;

use App\Enums\MemberGender;
use App\Enums\UserRole;
use App\Models\Family;
use App\Models\Member;
use App\Models\PendingEdit;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Laravel\Passport\Passport;
use Tests\TestCase;

class PendingEditApiTest extends TestCase
{
    use DatabaseTransactions;

    public function test_member_can_create_update_info_proposal(): void
    {
        [$user, $member] = $this->familyContext();
        Passport::actingAs($user);

        $this->postJson('/api/v1/pending-edits', [
            'edit_type' => 'update_info',
            'target_member_id' => $member->id,
            'proposed_data' => ['nickname' => 'Biệt danh mới'],
        ])->assertCreated()
            ->assertJsonPath('data.proposed_data.nickname', 'Biệt danh mới')
            ->assertJsonPath('data.status', 'pending');

        $this->assertDatabaseHas('pending_edits', [
            'requester_id' => $user->id,
            'target_member_id' => $member->id,
            'status' => 'pending',
        ]);
    }

    public function test_update_info_rejects_fields_outside_its_allowlist(): void
    {
        [$user, $member] = $this->familyContext();
        Passport::actingAs($user);

        $this->postJson('/api/v1/pending-edits', [
            'edit_type' => 'update_info',
            'target_member_id' => $member->id,
            'proposed_data' => ['full_name' => 'Tên không được phép'],
        ])->assertUnprocessable()
            ->assertJsonValidationErrors('proposed_data');

        $this->assertSame(0, PendingEdit::query()->count());
    }

    private function familyContext(): array
    {
        $family = Family::query()->create(['name' => 'Gia đình test', 'code' => 'test-'.uniqid()]);
        $member = Member::query()->create([
            'family_id' => $family->id,
            'full_name' => 'Nguyễn Văn Test',
            'gender' => MemberGender::Male,
            'generation' => 1,
            'is_alive' => true,
        ]);
        $user = User::query()->create([
            'name' => 'Thành viên test',
            'email' => uniqid().'@example.test',
            'password' => 'password',
            'role' => UserRole::Member,
            'family_id' => $family->id,
        ]);

        return [$user, $member];
    }
}
