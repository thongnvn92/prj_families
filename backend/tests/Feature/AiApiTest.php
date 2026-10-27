<?php

namespace Tests\Feature;

use App\Enums\LunarEventType;
use App\Enums\MemberGender;
use App\Enums\PrayerCategory;
use App\Enums\UserRole;
use App\Models\Family;
use App\Models\LunarEvent;
use App\Models\Member;
use App\Models\Prayer;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\Http;
use Laravel\Passport\Passport;
use Tests\TestCase;

class AiApiTest extends TestCase
{
    use DatabaseTransactions;

    protected function setUp(): void
    {
        parent::setUp();
        // Mặc định dùng fallback driver để test không phụ thuộc dịch vụ LLM ngoài.
        config()->set('ai.driver', 'fallback');
        config()->set('ai.api_key', null);
    }

    public function test_member_can_ask_a_question_and_receive_an_answer_with_references(): void
    {
        $family = Family::query()->create([
            'name' => 'Dòng họ AI',
            'code' => 'ai-'.uniqid(),
            'root_ancestor_name' => 'Nguyễn Văn Gốc',
            'origin_place' => 'Bắc Ninh',
        ]);
        $user = $this->userFor($family, UserRole::Member);
        $root = $this->memberFor($family, 'Nguyễn Văn Gốc');
        Passport::actingAs($user);

        $response = $this->postJson('/api/v1/ai/chat', ['prompt' => 'Dòng họ ta có nguồn gốc từ đâu?'])->assertOk();

        $response->assertJsonPath('data.driver', 'fallback')
            ->assertJsonPath('context.family.name', 'Dòng họ AI')
            ->assertJsonPath('context.family.root_ancestor_name', 'Nguyễn Văn Gốc');
        $this->assertStringContainsString('Nguyễn Văn Gốc', $response->json('data.text'));
        $this->assertStringContainsString('Bắc Ninh', $response->json('data.text'));
        $this->assertContains((string) $root->id, array_column($response->json('data.references'), 'memberId'));
    }

    public function test_answer_uses_upcoming_anniversary_from_the_database(): void
    {
        $family = Family::query()->create(['name' => 'Dòng họ Giỗ', 'code' => 'aig-'.uniqid()]);
        $user = $this->userFor($family, UserRole::Member);
        $ancestor = $this->memberFor($family, 'Nguyễn Văn Giỗ');
        LunarEvent::query()->create([
            'member_id' => $ancestor->id,
            'event_type' => LunarEventType::DeathAnniversary,
            'lunar_day' => 15,
            'lunar_month' => 3,
            'solar_date' => today()->addDays(12),
        ]);
        Passport::actingAs($user);

        $text = $this->postJson('/api/v1/ai/chat', ['prompt' => 'Ngày giỗ sắp tới là khi nào?'])->assertOk()->json('data.text');

        $this->assertStringContainsString('Nguyễn Văn Giỗ', $text);
        $this->assertStringContainsString('12 ngày', $text);
        $this->assertStringContainsString('15/3', $text);
    }

    public function test_member_lookup_answers_with_that_members_profile(): void
    {
        $family = Family::query()->create(['name' => 'Dòng họ Hỏi', 'code' => 'aih-'.uniqid()]);
        $user = $this->userFor($family, UserRole::Member);
        $member = $this->memberFor($family, 'Nguyễn Thị Sáu', generation: 3);
        Passport::actingAs($user);

        $response = $this->postJson('/api/v1/ai/chat', ['prompt' => 'Cho cháu hỏi về Nguyễn Thị Sáu'])->assertOk();

        $this->assertStringContainsString('Nguyễn Thị Sáu', $response->json('data.text'));
        $this->assertStringContainsString('đời thứ 3', $response->json('data.text'));
        $this->assertSame([['memberId' => (string) $member->id, 'name' => 'Nguyễn Thị Sáu']], $response->json('data.references'));
    }

    public function test_suggestions_are_built_from_the_family_context(): void
    {
        $family = Family::query()->create([
            'name' => 'Dòng họ Gợi ý',
            'code' => 'ais-'.uniqid(),
            'root_ancestor_name' => 'Nguyễn Văn Gợi',
        ]);
        $user = $this->userFor($family, UserRole::Member);
        $this->memberFor($family, 'Nguyễn Văn Gợi');
        Prayer::query()->create([
            'family_id' => $family->id,
            'title' => 'Văn khấn khai trạch',
            'category' => PrayerCategory::NhapTrach,
            'content' => 'Nội dung văn khấn đủ dài để vượt qua quy tắc kiểm tra của hệ thống.',
            'author_id' => $user->id,
        ]);
        Passport::actingAs($user);

        $suggestions = $this->getJson('/api/v1/ai/suggestions')->assertOk()->json('data');

        $this->assertContains('Dòng họ Dòng họ Gợi ý có nguồn gốc từ đâu?', $suggestions);
        $this->assertNotEmpty(array_filter($suggestions, fn (string $item): bool => str_contains($item, 'Nguyễn Văn Gợi')));
        $this->assertNotEmpty(array_filter($suggestions, fn (string $item): bool => str_contains($item, 'khai trạch')));
    }

    public function test_ai_requires_authentication(): void
    {
        $this->postJson('/api/v1/ai/chat', ['prompt' => 'Dòng họ ta có nguồn gốc từ đâu?'])->assertUnauthorized();
        $this->getJson('/api/v1/ai/suggestions')->assertUnauthorized();
    }

    public function test_guest_cannot_use_the_ai_assistant(): void
    {
        $family = Family::query()->create(['name' => 'Dòng họ Khách', 'code' => 'aiguest-'.uniqid()]);
        Passport::actingAs($this->userFor($family, UserRole::Guest));

        $this->postJson('/api/v1/ai/chat', ['prompt' => 'Dòng họ ta có nguồn gốc từ đâu?'])->assertForbidden();
        $this->getJson('/api/v1/ai/suggestions')->assertForbidden();
    }

    public function test_prompt_is_required_and_bounded(): void
    {
        $family = Family::query()->create(['name' => 'Dòng họ Validate', 'code' => 'aiv-'.uniqid()]);
        Passport::actingAs($this->userFor($family, UserRole::Member));

        $this->postJson('/api/v1/ai/chat', [])->assertUnprocessable()->assertJsonValidationErrors('prompt');
        $this->postJson('/api/v1/ai/chat', ['prompt' => 'ab'])->assertUnprocessable();
        $this->postJson('/api/v1/ai/chat', ['prompt' => str_repeat('a', 2001)])->assertUnprocessable();
    }

    public function test_user_cannot_read_another_family_context(): void
    {
        $ownFamily = Family::query()->create(['name' => 'Dòng họ Của tôi', 'code' => 'aio-'.uniqid()]);
        $otherFamily = Family::query()->create(['name' => 'Dòng họ Người Khác', 'code' => 'aix-'.uniqid()]);
        Passport::actingAs($this->userFor($ownFamily, UserRole::Member));

        $this->postJson('/api/v1/ai/chat', ['prompt' => 'Hỏi thử xem', 'family_id' => $otherFamily->id])->assertForbidden();
    }

    public function test_openai_driver_is_used_when_an_api_key_is_configured(): void
    {
        config()->set('ai.driver', 'openai');
        config()->set('ai.api_key', 'test-key');
        config()->set('ai.base_url', 'https://llm.test/v1');
        Http::fake(['llm.test/*' => Http::response(['choices' => [['message' => ['content' => 'Câu trả lời từ mô hình.']]]])]);

        $family = Family::query()->create(['name' => 'Dòng họ LLM', 'code' => 'aillm-'.uniqid()]);
        $user = $this->userFor($family, UserRole::Member);
        $this->memberFor($family, 'Nguyễn Văn Máy');
        Passport::actingAs($user);

        $response = $this->postJson('/api/v1/ai/chat', ['prompt' => 'Nguyễn Văn Máy là ai?'])->assertOk();

        $response->assertJsonPath('data.driver', 'openai')->assertJsonPath('data.text', 'Câu trả lời từ mô hình.');
        Http::assertSent(function ($request): bool {
            $payload = $request->data();

            // System prompt phải chứa ngữ cảnh dòng họ để câu trả lời bám sát gia phả.
            return $payload['messages'][0]['role'] === 'system'
                && str_contains($payload['messages'][0]['content'], 'Nguyễn Văn Máy');
        });
    }

    public function test_openai_failure_falls_back_without_breaking_the_request(): void
    {
        config()->set('ai.driver', 'openai');
        config()->set('ai.api_key', 'test-key');
        config()->set('ai.base_url', 'https://llm.test/v1');
        Http::fake(['llm.test/*' => Http::response('upstream error', 500)]);

        $family = Family::query()->create(['name' => 'Dòng họ Lỗi', 'code' => 'aierr-'.uniqid()]);
        $user = $this->userFor($family, UserRole::Member);
        $this->memberFor($family, 'Nguyễn Văn Chịu Lỗi');
        Passport::actingAs($user);

        $response = $this->postJson('/api/v1/ai/chat', ['prompt' => 'Nguyễn Văn Chịu Lỗi là ai?'])->assertOk();

        $response->assertJsonPath('data.driver', 'fallback');
        $this->assertStringContainsString('Nguyễn Văn Chịu Lỗi', $response->json('data.text'));
    }

    // MARK: - Helpers

    private function userFor(Family $family, UserRole $role): User
    {
        return User::query()->create([
            'name' => 'Người dùng AI '.ucfirst($role->value),
            'email' => uniqid().'@example.test',
            'password' => 'password',
            'role' => $role,
            'family_id' => $family->id,
        ]);
    }

    private function memberFor(Family $family, string $name, int $generation = 1): Member
    {
        return Member::query()->create([
            'family_id' => $family->id,
            'full_name' => $name,
            'gender' => MemberGender::Male,
            'generation' => $generation,
            'is_alive' => true,
        ]);
    }
}
