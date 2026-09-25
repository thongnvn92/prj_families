<?php

namespace Tests\Feature;

use App\Enums\ChatGroupType;
use App\Enums\MemberGender;
use App\Enums\UserRole;
use App\Events\MessageSent;
use App\Models\ChatGroup;
use App\Models\Family;
use App\Models\Member;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\Event;
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
}
