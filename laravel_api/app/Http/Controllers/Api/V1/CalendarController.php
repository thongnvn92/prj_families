<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\EventDutyType;
use App\Enums\LunarEventType;
use App\Http\Controllers\Controller;
use App\Http\Resources\LunarEventResource;
use App\Models\EventDutyRegistration;
use App\Models\LunarEvent;
use App\Models\Member;
use App\Support\FamilyScope;
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
        if (($filters['upcoming'] ?? false)) {
            $query->whereDate('solar_date', '>=', today());
        }
        if (isset($filters['year'])) {
            $query->whereYear('solar_date', $filters['year']);
            if (isset($filters['month'])) {
                $query->whereMonth('solar_date', $filters['month']);
            }
        }

        return LunarEventResource::collection($query->orderBy('solar_date')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'member_id' => ['required', 'integer', 'exists:members,id'],
            'event_type' => ['required', Rule::enum(LunarEventType::class)],
            'lunar_day' => ['required', 'integer', 'between:1,30'],
            'lunar_month' => ['required', 'integer', 'between:1,12'],
            'lunar_year' => ['nullable', 'integer'],
            'solar_date' => ['required', 'date'],
            'burial_place' => ['nullable', 'string', 'max:255'],
            'organizer' => ['nullable', 'string', 'max:255'],
        ]);
        FamilyScope::assertCanManage($request->user(), (int) $data['member_id']);
        $event = LunarEvent::query()->create($data);

        return response()->json(['data' => new LunarEventResource($event->load('member')->loadCount('dutyRegistrations'))], 201);
    }

    public function registerDuty(Request $request, LunarEvent $event): JsonResponse
    {
        abort_unless($this->sameFamily($request, $event), 403);
        $data = $request->validate([
            'duty_type' => ['required', Rule::enum(EventDutyType::class)],
            'note' => ['nullable', 'string', 'max:2000'],
        ]);
        $registration = EventDutyRegistration::query()->updateOrCreate(
            ['event_id' => $event->id, 'user_id' => $request->user()->id],
            ['duty_type' => $data['duty_type'], 'note' => $data['note'] ?? null],
        );

        return response()->json(['data' => $registration, 'message' => 'Đã đăng ký nhiệm vụ thành công.'], 201);
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
