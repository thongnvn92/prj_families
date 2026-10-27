<?php

namespace App\Jobs;

use App\Events\AnniversaryReminderSent;
use App\Models\AnniversaryReminder;
use App\Models\LunarEvent;
use App\Support\LunarCalendar;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

/**
 * Nhắc giỗ trong ứng dụng: phát thông báo tới mọi tài khoản của dòng họ khi ngày giỗ
 * còn `leadDays` ngày (mặc định 7) hoặc đến đúng ngày giỗ.
 *
 * Ngày giỗ luôn được tính lại từ `lunar_day`/`lunar_month` qua LunarCalendar nên đúng
 * ở mọi năm, không phụ thuộc cột `solar_date`.
 *
 * Idempotent: bảng `anniversary_reminders` có unique (lunar_event_id, reminded_for)
 * nên chạy lại nhiều lần trong ngày vẫn chỉ gửi đúng một lần.
 */
class RemindUpcomingAnniversaries implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(public int $leadDays = 7) {}

    public function handle(): void
    {
        $today = today();
        $windowEnd = $today->copy()->addDays($this->leadDays);

        LunarEvent::query()
            ->with(['member:id,full_name,family_id'])
            ->get()
            ->each(function (LunarEvent $event) use ($today, $windowEnd): void {
                $occurrence = $event->nextOccurrence($today);
                if (! $occurrence instanceof \DateTimeInterface || $occurrence->greaterThan($windowEnd)) {
                    return;
                }

                $remindedFor = $occurrence->format('Y-m-d');
                // Đã nhắc lần giỗ này rồi thì bỏ qua.
                if (AnniversaryReminder::query()
                    ->where('lunar_event_id', $event->id)
                    ->whereDate('reminded_for', $remindedFor)
                    ->exists()) {
                    return;
                }

                $daysRemaining = (int) $today->startOfDay()->diffInDays($occurrence->startOfDay(), false);
                $lunar = LunarCalendar::toLunar($occurrence);

                AnniversaryReminderSent::dispatch(
                    $event,
                    $remindedFor,
                    trim($lunar['dayLabel'].' tháng '.$lunar['monthName']),
                    $daysRemaining,
                );

                AnniversaryReminder::query()->create([
                    'lunar_event_id' => $event->id,
                    'reminded_for' => $remindedFor,
                    'reminded_at' => now(),
                    // Đếm số tài khoản sẽ nhận; chỉ mang tính thống kê, không quyết định gửi.
                    'recipients_count' => $event->member?->family?->users()->count() ?? 0,
                ]);
            });
    }
}
