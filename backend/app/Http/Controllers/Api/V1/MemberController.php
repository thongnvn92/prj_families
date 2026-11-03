<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\MemberGender;
use App\Http\Controllers\Controller;
use App\Http\Resources\MemberResource;
use App\Models\Member;
use App\Support\FamilyScope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class MemberController extends Controller
{
    public function index(Request $request)
    {
        $filters = $request->validate([
            'query' => ['nullable', 'string', 'max:100'],
            'search' => ['nullable', 'string', 'max:100'],
            'generation' => ['nullable', 'integer', 'min:1'],
            'gender' => ['nullable', Rule::enum(MemberGender::class)],
            'status' => ['nullable', Rule::in(['alive', 'deceased'])],
            'is_alive' => ['nullable', 'boolean'],
            'family_id' => ['nullable', 'integer', 'exists:families,id'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);
        $user = $request->user();
        $guest = ! $user || $user->role->value === 'guest';
        $query = Member::query()->with(['father:id,full_name', 'mother:id,full_name', 'spouse:id,full_name', 'spouses:id,full_name']);
        if ($user && ! $guest) {
            FamilyScope::constrain($query, $user);
        } else {
            $query->where('family_id', FamilyScope::publicFamilyId(isset($filters['family_id']) ? (int) $filters['family_id'] : null));
        }
        $search = trim($filters['search'] ?? $filters['query'] ?? '');
        if ($search !== '') {
            $this->applySearch($query, $search, $guest);
        }
        $query->when(isset($filters['generation']), fn (Builder $builder) => $builder->where('generation', $filters['generation']))
            ->when(isset($filters['gender']), fn (Builder $builder) => $builder->where('gender', $filters['gender']))
            ->when(($filters['status'] ?? null) === 'alive', fn (Builder $builder) => $builder->where('is_alive', true))
            ->when(($filters['status'] ?? null) === 'deceased', fn (Builder $builder) => $builder->where('is_alive', false))
            ->when(array_key_exists('is_alive', $filters), fn (Builder $builder) => $builder->where('is_alive', $filters['is_alive']));

        return MemberResource::collection($query->orderBy('generation')->orderBy('order_in_family')->orderBy('full_name')->paginate($filters['per_page'] ?? 20));
    }

    public function show(Request $request, Member $member): MemberResource
    {
        $user = $request->user();

        if ($user && $user->role->value !== 'guest') {
            FamilyScope::assertCanManage($user, $member->id);
        } else {
            $familyId = FamilyScope::publicFamilyId($request->integer('family_id') ?: null);
            abort_unless((int) $member->family_id === $familyId, 404);
        }

        return new MemberResource($member->load(['father:id,full_name', 'mother:id,full_name', 'spouse:id,full_name', 'spouses:id,full_name']));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validated($request, true);
        $familyId = $request->user()->role->value === 'admin' ? $data['family_id'] : $request->user()->family_id;
        abort_if(! $familyId, 422, 'Tài khoản chưa được gán dòng họ.');
        $member = DB::transaction(function () use ($data, $familyId): Member {
            $normalized = $this->normalize($data, (int) $familyId, null);
            $spouseIds = $normalized['spouse_ids'];
            unset($normalized['spouse_ids']);
            $member = Member::query()->create($normalized);
            $this->syncSpouses($member, $spouseIds);

            return $member;
        });

        return response()->json(['data' => new MemberResource($member->load('spouses'))], 201);
    }

    public function update(Request $request, Member $member): MemberResource
    {
        FamilyScope::assertCanManage($request->user(), $member->id);
        DB::transaction(function () use ($request, $member): void {
            $normalized = $this->normalize($this->validated($request), (int) $member->family_id, (int) $member->id);
            $spouseIds = $normalized['spouse_ids'];
            unset($normalized['spouse_ids']);
            $member->update($normalized);
            $this->syncSpouses($member, $spouseIds);
        });

        return new MemberResource($member->fresh(['father', 'mother', 'spouse', 'spouses']));
    }

    public function destroy(Request $request, Member $member): JsonResponse
    {
        FamilyScope::assertCanManage($request->user(), $member->id);
        if ($member->childrenAsFather()->exists() || $member->childrenAsMother()->exists()) {
            return response()->json(['message' => 'Không thể xóa thành viên đã có nhánh con. Vui lòng cập nhật lại mối quan hệ của các con trước.'], 409);
        }
        DB::transaction(function () use ($member): void {
            Member::query()->where('spouse_id', $member->id)->update(['spouse_id' => null]);
            $member->delete();
        });

        return response()->json(['message' => 'Đã xóa thành viên.']);
    }

    private function applySearch(Builder $query, string $search, bool $guest): void
    {
        $query->where(function (Builder $builder) use ($search, $guest): void {
            $builder->where('full_name', 'like', "%{$search}%");
            if (! $guest) {
                $builder->orWhere('nickname', 'like', "%{$search}%")->orWhere('phone', 'like', "%{$search}%");
            }
        });
    }

    private function validated(Request $request, bool $creating = false): array
    {
        return $request->validate([
            'family_id' => [$creating && $request->user()->role->value === 'admin' ? 'required' : 'prohibited', 'integer', 'exists:families,id'],
            'full_name' => ['required', 'string', 'max:255'],
            'nickname' => ['nullable', 'string', 'max:100'],
            'role' => ['nullable', 'string', 'max:100'],
            'gender' => ['required', Rule::enum(MemberGender::class)],
            'father_id' => ['nullable', 'integer', Rule::exists('members', 'id')],
            'mother_id' => ['nullable', 'integer', 'different:father_id', Rule::exists('members', 'id')],
            'spouse_id' => ['nullable', 'integer', Rule::exists('members', 'id')],
            'spouse_ids' => ['sometimes', 'array', 'max:50'],
            'spouse_ids.*' => ['required', 'integer', 'distinct', Rule::exists('members', 'id')],
            'generation' => ['required', 'integer', 'min:1', 'max:100'],
            'order_in_family' => ['nullable', 'integer', 'min:1'],
            'is_alive' => ['required', 'boolean'],
            'birth_date_solar' => ['nullable', 'date'],
            'birth_day_lunar' => ['nullable', 'integer', 'between:1,30'],
            'birth_month_lunar' => ['nullable', 'integer', 'between:1,12'],
            'birth_year_lunar' => ['nullable', 'integer', 'min:1800', 'max:2200'],
            'death_date_solar' => ['nullable', 'date', 'after_or_equal:birth_date_solar'],
            'death_day_lunar' => ['nullable', 'integer', 'between:1,30'],
            'death_month_lunar' => ['nullable', 'integer', 'between:1,12'],
            'death_year_lunar' => ['nullable', 'integer', 'min:1800', 'max:2200'],
            'burial_place' => ['nullable', 'string', 'max:255'],
            'burial_map_url' => ['nullable', 'url', 'max:2000'],
            'home_map_url' => ['nullable', 'url', 'max:2000'],
            'bio' => ['nullable', 'string', 'max:10000'],
            'avatar_url' => ['nullable', 'url', 'max:2000'],
            'phone' => ['nullable', 'string', 'max:30'],
            'birthplace' => ['nullable', 'string', 'max:255'],
            'address' => ['nullable', 'string', 'max:1000'],
        ]);
    }

    private function normalize(array $data, int $familyId, ?int $memberId): array
    {
        $spouseIds = array_key_exists('spouse_ids', $data)
            ? $data['spouse_ids']
            : (array_key_exists('spouse_id', $data)
                ? ($data['spouse_id'] !== null ? [$data['spouse_id']] : [])
                : ($memberId ? DB::table('member_spouses')->where('member_id', $memberId)->pluck('spouse_id')->all() : []));
        $spouseIds = array_values(array_unique(array_map('intval', $spouseIds)));
        unset($data['spouse_id']);
        $data['spouse_ids'] = $spouseIds;

        if ($memberId === null) {
            $data['family_id'] = $familyId;
        }
        $parentIds = array_values(array_filter([$data['father_id'] ?? null, $data['mother_id'] ?? null]));
        $parents = Member::query()->whereIn('id', $parentIds)->where('family_id', $familyId)->get(['id', 'generation']);
        abort_if($parents->count() !== count($parentIds), 422, 'Cha/Mẹ phải thuộc cùng dòng họ.');
        if ($parents->isNotEmpty()) {
            $data['generation'] = $parents->max('generation') + 1;
        }
        $spouses = Member::query()->whereIn('id', $spouseIds)->where('family_id', $familyId)->get(['id']);
        abort_if($spouses->count() !== count($spouseIds), 422, 'Phối ngẫu phải thuộc cùng dòng họ.');
        if ($memberId) {
            $relationIds = array_merge(array_filter([$data['father_id'] ?? null, $data['mother_id'] ?? null]), $spouseIds);
            abort_if(in_array($memberId, $relationIds, true), 422, 'Không thể tự liên kết quan hệ gia đình.');
        }

        return $data;
    }

    private function syncSpouses(Member $member, array $spouseIds): void
    {
        $spouseIds = array_values(array_diff($spouseIds, [$member->id]));
        $existingIds = DB::table('member_spouses')
            ->where('member_id', $member->id)
            ->orWhere('spouse_id', $member->id)
            ->get(['member_id', 'spouse_id'])
            ->flatMap(fn ($row) => [$row->member_id, $row->spouse_id])
            ->filter(fn ($id) => (int) $id !== $member->id)
            ->unique()
            ->map(fn ($id) => (int) $id)
            ->all();

        foreach (array_diff($existingIds, $spouseIds) as $removedId) {
            DB::table('member_spouses')
                ->where(fn ($query) => $query->where('member_id', $member->id)->where('spouse_id', $removedId))
                ->orWhere(fn ($query) => $query->where('member_id', $removedId)->where('spouse_id', $member->id))
                ->delete();
        }
        if ($existingIds !== []) {
            Member::query()
                ->whereIn('id', array_diff($existingIds, $spouseIds))
                ->where('spouse_id', $member->id)
                ->update(['spouse_id' => null]);
        }

        foreach ($spouseIds as $spouseId) {
            DB::table('member_spouses')->insertOrIgnore([
                ['member_id' => $member->id, 'spouse_id' => $spouseId],
                ['member_id' => $spouseId, 'spouse_id' => $member->id],
            ]);
        }

        $member->forceFill(['spouse_id' => $spouseIds[0] ?? null])->save();
    }
}
