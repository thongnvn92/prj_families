<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\EventDutyType;
use App\Enums\LunarEventType;
use App\Http\Controllers\Controller;
use App\Http\Resources\EventDutyRegistrationResource;
use App\Http\Resources\LunarEventResource;
use App\Models\EventDutyRegistration;
use App\Models\LunarEvent;
use App\Models\Member;
use App\Support\FamilyScope;
use App\Support\LunarCalendar;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CalendarController extends Controller
{
    public function index(Request $request)
    {
        $filters = $request->validate([
            'year' => ['nullable', 'integer', 'min:1900', 'max:2200'],
            'month' => ['nullable', 'integer', 'between:1,12'],
            'member_id' => ['nullable', 'integer', 'exists:members,id'],
            'event_type' => ['nullable', Rule::enum(LunarEventType::class)],
            'upcoming' => ['nullable', 'boolean'],
        ]);
        $query = LunarEvent::query()->with(['member:id,full_name,generation'])->withCount('dutyRegistrations');
        if ($request->user()->role->value !== 'admin') {
            $query->whereHas('member', fn ($memberQuery) => FamilyScope::constrain($memberQuery, $request->user()));
        }
        if (isset($filters['member_id'])) {
            $query->where('member_id', $filters['member_id']);
        }
        if (isset($filters['event_type'])) {
            $query->where('event_type', $filters['event_type']);
        }

        $events = $query->get();

        /*
         * Ngày giỗ phải được tính lại từ ngày âm mỗi năm, không dùng cột solar_date
         * (đó chỉ là ngày dương tại thời điểm tạo bản ghi). Vì vậy bộ lọc theo
         * năm/tháng/upcoming diễn ra trên ngày giỗ đã tính, không lọc trong SQL.
         *
         * Lưu ý: rule 'integer' của Laravel chỉ kiểm tra mà KHÔNG ép kiểu, nên giá trị
         * từ query string vẫn là string — phải ép kiểu tường minh trước khi so sánh.
         */
        $events = $events->map(function (LunarEvent $event) use ($filters) {
            $occurrence = isset($filters['year'])
                ? $event->occurrenceInYear((int) $filters['year'])
                : $event->nextOccurrence();
            $event->occurrence_date = $occurrence;

            return $event;
        })->filter(function (LunarEvent $event) use ($filters): bool {
            $occurrence = $event->occurrence_date;
            if (! $occurrence instanceof \DateTimeInterface) {
                return false;
            }
            if (isset($filters['month']) && (int) $occurrence->format('n') !== (int) $filters['month']) {
                return false;
            }
            if (($filters['upcoming'] ?? false) && $occurrence->startOfDay() < today()->startOfDay()) {
                return false;
            }

            return true;
        })->sortBy(fn (LunarEvent $event) => $event->occurrence_date->format('Y-m-d'))
            ->values();

        return LunarEventResource::collection($events);
    }

    /**
     * Lịch âm của một tháng dương để frontend vẽ nhãn ngày âm lên từng ô.
     *
     * Nhãn được tính ở backend (LunarCalendar) nên frontend không cần cài thuật toán
     * âm lịch và không thể tự tính sai lệch với ngày giỗ.
     */
    public function lunarMonth(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'year' => ['required', 'integer', 'min:1900', 'max:2200'],
            'month' => ['required', 'integer', 'between:1,12'],
        ]);
        $year = (int) $filters['year'];
        $month = (int) $filters['month'];
        $daysInMonth = (int) cal_days_in_month(CAL_GREGORIAN, $month, $year);

        $days = [];
        for ($day = 1; $day <= $daysInMonth; $day++) {
            $solar = CarbonImmutable::createFromFormat('Y-m-d', sprintf('%04d-%02d-%02d', $year, $month, $day));
            $lunar = LunarCalendar::toLunar($solar);
            $days[] = [
                'date' => $solar->format('Y-m-d'),
                'day_label' => $lunar['dayLabel'],
                'month_name' => $lunar['monthName'],
                'lunar_month' => $lunar['month'],
                'is_leap_month' => $lunar['isLeapMonth'],
            ];
        }

        return response()->json(['data' => [
            'year' => $year,
            'month' => $month,
            'is_leap_month' => $days !== [] && $days[0]['is_leap_month'],
            'days' => $days,
        ]]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'member_id' => ['required', 'integer', 'exists:members,id'],
            'event_type' => ['required', Rule::enum(LunarEventType::class)],
            'lunar_day' => ['required', 'integer', 'between:1,30'],
            'lunar_month' => ['required', 'integer', 'between:1,12'],
            'lunar_year' => ['nullable', 'integer'],
            'burial_place' => ['nullable', 'string', 'max:255'],
            'organizer' => ['nullable', 'string', 'max:255'],
        ]);
        FamilyScope::assertCanManage($request->user(), (int) $data['member_id']);

        /*
         * Ngày dương do backend quyết định từ ngày âm, không nhận từ client: nhập sai
         * ngày dương sẽ khiến toàn bộ lần giỗ của các năm sau bị lệch. Cột solar_date
         * lưu ngày dương của năm hiện tại làm mốc tham chiếu; các năm sau được tính lại.
         */
        $lunarDay = (int) $data['lunar_day'];
        $lunarMonth = (int) $data['lunar_month'];
        $solarDate = LunarCalendar::anniversaryInYear($lunarDay, $lunarMonth, (int) now()->year)
            ?? LunarCalendar::anniversaryInYear($lunarDay, $lunarMonth, (int) now()->year + 1);
        abort_if(
            $solarDate === null,
            422,
            "Ngày âm {$lunarDay}/{$lunarMonth} không tồn tại trong khoảng năm hiện tại và năm sau.",
        );

        $event = LunarEvent::query()->create([
            ...$data,
            'solar_date' => $solarDate->format('Y-m-d'),
        ]);
        $event->occurrence_date = $solarDate;

        return response()->json(['data' => new LunarEventResource($event->load('member')->loadCount('dutyRegistrations'))], 201);
    }

    public function registerDuty(Request $request, LunarEvent $event): JsonResponse
    {
        abort_unless($this->sameFamily($request, $event), 403);
        $data = $request->validate([
            'duty_type' => ['required', Rule::enum(EventDutyType::class)],
            'phone' => ['nullable', 'string', 'max:30'],
            'note' => ['nullable', 'string', 'max:2000'],
        ]);
        $registration = EventDutyRegistration::query()->updateOrCreate(
            ['event_id' => $event->id, 'user_id' => $request->user()->id],
            ['duty_type' => $data['duty_type'], 'phone' => $data['phone'] ?? null, 'note' => $data['note'] ?? null],
        );

        return response()->json([
            'data' => new EventDutyRegistrationResource($registration->load('user:id,name')),
            'message' => 'Đã đăng ký nhiệm vụ thành công.',
        ], 201);
    }

    public function destroy(Request $request, LunarEvent $event): JsonResponse
    {
        FamilyScope::assertCanManage($request->user(), $event->member_id);
        $event->delete();

        return response()->json(['message' => 'Đã xóa sự kiện.']);
    }

    private function sameFamily(Request $request, LunarEvent $event): bool
    {
        $user = $request->user();
        if ($user->role->value === 'admin') {
            return true;
        }
        $member = Member::query()->findOrFail($event->member_id);
        FamilyScope::assertCanAccess($user, $member);

        return true;
    }
}
