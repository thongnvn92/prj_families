<?php

namespace App\Http\Resources;

use App\Support\LunarCalendar;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LunarEventResource extends JsonResource
{
    public static $wrap = null;

    /**
     * Ngày giỗ dùng để hiển thị, luôn tính lại từ ngày âm.
     *
     * - Khi có `occurrence_date` (controller đã tính theo năm đang xem) thì dùng luôn.
     * - Nếu không, lấy lần giỗ sắp tới từ hôm nay.
     */
    private function resolvedOccurrence(): ?\DateTimeImmutable
    {
        $pinned = $this->resource->occurrence_date ?? null;
        if ($pinned instanceof \DateTimeInterface) {
            return \DateTimeImmutable::createFromFormat('Y-m-d', $pinned->format('Y-m-d'));
        }

        return $this->resource->nextOccurrence();
    }

    public function toArray(Request $request): array
    {
        $occurrence = $this->resolvedOccurrence();
        $daysRemaining = $occurrence instanceof \DateTimeInterface
            ? (int) now()->startOfDay()->diffInDays($occurrence->setTime(0, 0), false)
            : 0;

        // Nhãn ngày âm để frontend hiển thị; không có ngày dương thì lấy từ chính ngày âm.
        $lunar = $occurrence instanceof \DateTimeInterface
            ? LunarCalendar::toLunar($occurrence)
            : [
                'year' => null,
                'month' => (int) $this->lunar_month,
                'day' => (int) $this->lunar_day,
                'isLeapMonth' => false,
                'monthName' => LunarCalendar::monthName((int) $this->lunar_month),
                'dayLabel' => LunarCalendar::dayLabel((int) $this->lunar_day),
            ];

        return [
            'id' => $this->id,
            'member_id' => $this->member_id,
            'member_name' => $this->whenLoaded('member', fn () => $this->member?->full_name),
            'generation' => $this->whenLoaded('member', fn () => $this->member?->generation),
            'event_type' => $this->event_type,
            'lunar_day' => $this->lunar_day,
            'lunar_month' => $this->lunar_month,
            'lunar_year' => $this->lunar_year,
            // Nhãn âm lịch đã tính sẵn ở backend, frontend không cần tự quy đổi.
            'lunar_label' => trim($lunar['dayLabel'].' tháng '.$lunar['monthName']),
            'lunar_day_label' => $lunar['dayLabel'],
            'lunar_month_name' => $lunar['monthName'],
            'solar_date' => $occurrence?->format('Y-m-d'),
            'days_remaining' => $daysRemaining,
            'burial_place' => $this->burial_place,
            'organizer' => $this->organizer,
            // Ngày giỗ đã qua thì completed, có người nhận nhiệm vụ thì registered, còn lại upcoming.
            'status' => $daysRemaining < 0
                ? 'completed'
                : (((int) ($this->duty_registrations_count ?? 0)) > 0 ? 'registered' : 'upcoming'),
        ];
    }
}
