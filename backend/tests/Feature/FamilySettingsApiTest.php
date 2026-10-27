<?php

namespace Tests\Feature;

use App\Enums\ChatGroupType;
use App\Enums\PhotoCategory;
use App\Enums\PhotoVisibility;
use App\Enums\UserRole;
use App\Events\MessageSent;
use App\Models\ChatGroup;
use App\Models\ChatMessage;
use App\Models\Family;
use App\Models\User;
use App\Support\FamilySettings;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Storage;
use Laravel\Passport\Passport;
use Tests\TestCase;

class FamilySettingsApiTest extends TestCase
{
    use DatabaseTransactions;

    public function test_guest_can_read_settings_but_cannot_update_them(): void
    {
        $this->getJson('/api/v1/family-settings')->assertOk()
            ->assertJsonPath('data.chat_enabled', true)
            ->assertJsonPath('data.image_upload_roles', ['admin', 'mod', 'editor']);

        $this->putJson('/api/v1/family-settings', ['chat_enabled' => false, 'image_upload_roles' => ['admin']])
            ->assertUnauthorized();
    }

    public function test_admin_can_disable_chat_and_choose_upload_roles(): void
    {
        $admin = $this->userFor(UserRole::Admin);
        Passport::actingAs($admin);

        $this->putJson('/api/v1/family-settings', [
            'chat_enabled' => false,
            'image_upload_roles' => ['admin', 'member'],
        ])->assertOk()
            ->assertJsonPath('data.chat_enabled', false)
            ->assertJsonPath('data.image_upload_roles', ['admin', 'member']);

        $this->assertDatabaseHas('family_settings', [
            'family_id' => $admin->family_id,
            'chat_enabled' => 0,
            'updated_by' => $admin->id,
        ]);
    }

    public function test_non_admin_roles_cannot_update_settings(): void
    {
        foreach ([UserRole::Mod, UserRole::Editor, UserRole::Member, UserRole::Guest] as $role) {
            Passport::actingAs($this->userFor($role));
            $this->putJson('/api/v1/family-settings', ['chat_enabled' => false, 'image_upload_roles' => ['admin']])
                ->assertForbidden();
        }
    }

    public function test_update_rejects_guest_role_and_empty_role_list(): void
    {
        Passport::actingAs($this->userFor(UserRole::Admin));

        $this->putJson('/api/v1/family-settings', ['chat_enabled' => true, 'image_upload_roles' => ['guest']])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('image_upload_roles.0');

        $this->putJson('/api/v1/family-settings', ['chat_enabled' => true, 'image_upload_roles' => []])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('image_upload_roles');
    }

    public function test_disabling_chat_blocks_group_and_message_endpoints(): void
    {
        $member = $this->userFor(UserRole::Member);
        [$group] = $this->groupFor($member);
        FamilySettings::update($member->family_id, false, ['admin', 'mod', 'editor'], null);
        Passport::actingAs($member);

        $this->getJson('/api/v1/chat/groups')->assertForbidden();
        $this->getJson("/api/v1/chat/groups/{$group->id}/messages")->assertForbidden();
        $this->postJson("/api/v1/chat/groups/{$group->id}/messages", ['message_text' => 'Xin chào'])->assertForbidden();
        $this->assertSame(0, ChatMessage::query()->where('group_id', $group->id)->count());
    }

    public function test_disabling_chat_blocks_realtime_channel_authorization(): void
    {
        $member = $this->userFor(UserRole::Member);
        [$group] = $this->groupFor($member);
        FamilySettings::update($member->family_id, false, ['admin', 'mod', 'editor'], null);
        Passport::actingAs($member);

        $this->postJson('/api/v1/broadcasting/auth', [
            'socket_id' => '1234.5678',
            'channel_name' => 'private-chat-groups.'.$group->id,
        ])->assertForbidden();
    }

    public function test_member_upload_is_allowed_only_after_admin_grants_permission(): void
    {
        Storage::fake('public');
        $member = $this->userFor(UserRole::Member);
        Passport::actingAs($member);

        $this->post('/api/v1/album', $this->photoPayload(), ['Accept' => 'application/json'])->assertForbidden();

        FamilySettings::update($member->family_id, true, ['admin', 'mod', 'editor', 'member'], null);

        $this->post('/api/v1/album', $this->photoPayload(), ['Accept' => 'application/json'])
            ->assertCreated()
            ->assertJsonPath('data.uploaded_by', $member->id);
    }

    public function test_revoking_upload_permission_blocks_existing_editor(): void
    {
        Storage::fake('public');
        $editor = $this->userFor(UserRole::Editor);
        Passport::actingAs($editor);

        $this->post('/api/v1/album', $this->photoPayload(), ['Accept' => 'application/json'])->assertCreated();

        FamilySettings::update($editor->family_id, true, ['admin', 'mod'], null);

        $this->post('/api/v1/album', $this->photoPayload(), ['Accept' => 'application/json'])->assertForbidden();
    }

    public function test_chat_image_requires_upload_permission_but_text_still_works(): void
    {
        Event::fake([MessageSent::class]);
        Storage::fake('public');
        $member = $this->userFor(UserRole::Member);
        [$group] = $this->groupFor($member);
        // Chat vẫn mở nhưng member không được gửi ảnh.
        FamilySettings::update($member->family_id, true, ['admin', 'mod', 'editor'], null);
        Passport::actingAs($member);

        $this->postJson("/api/v1/chat/groups/{$group->id}/messages", ['message_text' => 'Chào bà con'])
            ->assertCreated();

        $this->post("/api/v1/chat/groups/{$group->id}/messages", [
            'message_text' => 'Ảnh họp mặt',
            'image' => UploadedFile::fake()->image('hop-mat.jpg', 400, 300),
        ], ['Accept' => 'application/json'])->assertForbidden();

        $this->assertSame(1, ChatMessage::query()->where('group_id', $group->id)->count());
    }

    public function test_missing_row_falls_back_to_defaults_without_writing(): void
    {
        $family = Family::query()->create(['name' => 'Dòng họ mới', 'code' => 'moi-'.uniqid()]);
        $this->assertDatabaseMissing('family_settings', ['family_id' => $family->id]);

        $settings = FamilySettings::forFamily($family->id);

        $this->assertTrue($settings->chat_enabled);
        $this->assertSame(['admin', 'mod', 'editor'], $settings->image_upload_roles);
        // Đọc cấu hình không được sinh side-effect.
        $this->assertDatabaseMissing('family_settings', ['family_id' => $family->id]);
    }

    public function test_roles_endpoint_lists_configurable_roles(): void
    {
        Passport::actingAs($this->userFor(UserRole::Admin));

        $values = $this->getJson('/api/v1/family-settings/roles')->assertOk()->json('data');

        $this->assertSame(['admin', 'mod', 'editor', 'member'], array_column($values, 'value'));
    }

    // MARK: - Helpers

    /** @return array{0: ChatGroup} */
    private function groupFor(User $owner): array
    {
        $group = ChatGroup::query()->create([
            'family_id' => $owner->family_id,
            'name' => 'Nhóm chat kiểm thử',
            'type' => ChatGroupType::Custom,
            'created_by' => $owner->id,
        ]);
        $group->members()->attach($owner->id, ['role' => 'owner']);

        return [$group];
    }

    private function photoPayload(): array
    {
        return [
            'title' => 'Ảnh dòng họ',
            'category' => PhotoCategory::General->value,
            'visibility' => PhotoVisibility::Family->value,
            'image' => UploadedFile::fake()->image('gia-dinh.jpg', 400, 400),
        ];
    }

    private function userFor(UserRole $role, ?int $familyId = null): User
    {
        return User::query()->create([
            'name' => 'Người dùng cấu hình '.ucfirst($role->value),
            'email' => uniqid().'@example.test',
            'password' => 'password',
            'role' => $role,
            'family_id' => $familyId ?? Family::query()->orderBy('id')->value('id'),
        ]);
    }
}
