<?php

namespace App\Support;

use App\Models\Member;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Throwable;

/**
 * Trợ lý AI Gia tộc: đóng vai chuyên gia gia phả, phong tục, nghi lễ và văn cúng.
 *
 * Hai driver:
 *  - "openai": gọi API chat completion tương thích OpenAI với system prompt chứa ngữ
 *    cảnh gia tộc (FamilyContext). Dùng được với OpenAI, OpenRouter, Ollama, vLLM...
 *  - "fallback": khi chưa cấu hình AI_API_KEY, trả lời bằng dữ liệu trong context
 *    (nguồn gốc, thành viên, ngày giỗ sắp tới, văn cúng) để màn hình vẫn dùng được ở local.
 *
 * Driver LLM lỗi hoặc timeout tự chuyển về fallback thay vì báo lỗi cho người dùng.
 */
final class AiAssistant
{
    private readonly AiNarrator $narrator;

    public function __construct(private readonly FamilyContext $context)
    {
        $this->narrator = new AiNarrator($context);
    }

    public function answer(string $prompt): AiAnswer
    {
        return $this->shouldCallRemote()
            ? $this->remoteAnswer($prompt) ?? $this->fallbackAnswer($prompt)
            : $this->fallbackAnswer($prompt);
    }

    public function suggestions(): array
    {
        return $this->narrator->suggestions();
    }

    private function shouldCallRemote(): bool
    {
        return config('ai.driver') !== 'fallback' && filled(config('ai.api_key'));
    }

    private function remoteAnswer(string $prompt): ?AiAnswer
    {
        try {
            $response = Http::timeout((int) config('ai.timeout'))
                ->withToken((string) config('ai.api_key'))
                ->acceptJson()
                ->post(rtrim((string) config('ai.base_url'), '/').'/chat/completions', [
                    'model' => config('ai.model'),
                    'temperature' => 0.3,
                    'messages' => [
                        ['role' => 'system', 'content' => $this->context->systemPrompt()],
                        ['role' => 'user', 'content' => $prompt],
                    ],
                ]);

            if (! $response->successful()) {
                report('AI driver error: '.$response->status().' '.$response->body());

                return null;
            }

            $text = trim((string) data_get($response->json(), 'choices.0.message.content', ''));

            return $text === '' ? null : new AiAnswer($text, $this->references($this->mentionedMembers($prompt)), 'openai');
        } catch (Throwable $error) {
            // LLM hỏng không được làm hỏng trải nghiệm tra cứu gia phả.
            report($error);

            return null;
        }
    }

    /** Fallback driver: bám theo context, giọng kính trọng, luôn kèm thẻ tham chiếu. */
    private function fallbackAnswer(string $prompt): AiAnswer
    {
        $query = $this->normalize($prompt);

        /*
         * Tên thành viên được tra trước các chủ đề chung: nhiều họ tên Việt chứa từ khoá
         * chủ đề (ví dụ "Nguyễn Văn ...") nên nếu so chủ đề trước sẽ trả lời lệch.
         */
        if ($member = $this->matchMember($prompt)) {
            return new AiAnswer($this->narrator->member($member), $this->references(collect([$member])), 'fallback');
        }

        if (Str::contains($query, ['nguon goc', 'nguồn gốc', 'thuy to', 'thủy tổ', 'to tien', 'tổ tiên', 'que hanh', 'que quan', 'origin'])) {
            return new AiAnswer($this->narrator->origin(), $this->references($this->context->keyMembers->take(2)), 'fallback');
        }

        if (Str::contains($query, ['ngay gio', 'ngày giỗ', 'lich ', 'lịch ', 'le ', 'lễ ', 'sap toi', 'sắp tới'])) {
            $eventMembers = $this->context->upcomingEvents->map->member->filter();

            return new AiAnswer($this->narrator->upcomingEvents(), $this->references($eventMembers), 'fallback');
        }

        if (Str::contains($query, ['cung', 'cúng', 'van ', 'văn ', 'nghi le', 'nghi lễ', 'khai trach', 'nhap trach', 'tet'])) {
            return new AiAnswer($this->narrator->ritual(), [], 'fallback');
        }

        return new AiAnswer($this->narrator->overview($prompt), $this->references($this->context->keyMembers->take(3)), 'fallback');
    }

    private function matchMember(string $prompt): ?Member
    {
        $query = $this->normalize($prompt);
        if ($query === '') {
            return null;
        }

        return $this->context->keyMembers
            ->filter(fn (Member $member): bool => $this->normalize($member->full_name) !== '')
            ->sortByDesc(fn (Member $member): int => mb_strlen($this->normalize($member->full_name)))
            ->first(fn (Member $member): bool => Str::contains($query, $this->normalize($member->full_name)));
    }

    /** @return Collection<int, Member> */
    private function mentionedMembers(string $prompt): Collection
    {
        $query = $this->normalize($prompt);

        return $this->context->keyMembers->filter(function (Member $member) use ($query): bool {
            $name = $this->normalize($member->full_name);

            return $name !== '' && Str::contains($query, $name);
        })->take(4);
    }

    /**
     * @param  Collection<int, Member>  $members
     * @return array<int, array{memberId: string, name: string}>
     */
    private function references(Collection $members): array
    {
        return $members
            ->filter()
            ->unique(fn (Member $member): int => $member->id)
            ->take(6)
            ->map(fn (Member $member): array => ['memberId' => (string) $member->id, 'name' => $member->full_name])
            ->values()
            ->all();
    }

    private function normalize(string $value): string
    {
        return trim(Str::lower(Str::ascii($value)));
    }
}
