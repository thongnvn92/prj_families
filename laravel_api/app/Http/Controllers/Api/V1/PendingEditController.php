<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\MemberGender;
use App\Enums\PendingEditType;
use App\Http\Controllers\Controller;
use App\Http\Resources\PendingEditResource;
use App\Models\Member;
use App\Models\PendingEdit;
use App\Services\PendingEditService;
use App\Support\FamilyScope;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class PendingEditController extends Controller
{
    public function index(Request $request)
    {
        $filters = $request->validate(['status' => ['nullable', Rule::in(['pending', 'approved', 'rejected'])]]);
        $query = PendingEdit::query()->with(['requester:id,name,role', 'targetMember:id,full_name'])->latest();
        if ($request->user()->role->value !== 'admin') {
            $query->whereHas('targetMember', fn ($memberQuery) => FamilyScope::constrain($memberQuery, $request->user()));
        }

        return PendingEditResource::collection($query->when(isset($filters['status']), fn ($builder) => $builder->where('status', $filters['status']))->get());
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'edit_type' => ['required', Rule::enum(PendingEditType::class)],
            'target_member_id' => ['required', 'integer', 'exists:members,id'],
            'proposed_data' => ['required', 'array'],
            'proposed_data.nickname' => ['nullable', 'string', 'max:100'],
            'proposed_data.role' => ['nullable', 'string', 'max:100'],
            'proposed_data.phone' => ['nullable', 'string', 'max:30'],
            'proposed_data.address' => ['nullable', 'string', 'max:1000'],
            'proposed_data.bio' => ['nullable', 'string', 'max:10000'],
            'proposed_data.burial_place' => ['nullable', 'string', 'max:255'],
            'proposed_data.burial_map_url' => ['nullable', 'url', 'max:2000'],
            'proposed_data.home_map_url' => ['nullable', 'url', 'max:2000'],
            'proposed_data.avatar_url' => ['nullable', 'url', 'max:2000'],
            'proposed_data.birth_date_solar' => ['nullable', 'date'],
            'proposed_data.death_date_solar' => ['nullable', 'date', 'after_or_equal:proposed_data.birth_date_solar'],
            'proposed_data.birth_day_lunar' => ['nullable', 'integer', 'between:1,30'],
            'proposed_data.birth_month_lunar' => ['nullable', 'integer', 'between:1,12'],
            'proposed_data.birth_year_lunar' => ['nullable', 'integer', 'between:1800,2200'],
            'proposed_data.death_day_lunar' => ['nullable', 'integer', 'between:1,30'],
            'proposed_data.death_month_lunar' => ['nullable', 'integer', 'between:1,12'],
            'proposed_data.death_year_lunar' => ['nullable', 'integer', 'between:1800,2200'],
            'proposed_data.full_name' => ['required_if:edit_type,add_child', 'nullable', 'string', 'max:255'],
            'proposed_data.gender' => ['required_if:edit_type,add_child', 'nullable', Rule::enum(MemberGender::class)],
            'proposed_data.is_alive' => ['required_if:edit_type,add_child', 'nullable', 'boolean'],
            'proposed_data.order_in_family' => ['nullable', 'integer', 'min:1'],
            'proposed_data.father_id' => ['nullable', 'integer', 'exists:members,id'],
            'proposed_data.mother_id' => ['nullable', 'integer', 'different:proposed_data.father_id', 'exists:members,id'],
            'proposed_data.spouse_id' => ['required_if:edit_type,add_spouse', 'nullable', 'integer', 'exists:members,id'],
        ]);
        $proposedData = $request->input('proposed_data', []);
        $allowedFields = match ($data['edit_type']) {
            'update_info' => ['nickname', 'role', 'phone', 'address', 'bio', 'burial_place', 'burial_map_url', 'home_map_url', 'avatar_url', 'birth_date_solar', 'death_date_solar', 'birth_day_lunar', 'birth_month_lunar', 'birth_year_lunar', 'death_day_lunar', 'death_month_lunar', 'death_year_lunar'],
            'add_child' => ['full_name', 'nickname', 'role', 'gender', 'is_alive', 'birth_date_solar', 'death_date_solar', 'birth_day_lunar', 'birth_month_lunar', 'birth_year_lunar', 'death_day_lunar', 'death_month_lunar', 'death_year_lunar', 'burial_place', 'burial_map_url', 'home_map_url', 'bio', 'avatar_url', 'phone', 'address', 'order_in_family', 'father_id', 'mother_id'],
            'add_spouse' => ['spouse_id'],
        };
        $unsupportedFields = array_values(array_diff(array_keys($proposedData), $allowedFields));
        if ($proposedData === [] || $unsupportedFields !== []) {
            throw ValidationException::withMessages(['proposed_data' => $unsupportedFields === [] ? 'Đề xuất chưa có thông tin cần cập nhật.' : 'Đề xuất chứa trường không được phép: '.implode(', ', $unsupportedFields).'.']);
        }
        $proposedData = array_intersect_key($proposedData, array_flip($allowedFields));
        $target = Member::query()->findOrFail($data['target_member_id']);
        $this->assertFamily($request, $target);
        $edit = PendingEdit::query()->create([
            'requester_id' => $request->user()->id,
            'edit_type' => $data['edit_type'],
            'target_member_id' => $target->id,
            'proposed_data' => $proposedData,
            'current_data' => $target->only(array_keys($proposedData)),
        ]);

        return response()->json(['data' => new PendingEditResource($edit->refresh()->load(['requester', 'targetMember']))], 201);
    }

    public function approve(Request $request, PendingEdit $edit, PendingEditService $service): JsonResponse
    {
        $this->assertReviewer($request, $edit);

        return response()->json(['data' => new PendingEditResource($service->approve($edit, $request->user()))]);
    }

    public function reject(Request $request, PendingEdit $edit, PendingEditService $service): JsonResponse
    {
        $this->assertReviewer($request, $edit);
        $data = $request->validate(['reason' => ['required', 'string', 'min:8', 'max:2000']]);

        return response()->json(['data' => new PendingEditResource($service->reject($edit, $request->user(), $data['reason']))]);
    }

    private function assertFamily(Request $request, Member $member): void
    {
        FamilyScope::assertCanAccess($request->user(), $member);
    }

    private function assertReviewer(Request $request, PendingEdit $edit): void
    {
        abort_unless($edit->targetMember, 422, 'Đề xuất không còn thành viên tác động.');
        $this->assertFamily($request, $edit->targetMember);
    }
}
