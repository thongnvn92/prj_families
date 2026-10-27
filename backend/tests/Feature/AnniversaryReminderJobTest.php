<?php

namespace Tests\Feature;

use App\Enums\LunarEventType;
use App\Events\AnniversaryReminderSent;
use App\Jobs\RemindUpcomingAnniversaries;
use App\Models\AnniversaryReminder;
use App\Models\Family;
use App\Models\LunarEvent;
use App\Models\Member;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

class AnniversaryReminderJobTest extends TestCase
{
    use DatabaseTransactions;

    public function test_does_not_broadcast_when_the_giỗ_is_beyond_the_lead_window(): void
    {
        Event::fake([AnniversaryReminderSent::class]);
        $member = Member::query()->orderBy('id')->firstOrFail();
        $event = $this->event($member, lunarDay: 15, lunarMonth: 3);

        // leadDays = 0 chỉ nhắc đúng ngày giỗ hôm nay.
        (new RemindUpcomingAnniversaries(leadDays: 0))->handle();

        $expected = $event->nextOccurrence();
        if ($expected->isFuture()) {
            Event::assertNotDispatched(AnniversaryReminderSent::class);
            $this->assertSame(0, AnniversaryReminder::query()->where('lunar_event_id', $event->id)->count());
        } else {
            $this->assertSame(1, AnniversaryReminder::query()->where('lunar_event_id', $event->id)->count());
        }
    }

    public function test_records_the_reminder_so_it_never_sends_twice_for_the_same_occurrence(): void
    {
        Event::fake([AnniversaryReminderSent::class]);
        $member = Member::query()->orderBy('id')->firstOrFail();
        $event = $this->event($member, lunarDay: 1, lunarMonth: 1);

        // leadDays rất lớn để chắc chắn sự kiện nằm trong cửa sổ.
        $job = new RemindUpcomingAnniversaries(leadDays: 400);
        $job->handle();
        $this->assertSame(
            1,
            AnniversaryReminder::query()->where('lunar_event_id', $event->id)->count(),
            'Lần chạy đầu phải ghi nhận lịch sử nhắc.',
        );

        // Chạy lại nhiều lần vẫn không nhắc trùng.
        $job->handle();
        $job->handle();
        $this->assertSame(1, AnniversaryReminder::query()->where('lunar_event_id', $event->id)->count());

        $reminder = AnniversaryReminder::query()->where('lunar_event_id', $event->id)->firstOrFail();
        $this->assertSame(
            $event->nextOccurrence()?->format('Y-m-d'),
            $reminder->reminded_for->format('Y-m-d'),
            'Lịch sử phải ghi đúng ngày giỗ, không phải ngày chạy job.',
        );
    }

    public function test_stored_reference_date_is_ignored_when_computing_the_reminder(): void
    {
        Event::fake([AnniversaryReminderSent::class]);
        $member = Member::query()->orderBy('id')->firstOrFail();
        // solar_date cố tình lệch hẳn để chứng minh job không đọc cột này.
        $event = $this->event($member, lunarDay: 1, lunarMonth: 1);
        $event->update(['solar_date' => now()->subYears(3)->toDateString()]);

        (new RemindUpcomingAnniversaries(leadDays: 400))->handle();

        $reminder = AnniversaryReminder::query()->where('lunar_event_id', $event->id)->firstOrFail();
        $this->assertSame(
            $event->nextOccurrence()?->format('Y-m-d'),
            $reminder->reminded_for->format('Y-m-d'),
        );
    }

    public function test_payload_carries_the_lunar_label_and_days_remaining(): void
    {
        Event::fake([AnniversaryReminderSent::class]);
        $member = Member::query()->orderBy('id')->firstOrFail();
        $this->event($member, lunarDay: 15, lunarMonth: 1);

        (new RemindUpcomingAnniversaries(leadDays: 400))->handle();

        Event::assertDispatched(AnniversaryReminderSent::class, function (AnniversaryReminderSent $sent): bool {
            return $sent->lunarLabel === 'Rằm tháng Giêng'
                && is_int($sent->daysRemaining)
                && $sent->solarDate !== '';
        });
    }

    public function test_reminder_channels_only_include_accounts_of_the_same_family(): void
    {
        $family = Family::query()->orderBy('id')->firstOrFail();
        $otherFamily = Family::query()->where('id', '!=', $family->id)->first()
            ?? Family::query()->create(['name' => 'Chi khác', 'code' => 'chi-khac-'.substr(uniqid(), 0, 8)]);

        $member = Member::query()->where('family_id', $family->id)->firstOrFail();
        $event = $this->event($member, lunarDay: 1, lunarMonth: 1);
        $inside = $this->userFor($family);
        $outside = $this->userFor($otherFamily);

        // Channel nền đã mang tiền tố "private-" do Laravel/Pusher tự thêm, khớp với
        // cách frontend subscribe trong src/lib/echo.ts.
        $channels = array_map(
            fn ($channel): string => $channel->name,
            (new AnniversaryReminderSent($event, now()->toDateString(), 'Mùng 1 tháng Giêng', 3))->broadcastOn(),
        );

        $this->assertContains('private-users.'.$inside->id, $channels);
        $this->assertNotContains('private-users.'.$outside->id, $channels);
    }

    // MARK: - Helpers

    private function event(Member $member, int $lunarDay, int $lunarMonth): LunarEvent
    {
        return LunarEvent::query()->create([
            'member_id' => $member->id,
            'event_type' => LunarEventType::DeathAnniversary,
            'lunar_day' => $lunarDay,
            'lunar_month' => $lunarMonth,
            'solar_date' => Carbon::now()->toDateString(),
            'burial_place' => 'Nghĩa trang làng Trung',
            'organizer' => 'Ban Trưởng tộc',
        ]);
    }

    private function userFor(Family $family): User
    {
        return User::query()->create([
            'name' => 'Người nhận nhắc giỗ',
            'email' => uniqid().'@example.test',
            'password' => 'password',
            'role' => 'member',
            'family_id' => $family->id,
        ]);
    }
}
