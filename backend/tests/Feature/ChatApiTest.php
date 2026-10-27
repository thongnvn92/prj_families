<?php

namespace Tests\Feature;

use App\Enums\ChatGroupType;
use App\Enums\MemberGender;
use App\Enums\UserRole;
use App\Events\MessageSent;
use App\Models\ChatGroup;
use App\Models\ChatMessage;
use App\Models\Family;
use App\Models\Member;
use App\Models\User;
use App\Support\FamilySettings;
use Illuminate\Broadcasting\BroadcastException;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Storage;
use Laravel\Passport\Passport;
use Tests\TestCase;

class ChatApiTest extends TestCase
{
    use DatabaseTransactions;

    public function test_group_member_can_send_message_and_event_is_dispatched(): void
    {
        Event::fake([MessageSent::class]);
        $family = Family::query()->create(['name' => 'Chat family', 'code' => 'chat-'.uniqid()]);
        $member = Member::query()->create([
            'family_id' => $family->id,
            'full_name' => 'Thành viên chat',
            'gender' => MemberGender::Other,
            'generation' => 1,
            'is_alive' => true,
        ]);
        $user = User::query()->create([
            'name' => 'User chat',
            'email' => uniqid().'@example.test',
            'password' => 'password',
            'role' => UserRole::Member,
            'member_id' => $member->id,
            'family_id' => $family->id,
        ]);
        $group = ChatGroup::query()->create([
            'family_id' => $family->id,
            'name' => 'Nhóm chat test',
            'type' => ChatGroupType::Custom,
            'created_by' => $user->id,
        ]);
        $group->members()->attach($user->id, ['role' => 'owner']);
        Passport::actingAs($user);

        $this->postJson("/api/v1/chat/groups/{$group->id}/messages", ['message_text' => 'Xin chào'])
            ->assertCreated()
            ->assertJsonPath('data.message_text', 'Xin chào');

        Event::assertDispatched(MessageSent::class);
        $this->assertDatabaseHas('chat_messages', ['group_id' => $group->id, 'sender_id' => $user->id, 'message_text' => 'Xin chào']);
    }

    public function test_group_creation_resolves_member_ids_to_accounts_and_adds_creator(): void
    {
        $familyId = $this->familyId();
        $admin = $this->userFor($familyId, UserRole::Admin);
        $target = $this->userFor($familyId, UserRole::Member);
        // Thành viên chưa có tài khoản phải bị bỏ qua thay vì làm hỏng request.
        $withoutAccount = Member::query()->where('family_id', $familyId)->whereDoesntHave('user')->firstOrFail();
        Passport::actingAs($admin);

        $groupId = $this->postJson('/api/v1/chat/groups', [
            'name' => 'Ban Trưởng Chi 3',
            'type' => ChatGroupType::Branch->value,
            'member_ids' => [$target->member_id, $withoutAccount->id],
        ])->assertCreated()
            ->assertJsonPath('data.name', 'Ban Trưởng Chi 3')
            ->assertJsonPath('data.type', ChatGroupType::Branch->value)
            ->assertJsonPath('data.member_count', 2)
            ->json('data.id');

        $this->assertEqualsCanonicalizing(
            [$admin->id, $target->id],
            ChatGroup::query()->findOrFail($groupId)->members()->pluck('users.id')->all(),
        );
        $this->assertDatabaseHas('chat_group_members', ['group_id' => $groupId, 'user_id' => $admin->id, 'role' => 'owner']);
    }

    public function test_member_ids_from_another_family_are_rejected(): void
    {
        $familyId = $this->familyId();
        Passport::actingAs($this->userFor($familyId, UserRole::Admin));
        $otherFamily = Family::query()->where('id', '!=', $familyId)->orderByDesc('id')->value('id');

        $this->postJson('/api/v1/chat/groups', [
            'name' => 'Nhóm xuyên dòng họ',
            'type' => ChatGroupType::Custom->value,
            'member_ids' => [Member::query()->where('family_id', $otherFamily)->value('id')],
        ])->assertUnprocessable();
    }

    public function test_member_cannot_create_group(): void
    {
        $familyId = $this->familyId();
        Passport::actingAs($this->userFor($familyId, UserRole::Member));

        $this->postJson('/api/v1/chat/groups', [
            'name' => 'Nhóm không được phép',
            'type' => ChatGroupType::Custom->value,
            'member_ids' => [Member::query()->where('family_id', $familyId)->value('id')],
        ])->assertForbidden();
    }

    // MARK: - Messages

    public function test_history_is_scoped_to_the_group(): void
    {
        Event::fake([MessageSent::class]);
        [$group, $sender, $otherGroup] = $this->groupsWithMembers();
        Passport::actingAs($sender);
        $this->postJson("/api/v1/chat/groups/{$group->id}/messages", ['message_text' => 'Kính gửi toàn thể các anh chị.'])->assertCreated();

        $payload = $this->getJson("/api/v1/chat/groups/{$group->id}/messages")->assertOk()->json('data');
        $this->assertCount(1, $payload);
        $this->assertSame($sender->name, $payload[0]['sender_name']);
        $this->assertNull($payload[0]['image_url']);
        $this->assertSame(0, ChatMessage::query()->where('group_id', $otherGroup->id)->count());
    }

    public function test_sending_image_stores_a_webp_under_the_group_folder(): void
    {
        Event::fake([MessageSent::class]);
        Storage::fake('public');
        [$group, $sender] = $this->groupsWithMembers();
        // Ảnh trong tin nhắn tuân theo cùng cấu hình quyền upload của Admin trong
        // family_settings, nên member phải được cấp quyền mới gửi được ảnh.
        FamilySettings::update($sender->family_id, true, ['admin', 'mod', 'editor', 'member'], null);
        Passport::actingAs($sender);

        $imageUrl = $this->post("/api/v1/chat/groups/{$group->id}/messages", [
            'message_text' => 'Ảnh gia đình hôm nay',
            'image' => UploadedFile::fake()->image('gia-dinh.png', 600, 400),
        ], ['Accept' => 'application/json'])->assertCreated()->json('data.image_url');

        $this->assertNotNull($imageUrl);
        $this->assertStringContainsString('chat/'.$group->id, (string) $imageUrl);
        $this->assertCount(1, Storage::disk('public')->files('chat/'.$group->id));
    }

    public function test_blank_message_without_image_is_rejected(): void
    {
        Event::fake([MessageSent::class]);
        [$group, $sender] = $this->groupsWithMembers();
        Passport::actingAs($sender);

        $this->postJson("/api/v1/chat/groups/{$group->id}/messages", ['message_text' => '   '])->assertUnprocessable();
        // Đếm theo group vì bảng có thể còn dữ liệu seed/smoke.
        $this->assertSame(0, ChatMessage::query()->where('group_id', $group->id)->count());
    }

    public function test_non_member_cannot_read_or_post_messages(): void
    {
        [$group] = $this->groupsWithMembers();
        Passport::actingAs($this->userFor($group->family_id, UserRole::Member));

        $this->getJson("/api/v1/chat/groups/{$group->id}/messages")->assertForbidden();
        $this->postJson("/api/v1/chat/groups/{$group->id}/messages", ['message_text' => 'Xin vào nhóm'])->assertForbidden();
    }

    public function test_group_list_hides_groups_the_user_does_not_belong_to(): void
    {
        [$group, $sender] = $this->groupsWithMembers();
        Passport::actingAs($sender);

        $ids = collect($this->getJson('/api/v1/chat/groups')->assertOk()->json('data'))->pluck('id');
        $this->assertTrue($ids->contains($group->id));
        $this->assertFalse($ids->contains($this->groupsWithMembers()[2]->id), 'Người dùng không thuộc nhóm thì không được thấy nhóm đó.');
    }

    public function test_message_is_saved_even_when_broadcast_fails(): void
    {
        // Reverb chạy đồng bộ nên sập sẽ làm 500 dù tin đã lưu; client retry sẽ tạo tin trùng.
        config()->set('broadcasting.default', 'pusher');
        config()->set('broadcasting.connections.pusher', [
            'driver' => 'pusher',
            'key' => 'test-key',
            'secret' => 'test-secret',
            'app_id' => 'test-app',
            // Cổng 9 (discard) không lắng nghe nên PusherBroadcaster sẽ ném BroadcastException.
            'options' => ['host' => '127.0.0.1', 'port' => 9, 'useTLS' => false],
        ]);
        $this->withoutExceptionHandling([BroadcastException::class]);
        [$group, $sender] = $this->groupsWithMembers();
        Passport::actingAs($sender);

        $response = $this->postJson("/api/v1/chat/groups/{$group->id}/messages", ['message_text' => 'Vẫn phải lưu'])->assertCreated();

        $this->assertSame('Vẫn phải lưu', $response->json('data.message_text'));
        $this->assertDatabaseHas('chat_messages', ['group_id' => $group->id, 'message_text' => 'Vẫn phải lưu']);
    }

    public function test_chat_requires_authentication(): void
    {
        $this->getJson('/api/v1/chat/groups')->assertUnauthorized();
    }

    // MARK: - Broadcast authorization (Reverb / laravel-echo)

    public function test_group_member_can_authorize_the_private_chat_channel(): void
    {
        [$group, $sender] = $this->groupsWithMembers();
        Passport::actingAs($sender);

        // Đúng endpoint mà pusher-js gọi qua authEndpoint (src/lib/echo.ts).
        $auth = $this->postJson('/api/v1/broadcasting/auth', [
            'socket_id' => '1234.5678',
            'channel_name' => 'private-chat-groups.'.$group->id,
        ])->assertOk()->json('auth');

        // Chữ ký phải mở đầu bằng app key của Reverb thì Reverb mới chấp nhận subscribe.
        $this->assertStringStartsWith(config('broadcasting.connections.reverb.key').':', (string) $auth);
    }

    public function test_broadcast_auth_rejects_a_user_who_is_not_a_group_member(): void
    {
        [$group] = $this->groupsWithMembers();
        Passport::actingAs($this->userFor($group->family_id, UserRole::Member));

        $this->postJson('/api/v1/broadcasting/auth', [
            'socket_id' => '1234.5678',
            'channel_name' => 'private-chat-groups.'.$group->id,
        ])->assertForbidden();
    }

    public function test_broadcast_auth_rejects_a_member_of_a_group_in_another_family(): void
    {
        [$group] = $this->groupsWithMembers();
        // Tự tạo dòng họ thứ hai để test không phụ thuộc seed có sẵn nhiều family.
        $otherFamily = Family::query()->create(['name' => 'Dòng họ khác', 'code' => 'other-'.uniqid()]);
        $outsider = $this->userFor((int) $otherFamily->id, UserRole::Member);
        $outsiderGroup = ChatGroup::query()->create([
            'family_id' => $otherFamily->id,
            'name' => 'Nhóm dòng họ khác',
            'type' => ChatGroupType::Custom,
            'created_by' => $outsider->id,
        ]);
        $outsiderGroup->members()->attach($outsider->id, ['role' => 'owner']);
        Passport::actingAs($outsider);

        // Là thành viên hợp lệ của nhóm khác nhưng vẫn bị chặn channel của nhóm này.
        $this->postJson('/api/v1/broadcasting/auth', [
            'socket_id' => '1234.5678',
            'channel_name' => 'private-chat-groups.'.$group->id,
        ])->assertForbidden();
    }

    public function test_broadcast_auth_rejects_channels_that_are_not_registered(): void
    {
        [$group, $sender] = $this->groupsWithMembers();
        Passport::actingAs($sender);

        // Nhóm không tồn tại: implicit binding phải trả 403 chứ không ném lỗi 500.
        $this->postJson('/api/v1/broadcasting/auth', [
            'socket_id' => '1234.5678',
            'channel_name' => 'private-chat-groups.'.($group->id + 1_000_000),
        ])->assertForbidden();
        // Channel không nằm trong bất kỳ pattern nào cũng bị từ chối.
        $this->postJson('/api/v1/broadcasting/auth', [
            'socket_id' => '1234.5678',
            'channel_name' => 'private-family.'.$group->family_id,
        ])->assertForbidden();
    }

    public function test_broadcast_auth_requires_authentication(): void
    {
        $this->postJson('/api/v1/broadcasting/auth', [
            'socket_id' => '1234.5678',
            'channel_name' => 'private-chat-groups.1',
        ])->assertUnauthorized();
    }

    public function test_user_can_authorize_only_its_own_background_channel(): void
    {
        [$group, $sender] = $this->groupsWithMembers();
        Passport::actingAs($sender);

        // Channel nền phục vụ bộ đếm tin chưa đọc, chỉ chính chủ được subscribe.
        $this->postJson('/api/v1/broadcasting/auth', [
            'socket_id' => '1234.5678',
            'channel_name' => 'private-users.'.$sender->id,
        ])->assertOk();

        $this->postJson('/api/v1/broadcasting/auth', [
            'socket_id' => '1234.5678',
            'channel_name' => 'private-users.'.($sender->id + 1),
        ])->assertForbidden();
    }

    public function test_message_is_broadcast_to_the_group_and_every_member_background_channel(): void
    {
        Event::fake([MessageSent::class]);
        [$group, $sender] = $this->groupsWithMembers();
        $second = $this->userFor($group->family_id, UserRole::Member);
        $group->members()->attach($second->id, ['role' => 'member']);
        Passport::actingAs($sender);

        $this->postJson("/api/v1/chat/groups/{$group->id}/messages", ['message_text' => 'Đếm tin chưa đọc'])->assertCreated();

        Event::assertDispatched(MessageSent::class, function (MessageSent $event) use ($group, $sender, $second): bool {
            $names = collect($event->broadcastOn())->map(fn ($channel): string => (string) $channel)->sort()->values()->all();

            return $names === collect([
                'private-chat-groups.'.$group->id,
                'private-users.'.$sender->id,
                'private-users.'.$second->id,
            ])->sort()->values()->all();
        });
    }

    public function test_admin_can_authorize_a_chat_channel_it_does_not_belong_to(): void
    {
        // Admin (Trưởng Tộc) bypass membership để khớp với ChatController::assertMember().
        [$group] = $this->groupsWithMembers();
        Passport::actingAs($this->userFor($group->family_id, UserRole::Admin));

        $this->postJson('/api/v1/broadcasting/auth', [
            'socket_id' => '1234.5678',
            'channel_name' => 'private-chat-groups.'.$group->id,
        ])->assertOk()->assertJsonStructure(['auth']);
    }

    // MARK: - Helpers

    private function familyId(): int
    {
        return (int) Family::query()->orderBy('id')->value('id');
    }

    /** Trả về [nhóm, thành viên, nhóm khác không ai thuộc]. */
    private function groupsWithMembers(): array
    {
        $sender = $this->userFor($this->familyId(), UserRole::Member);
        $group = ChatGroup::query()->create([
            'family_id' => $sender->family_id,
            'name' => 'Toàn Dòng Họ',
            'type' => ChatGroupType::All,
            'created_by' => $sender->id,
        ]);
        $group->members()->attach($sender->id, ['role' => 'owner']);
        $otherGroup = ChatGroup::query()->create([
            'family_id' => $sender->family_id,
            'name' => 'Nhóm không ai thuộc',
            'type' => ChatGroupType::Custom,
            'created_by' => $sender->id,
        ]);

        return [$group, $sender, $otherGroup];
    }

    private function userFor(?int $familyId, UserRole $role = UserRole::Member): User
    {
        $familyId ??= $this->familyId();

        return User::query()->create([
            'name' => 'Thành viên chat '.uniqid(),
            'email' => uniqid().'@example.test',
            'password' => 'password',
            'role' => $role,
            'family_id' => $familyId,
            // Mỗi user cần một member riêng để test resolve được nhiều tài khoản trong một nhóm.
            'member_id' => Member::query()->where('family_id', $familyId)->whereDoesntHave('user')->inRandomOrder()->value('id'),
        ]);
    }
}
