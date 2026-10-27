<?php

namespace App\Support;

use App\Models\Family;
use App\Models\LunarEvent;
use App\Models\Member;
use App\Models\Prayer;
use App\Models\User;
use Illuminate\Support\Collection;

/**
 * Ngữ cảnh gia tộc làm nguồn tri thức (RAG) cho Trợ lý AI: tên dòng họ, thành viên
 * cốt cán, ngày giỗ/lễ sắp tới và các bài văn cúng đã lưu trong hệ thống.
 *
 * Context luôn lấy theo family_id của tài khoản gọi API nên không rò rỉ dữ liệu sang
 * dòng họ khác; Admin có thể chỉ định family_id để tra cứu dòng họ bất kỳ.
 */
final class FamilyContext
{
    /**
     * @param  Collection<int, Member>  $keyMembers
     * @param  Collection<int, LunarEvent>  $upcomingEvents
     * @param  Collection<int, Prayer>  $rituals
     */
    public function __construct(
        public readonly Family $family,
        public readonly Collection $keyMembers,
        public readonly Collection $upcomingEvents,
        public readonly Collection $rituals,
        public readonly int $totalMembers,
    ) {}

    public static function forUser(User $user, ?int $familyId = null): self
    {
        $targetFamilyId = $familyId ?? $user->family_id;
        abort_if(! $targetFamilyId, 403, 'Tài khoản chưa được gán dòng họ.');
        abort_if($user->role->value !== 'admin' && (int) $targetFamilyId !== (int) $user->family_id, 403, 'Bạn không được tra cứu dòng họ khác.');

        $family = Family::query()->findOrFail($targetFamilyId);
        $limits = config('ai.context');

        return new self(
            $family,
            self::keyMembers((int) $family->id, (int) $limits['max_members']),
            self::upcomingEvents((int) $family->id, (int) $limits['max_events']),
            self::rituals((int) $family->id, (int) $limits['max_rituals']),
            Member::query()->where('family_id', $family->id)->count(),
        );
    }

    /**
     * Thành viên cốt cán: ưu tiên tổ tiên (không có cha/mẹ trong gia phả) rồi tới các
     * đời đầu tiên — đây là phần trợ lý thường được hỏi nhất.
     *
     * @return Collection<int, Member>
     */
    private static function keyMembers(int $familyId, int $limit): Collection
    {
        $root = (int) Member::query()->where('family_id', $familyId)
            ->where(function ($query): void {
                $query->whereNull('father_id')->orWhereNull('mother_id');
            })
            ->min('id');

        return Member::query()
            ->where('family_id', $familyId)
            ->orderByRaw('CASE WHEN id = ? THEN 0 ELSE 1 END', [$root])
            ->orderBy('generation')
            ->orderBy('order_in_family')
            ->orderBy('id')
            ->limit(max(1, $limit))
            ->get();
    }

    /**
     * @return Collection<int, LunarEvent>
     */
    private static function upcomingEvents(int $familyId, int $limit): Collection
    {
        return LunarEvent::query()
            ->whereHas('member', fn ($query) => $query->where('family_id', $familyId))
            ->whereDate('solar_date', '>=', today())
            ->with('member:id,full_name,generation')
            ->orderBy('solar_date')
            ->limit(max(1, $limit))
            ->get();
    }

    /**
     * @return Collection<int, Prayer>
     */
    private static function rituals(int $familyId, int $limit): Collection
    {
        return Prayer::query()
            ->where('family_id', $familyId)
            ->latest('id')
            ->limit(max(1, $limit))
            ->get();
    }

    /** System prompt mô tả vai trò Trợ lý Gia tộc kèm dữ liệu gia phả đã truy xuất. */
    public function systemPrompt(): string
    {
        $lines = [
            'Bạn là Trợ lý Gia Tộc, trợ lý ảo am hiểu gia phả, phong tục, nghi lễ và văn cúng truyền thống của dòng họ Việt Nam.',
            'Nguyên tắc: chỉ trả lời dựa trên dữ liệu gia phả được cung cấp bên dưới; tuyệt đối không bịa tên, ngày tháng hay quan hệ huyết thống.',
            'Giọng văn: kính trọng, gọi người dùng là "ông/bà", xưng "cháu", trả lời ngắn gọn để ông/bà đối chiếu với trưởng chi hoặc văn quy trong dòng họ.',
            'Nếu dữ liệu không đủ để trả lời, hãy nói rõ chỗ còn thiếu và gợi ý câu hỏi tiếp theo thay vì suy đoán.',
            '',
            '## Dữ liệu gia phả',
            '- Dòng họ: '.$this->family->name,
        ];

        if ($this->family->root_ancestor_name) {
            $lines[] = '- Thủy tổ ghi nhận: '.$this->family->root_ancestor_name;
        }
        if ($this->family->origin_place) {
            $lines[] = '- Quê quán: '.$this->family->origin_place;
        }
        $lines[] = '- Tổng số thành viên đang lưu: '.$this->totalMembers;

        $lines[] = '';
        $lines[] = '## Thành viên cốt cán';
        $lines[] = $this->keyMembers->isEmpty()
            ? '(chưa có dữ liệu thành viên)'
            : $this->keyMembers->map(fn (Member $member): string => $this->describeMember($member))->implode("\n");

        $lines[] = '';
        $lines[] = '## Ngày giỗ và lễ sắp tới';
        $lines[] = $this->upcomingEvents->isEmpty()
            ? '(không có ngày giỗ/lễ sắp tới trong kho)'
            : $this->upcomingEvents->map(fn (LunarEvent $event): string => sprintf(
                '- %s (%s): âm %d/%d, dương %s',
                $event->member?->full_name ?? 'Không rõ',
                $event->event_type->value === 'death_anniversary' ? 'ngày giỗ' : 'ngày sinh',
                $event->lunar_day,
                $event->lunar_month,
                $event->solar_date?->toDateString() ?? 'chưa xác định',
            ))->implode("\n");

        $lines[] = '';
        $lines[] = '## Văn cúng đã lưu trong hệ thống';
        $lines[] = $this->rituals->isEmpty()
            ? '(chưa nhập bài văn nào)'
            : $this->rituals->map(fn (Prayer $prayer): string => '- '.$prayer->title.' ('.$prayer->category->value.')')->implode("\n");

        return implode("\n", $lines);
    }

    private function describeMember(Member $member): string
    {
        $description = sprintf(
            '- %s%s, đời thứ %s, %s',
            $member->full_name,
            $member->role ? ' ('.$member->role.')' : '',
            $member->generation,
            $member->is_alive ? 'còn sống' : 'đã mất',
        );
        if ($member->birth_year_lunar) {
            $description .= ', sinh âm lịch '.$member->birth_day_lunar.'/'.$member->birth_month_lunar.'/'.$member->birth_year_lunar;
        }
        if ($member->birth_date_solar) {
            $description .= ' ('.$member->birth_date_solar->toDateString().')';
        }
        if ($member->death_date_solar) {
            $description .= ', mất ngày '.$member->death_date_solar->toDateString();
        }
        if ($member->burial_place) {
            $description .= ', mộ tại '.$member->burial_place;
        }

        return $description;
    }

    /**
     * Dữ liệu context gửi kèm response để frontend hiển thị "nguồn tham chiếu".
     *
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'family' => [
                'id' => (string) $this->family->id,
                'name' => $this->family->name,
                'root_ancestor_name' => $this->family->root_ancestor_name,
                'origin_place' => $this->family->origin_place,
                'total_members' => $this->totalMembers,
            ],
            'key_members' => $this->keyMembers->map(fn (Member $member): array => [
                'member_id' => (string) $member->id,
                'name' => $member->full_name,
                'generation' => $member->generation,
                'is_alive' => (bool) $member->is_alive,
            ])->values()->all(),
            'upcoming_events' => $this->upcomingEvents->map(fn (LunarEvent $event): array => [
                'event_id' => (string) $event->id,
                'member_id' => $event->member_id ? (string) $event->member_id : null,
                'member_name' => $event->member?->full_name,
                'event_type' => $event->event_type->value,
                'lunar_day' => $event->lunar_day,
                'lunar_month' => $event->lunar_month,
                'solar_date' => $event->solar_date?->toDateString(),
            ])->values()->all(),
        ];
    }
}
