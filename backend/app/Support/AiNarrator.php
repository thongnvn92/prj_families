<?php

namespace App\Support;

use App\Models\Member;

/**
 * Sinh câu trả lời tiếng Việt cho Trợ lý AI Gia tộc từ dữ liệu trong FamilyContext.
 *
 * Tách riêng khỏi AiAssistant để phần "đóng vai trò" (driver LLM) và phần "diễn đạt
 * kính trọng theo phong tục" nằm đúng chỗ, dễ kiểm thử và dễ thay văn phong sau này.
 */
final class AiNarrator
{
    public function __construct(private readonly FamilyContext $context) {}

    public function origin(): string
    {
        $family = $this->context->family;
        $root = $this->context->keyMembers->first();

        return 'Kính thưa ông/bà, theo dữ liệu gia phả, dòng '.$family->name
            .($family->root_ancestor_name ? ' ghi nhận cụ '.$family->root_ancestor_name.' làm Thủy tổ' : ' chưa ghi nhận tên Thủy tổ trong hồ sơ')
            .($family->origin_place ? ', quê quán tại '.$family->origin_place : '')
            .'. Dòng họ hiện có '.$this->context->totalMembers.' hồ sơ thành viên trong hệ thống'
            .($root ? ', trong đó cụ '.$root->full_name.' thuộc đời thứ '.$root->generation.' là người được ghi nhận sớm nhất ạ.' : ' ạ.')
            .' Ông/bà có thể mở thẻ tham chiếu bên dưới để xem hồ sơ chi tiết.';
    }

    public function upcomingEvents(): string
    {
        $events = $this->context->upcomingEvents;
        if ($events->isEmpty()) {
            return 'Kính thưa ông/bà, hiện kho gia phả chưa ghi nhận ngày giỗ hay lễ sắp tới. '
                .'Ông/bà có thể vào mục Lịch Âm & Nhắc giỗ để xem toàn bộ sự kiện, hoặc nhờ Ban Trưởng Chi bổ sung ạ.';
        }

        $lines = $events->map(function ($event): string {
            $days = (int) now()->startOfDay()->diffInDays($event->solar_date->copy()->startOfDay(), false);

            return sprintf(
                '• %s (%s) — âm %d/%d, dương %s, còn %d ngày',
                $event->member?->full_name ?? 'Không rõ',
                $event->event_type->value === 'death_anniversary' ? 'ngày giỗ' : 'ngày sinh',
                $event->lunar_day,
                $event->lunar_month,
                $event->solar_date?->toDateString() ?? 'chưa xác định',
                $days,
            );
        })->implode("\n");

        return "Kính thưa ông/bà, đây là các ngày giỗ và lễ sắp tới đang có trong kho:\n".$lines
            ."\n\nĐể xem ngày dương tương ứng hoặc đăng ký mâm cúng, ông/bà mở mục Lịch Âm & Nhắc giỗ ạ.";
    }

    public function ritual(): string
    {
        $rituals = $this->context->rituals;

        return 'Kính thưa ông/bà, khi cúng ông/bà chuẩn bị lư hương, hoa quả, rượu, trà, bát cơm, đèn và hướng về bàn thờu.'
            .($rituals->isEmpty()
                ? ' Hệ thống chưa nhập bài văn nào cho dòng họ nên cháu không tự ý soạn thay ạ.'
                : ' Hệ thống đang lưu '.$rituals->count().' bài văn: '.implode('; ', $rituals->pluck('title')->all())
                    .'. Ông/bà mở mục Nghi lễ & Văn cúng để đọc toàn văn và in ra dâng ạ.')
            .' Trước khi dùng, xin ông/bà đối chiếu với văn quy trong dòng họ và hỏi Trưởng Chi nếu có nghi lễ riêng.';
    }

    public function member(Member $member): string
    {
        $details = array_filter([
            $member->role ? 'chức vụ ghi nhận: '.$member->role : null,
            $member->birth_date_solar ? 'sinh ngày '.$member->birth_date_solar->toDateString() : null,
            $member->death_date_solar ? 'mất ngày '.$member->death_date_solar->toDateString() : null,
            $member->burial_place ? 'mộ tại '.$member->burial_place : null,
        ]);

        return 'Kính thưa ông/bà, theo dữ liệu gia phả, '.$member->full_name
            .' thuộc đời thứ '.$member->generation
            .($member->is_alive ? ', hiện còn sống' : ', đã mất')
            .($details ? '. '.implode('; ', $details) : '')
            .'. Ông/bà mở thẻ tham chiếu bên dưới để xem đầy đủ hồ sơ ạ.';
    }

    public function overview(string $prompt): string
    {
        $members = $this->context->keyMembers->take(6)
            ->map(fn (Member $member): string => $member->full_name.' (đời '.$member->generation.')')
            ->implode(', ');

        return 'Kính thưa ông/bà, cháu đã nhận câu hỏi: "'.trim($prompt).'". '
            .'Dòng '.$this->context->family->name.' hiện có '.$this->context->totalMembers.' hồ sơ; '
            .'trong đó cháu đã nắm các thành viên chính: '.$members.'. '
            .'Ông/bà có thể hỏi cháu về nguồn gốc dòng họ, một thành viên cụ thể, ngày giỗ sắp tới hoặc bài văn cúng ạ.';
    }

    /**
     * Gợi ý câu hỏi sinh từ ngữ cảnh gia phả, dùng cho chip gợi ý ở frontend.
     *
     * @return array<int, string>
     */
    public function suggestions(): array
    {
        $family = $this->context->family;
        $nextEvent = $this->context->upcomingEvents->first();
        $keyMember = $this->context->keyMembers->first();
        $firstRitual = $this->context->rituals->first();

        return array_values(array_filter([
            "Dòng họ {$family->name} có nguồn gốc từ đâu?",
            $family->root_ancestor_name ? "Ai là Thủy tổ của {$family->name}?" : null,
            $nextEvent && $nextEvent->member
                ? sprintf('Ngày giỗ của %s là khi nào?', $nextEvent->member->full_name)
                : 'Khi nào có ngày giỗ sắp tới trong dòng họ?',
            $keyMember ? sprintf('%s thuộc đời thứ mấy?', $keyMember->full_name) : null,
            $firstRitual
                ? 'Cho cháu xin bài văn cúng đang lưu: '.$firstRitual->title
                : 'Khi cúng ông bà cần chuẩn bị những gì?',
            'Trong dòng họ hiện có bao nhiêu thành viên?',
        ]));
    }
}
