<?php

namespace Tests\Feature;

use App\Enums\EventDutyType;
use App\Enums\LunarEventType;
use App\Enums\UserRole;
use App\Models\EventDutyRegistration;
use App\Models\Family;
use App\Models\LunarEvent;
use App\Models\Member;
use App\Models\User;
use App\Support\LunarCalendar;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Laravel\Passport\Passport;
use Tests\TestCase;

class CalendarApiTest extends TestCase
{
    use DatabaseTransactions;

    public function test_member_lists_upcoming_events_with_days_remaining_and_member_name(): void
    {
        $member = Member::query()->orderBy('id')->firstOrFail();
        $event = $this->makeEvent($member, LunarEventType::DeathAnniversary);
        Passport::actingAs($this->userFor($member->family_id));

        // Ngày giỗ được tính lại từ đúng ngày âm 19/8, không phải solar_date đã lưu.
        $expected = $event->nextOccurrence();
        $this->assertInstanceOf(\DateTimeInterface::class, $expected);

        $record = $this->eventRecord($event->id, ['upcoming' => 1]);

        $this->assertNotNull($record, 'Sự kiện sắp tới phải xuất hiện trong danh sách upcoming.');
        $this->assertSame($member->full_name, $record['member_name']);
        $this->assertSame($member->generation, $record['generation']);
        $this->assertSame(
            $expected->format('Y-m-d'),
            $record['solar_date'],
            'API phải trả ngày giỗ tính từ lịch âm.',
        );
        $this->assertSame('upcoming', $record['status']);
        $this->assertGreaterThanOrEqual(0, $record['days_remaining']);
    }

    public function test_past_event_is_reported_as_completed(): void
    {
        $member = Member::query()->orderBy('id')->firstOrFail();
        $event = $this->makeEvent($member, LunarEventType::BirthAnniversary);
        Passport::actingAs($this->userFor($member->family_id));

        // Xem một năm trước: ngày giỗ của năm đó luôn đã qua nên phải completed.
        $lastYear = (int) now()->year - 1;
        $past = $event->occurrenceInYear($lastYear);
        $this->assertInstanceOf(\DateTimeInterface::class, $past);

        $record = $this->eventRecord($event->id, ['year' => $lastYear]);

        $this->assertNotNull($record);
        $this->assertSame($past->format('Y-m-d'), $record['solar_date']);
        $this->assertLessThan(0, $record['days_remaining']);
        $this->assertSame('completed', $record['status']);
    }

    public function test_giỗ_date_changes_between_solar_years_but_keeps_the_lunar_date(): void
    {
        $member = Member::query()->orderBy('id')->firstOrFail();
        $event = $this->makeEvent($member, LunarEventType::DeathAnniversary);
        Passport::actingAs($this->userFor($member->family_id));

        $current = $this->eventRecord($event->id, ['year' => (int) now()->year]);
        $next = $this->eventRecord($event->id, ['year' => (int) now()->year + 1]);

        $this->assertNotNull($current);
        $this->assertNotNull($next);
        // Ngày dương khác nhau vì lịch âm trôi dần theo dương lịch.
        $this->assertNotSame($current['solar_date'], $next['solar_date']);
        // Nhưng nhãn ngày âm phải giữ nguyên ở cả hai năm.
        $this->assertSame('Mùng 19', $current['lunar_day_label']);
        $this->assertSame('Mùng 19', $next['lunar_day_label']);
        $this->assertSame(8, $current['lunar_month']);
        $this->assertSame(8, $next['lunar_month']);
    }

    public function test_month_filter_uses_the_computed_giỗ_date(): void
    {
        $member = Member::query()->orderBy('id')->firstOrFail();
        $event = $this->makeEvent($member, LunarEventType::DeathAnniversary);
        Passport::actingAs($this->userFor($member->family_id));

        $year = (int) now()->year;
        $occurrence = $event->occurrenceInYear($year);
        $this->assertInstanceOf(\DateTimeInterface::class, $occurrence);
        $month = (int) $occurrence->format('n');

        $inMonth = $this->eventRecord($event->id, ['year' => $year, 'month' => $month]);
        $this->assertNotNull($inMonth, 'Sự kiện phải xuất hiện ở đúng tháng của ngày giỗ đã tính.');

        $otherMonth = $month === 12 ? 1 : $month + 1;
        $this->assertNull(
            $this->eventRecord($event->id, ['year' => $year, 'month' => $otherMonth]),
            'Sự kiện không được xuất hiện ở tháng không có ngày giỗ.',
        );
    }

    public function test_member_registers_duty_and_event_becomes_registered(): void
    {
        $member = Member::query()->orderBy('id')->firstOrFail();
        $event = $this->makeEvent($member, LunarEventType::DeathAnniversary);
        $user = $this->userFor($member->family_id);
        Passport::actingAs($user);

        $response = $this->postJson("/api/v1/calendar/events/{$event->id}/register-duty", [
            'duty_type' => EventDutyType::Both->value,
            'phone' => '0901234567',
            'note' => 'Có thể chuẩn bị từ 7 giờ sáng.',
        ])->assertCreated()
            ->assertJsonPath('data.duty_type', EventDutyType::Both->value)
            ->assertJsonPath('data.volunteer_name', $user->name)
            ->assertJsonPath('data.status', 'confirmed')
            ->assertJsonPath('data.phone', '0901234567');

        $this->assertDatabaseHas('event_duty_registrations', [
            'id' => $response->json('data.id'),
            'event_id' => $event->id,
            'user_id' => $user->id,
            'duty_type' => EventDutyType::Both->value,
        ]);

        $record = $this->eventRecord($event->id, ['upcoming' => 1]);
        $this->assertSame('registered', $record['status']);
    }

    public function test_re_registering_duty_updates_the_same_registration(): void
    {
        $member = Member::query()->orderBy('id')->firstOrFail();
        $event = $this->makeEvent($member, LunarEventType::DeathAnniversary);
        $user = $this->userFor($member->family_id);
        Passport::actingAs($user);

        $first = $this->postJson("/api/v1/calendar/events/{$event->id}/register-duty", [
            'duty_type' => EventDutyType::MamCung->value,
        ])->assertCreated();

        $second = $this->postJson("/api/v1/calendar/events/{$event->id}/register-duty", [
            'duty_type' => EventDutyType::HauCan->value,
            'note' => 'Đổi sang hậu cần.',
        ])->assertCreated();

        $this->assertSame($first->json('data.id'), $second->json('data.id'));
        $this->assertSame(1, EventDutyRegistration::query()->where('event_id', $event->id)->count());
        $this->assertDatabaseHas('event_duty_registrations', [
            'event_id' => $event->id,
            'user_id' => $user->id,
            'duty_type' => EventDutyType::HauCan->value,
            'note' => 'Đổi sang hậu cần.',
        ]);
    }

    public function test_invalid_duty_type_is_rejected(): void
    {
        $member = Member::query()->orderBy('id')->firstOrFail();
        $event = $this->makeEvent($member, LunarEventType::DeathAnniversary);
        Passport::actingAs($this->userFor($member->family_id));

        $this->postJson("/api/v1/calendar/events/{$event->id}/register-duty", [
            'duty_type' => 'khong_hop_le',
        ])->assertUnprocessable();

        $this->assertDatabaseCount('event_duty_registrations', 0);
    }

    public function test_calendar_requires_authentication(): void
    {
        $this->getJson('/api/v1/calendar/events')->assertUnauthorized();
    }

    public function test_admin_can_create_and_delete_an_event(): void
    {
        $member = Member::query()->orderBy('id')->firstOrFail();
        Passport::actingAs($this->userFor($member->family_id, UserRole::Admin));

        // Client chỉ gửi ngày âm; ngày dương do backend quyết định.
        $eventId = $this->postJson('/api/v1/calendar/events', [
            'member_id' => $member->id,
            'event_type' => LunarEventType::DeathAnniversary->value,
            'lunar_day' => 29,
            'lunar_month' => 3,
            'burial_place' => 'Khu di tích gia tộc',
        ])->assertCreated()
            ->assertJsonPath('data.member_name', $member->full_name)
            ->assertJsonPath('data.lunar_month', 3)
            ->assertJsonPath('data.lunar_day', 29)
            ->json('data.id');

        $this->assertDatabaseHas('lunar_events', ['id' => $eventId, 'member_id' => $member->id]);

        $this->deleteJson("/api/v1/calendar/events/{$eventId}")->assertOk();
        $this->assertDatabaseMissing('lunar_events', ['id' => $eventId]);
    }

    public function test_created_event_derives_its_solar_date_from_the_lunar_date(): void
    {
        $member = Member::query()->orderBy('id')->firstOrFail();
        Passport::actingAs($this->userFor($member->family_id, UserRole::Admin));

        $record = $this->postJson('/api/v1/calendar/events', [
            'member_id' => $member->id,
            'event_type' => LunarEventType::BirthAnniversary->value,
            'lunar_day' => 15,
            'lunar_month' => 1,
        ])->assertCreated()->json('data');

        // Ngày dương trả về phải thực sự là mùng 15 tháng Giêng theo lịch âm.
        $lunar = LunarCalendar::toLunar(new \DateTimeImmutable($record['solar_date']));
        $this->assertSame(15, $lunar['day']);
        $this->assertSame(1, $lunar['month']);
        $this->assertSame('Rằm', $record['lunar_day_label']);
        $this->assertSame('Giêng', $record['lunar_month_name']);
    }

    public function test_client_supplied_solar_date_is_ignored(): void
    {
        $member = Member::query()->orderBy('id')->firstOrFail();
        Passport::actingAs($this->userFor($member->family_id, UserRole::Admin));

        // Gửi kèm ngày dương sai lệch để chứng minh backend bỏ qua, không tin client.
        $record = $this->postJson('/api/v1/calendar/events', [
            'member_id' => $member->id,
            'event_type' => LunarEventType::DeathAnniversary->value,
            'lunar_day' => 15,
            'lunar_month' => 1,
            'solar_date' => '2030-01-01',
        ])->assertCreated()->json('data');

        $this->assertNotSame('2030-01-01', $record['solar_date']);
        $lunar = LunarCalendar::toLunar(new \DateTimeImmutable($record['solar_date']));
        $this->assertSame(15, $lunar['day']);
        $this->assertSame(1, $lunar['month']);
    }

    public function test_member_cannot_create_event(): void
    {
        $member = Member::query()->orderBy('id')->firstOrFail();
        Passport::actingAs($this->userFor($member->family_id));

        $this->postJson('/api/v1/calendar/events', [
            'member_id' => $member->id,
            'event_type' => LunarEventType::DeathAnniversary->value,
            'lunar_day' => 1,
            'lunar_month' => 1,
        ])->assertForbidden();
    }

    // MARK: - Helpers

    private function makeEvent(Member $member, LunarEventType $type, int $lunarDay = 19, int $lunarMonth = 8): LunarEvent
    {
        /*
         * solar_date chỉ là mốc tham chiếu tại thời điểm tạo bản ghi; ngày giỗ thật
         * luôn được tính lại từ lunar_day/lunar_month. Test cố tình đặt solar_date lệch
         * với ngày âm để chứng minh API không dùng cột này khi hiển thị.
         */
        return LunarEvent::query()->create([
            'member_id' => $member->id,
            'event_type' => $type,
            'lunar_day' => $lunarDay,
            'lunar_month' => $lunarMonth,
            'solar_date' => today()->addDays(30)->toDateString(),
            'burial_place' => 'Nghĩa trang làng Trung',
            'organizer' => 'Ban Trưởng tộc',
        ]);
    }

    private function eventRecord(int $eventId, array $params): ?array
    {
        $response = $this->getJson('/api/v1/calendar/events?'.http_build_query($params))->assertOk();

        return collect($response->json('data'))->firstWhere('id', $eventId);
    }

    private function userFor(?int $familyId, UserRole $role = UserRole::Member): User
    {
        return User::query()->create([
            'name' => 'Người dùng lịch '.ucfirst($role->value),
            'email' => uniqid().'@example.test',
            'password' => 'password',
            'role' => $role,
            'family_id' => $familyId ?? Family::query()->orderBy('id')->value('id'),
        ]);
    }
}
