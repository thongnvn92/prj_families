<?php

namespace App\Support;

use App\Enums\UserRole;
use App\Models\Family;
use App\Models\Member;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class FamilyScope
{
    public static function assertCanManage(User $user, int $memberId): Member
    {
        $member = Member::query()->findOrFail($memberId);
        if ($user->role === UserRole::Admin) {
            return $member;
        }
        abort_if($user->family_id === null, 403, 'Tài khoản chưa được gán dòng họ.');

        if ((int) $member->family_id !== (int) $user->family_id) {
            abort(403, 'Bạn không được quản lý thành viên ngoài phạm vi dòng họ được giao.');
        }

        if (in_array($user->role, [UserRole::Mod, UserRole::Editor], true)) {
            abort_if($user->managed_root_member_id === null, 403, 'Tài khoản chưa được gán nhánh phụ trách.');
            abort_unless(self::descendantIds((int) $user->managed_root_member_id, (int) $user->family_id)->contains($member->id), 403, 'Thành viên nằm ngoài nhánh bạn được phụ trách.');
        }

        return $member;
    }

    public static function assertCanAccess(User $user, Member $member): void
    {
        if ($user->role === UserRole::Admin) {
            return;
        }
        abort_if($user->family_id === null, 403, 'Tài khoản chưa được gán dòng họ.');
        abort_unless((int) $member->family_id === (int) $user->family_id, 403, 'Bạn không được truy cập thành viên ngoài dòng họ.');
        if (in_array($user->role, [UserRole::Mod, UserRole::Editor], true)) {
            self::assertCanManage($user, (int) $member->id);
        }
    }

    public static function assertRelationsInFamily(array $ids, int $familyId): void
    {
        $ids = array_values(array_unique(array_filter(array_map('intval', $ids))));
        if ($ids === []) {
            return;
        }
        $count = Member::query()->whereIn('id', $ids)->where('family_id', $familyId)->count();
        abort_unless($count === count($ids), 422, 'Các thành viên quan hệ phải thuộc cùng dòng họ.');
    }

    public static function constrain(Builder $query, User $user, string $column = 'family_id', bool $restrictBranch = true): Builder
    {
        if ($user->role !== UserRole::Admin) {
            abort_if($user->family_id === null, 403, 'Tài khoản chưa được gán dòng họ.');
            $query->where($column, $user->family_id);
        }

        if ($restrictBranch && in_array($user->role, [UserRole::Mod, UserRole::Editor], true)) {
            abort_if($user->managed_root_member_id === null, 403, 'Tài khoản chưa được gán nhánh phụ trách.');
            $query->whereIn('id', self::descendantIds((int) $user->managed_root_member_id, (int) $user->family_id));
        }

        return $query;
    }

    public static function publicFamilyId(?int $requestedFamilyId = null): int
    {
        $publicFamilyId = (int) (Family::query()->orderBy('id')->value('id') ?? 1);
        abort_if($requestedFamilyId !== null && $requestedFamilyId !== $publicFamilyId, 404, 'Dòng họ không công khai.');

        return $publicFamilyId;
    }

    /**
     * Get the IDs of a managed member and all descendants.
     *
     * @return Collection<int, int>
     */
    public static function descendantIds(int $rootId, int $familyId): Collection
    {
        $rows = DB::table('members')
            ->select('id', 'father_id', 'mother_id')
            ->where('family_id', $familyId)
            ->get();
        $children = [];
        foreach ($rows as $row) {
            foreach (array_filter([$row->father_id, $row->mother_id]) as $parentId) {
                $children[(int) $parentId][] = (int) $row->id;
            }
        }
        $ids = collect([$rootId]);
        $queue = [$rootId];
        while ($queue) {
            foreach ($children[array_shift($queue)] ?? [] as $childId) {
                if (! $ids->contains($childId)) {
                    $ids->push($childId);
                    $queue[] = $childId;
                }
            }
        }

        return $ids;
    }
}
