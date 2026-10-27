<?php

namespace App\Services;

use App\Enums\PendingEditStatus;
use App\Enums\PendingEditType;
use App\Models\Member;
use App\Models\PendingEdit;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class PendingEditService
{
    public function approve(PendingEdit $edit, User $reviewer): PendingEdit
    {
        return DB::transaction(function () use ($edit, $reviewer): PendingEdit {
            $locked = PendingEdit::query()->lockForUpdate()->findOrFail($edit->id);
            if ($locked->status !== PendingEditStatus::Pending) {
                throw ValidationException::withMessages(['status' => 'Đề xuất đã được xử lý.']);
            }

            $this->apply($locked);
            $locked->update([
                'status' => PendingEditStatus::Approved,
                'reviewer_id' => $reviewer->id,
                'reject_reason' => null,
            ]);

            return $locked->fresh(['requester', 'targetMember', 'reviewer']);
        });
    }

    public function reject(PendingEdit $edit, User $reviewer, string $reason): PendingEdit
    {
        $reason = trim($reason);
        if ($reason === '') {
            throw ValidationException::withMessages(['reason' => 'Vui lòng nhập lý do từ chối.']);
        }

        return DB::transaction(function () use ($edit, $reviewer, $reason): PendingEdit {
            $locked = PendingEdit::query()->lockForUpdate()->findOrFail($edit->id);
            if ($locked->status !== PendingEditStatus::Pending) {
                throw ValidationException::withMessages(['status' => 'Đề xuất đã được xử lý.']);
            }

            $locked->update([
                'status' => PendingEditStatus::Rejected,
                'reviewer_id' => $reviewer->id,
                'reject_reason' => $reason,
            ]);

            return $locked->fresh(['requester', 'targetMember', 'reviewer']);
        });
    }

    private function apply(PendingEdit $edit): void
    {
        $target = $edit->targetMember;
        if (! $target) {
            throw ValidationException::withMessages(['target_member_id' => 'Thành viên tác động không còn tồn tại.']);
        }

        $data = is_array($edit->proposed_data) ? $edit->proposed_data : [];
        match ($edit->edit_type) {
            PendingEditType::UpdateInfo => $this->applyUpdateInfo($target, $data),
            PendingEditType::AddSpouse => $this->applyAddSpouse($target, $data),
            PendingEditType::AddChild => $this->applyAddChild($target, $data),
        };
    }

    private function applyUpdateInfo(Member $target, array $data): void
    {
        $allowed = [
            'nickname', 'role', 'phone', 'birthplace', 'address', 'bio', 'burial_place',
            'burial_map_url', 'home_map_url', 'avatar_url', 'birth_date_solar',
            'death_date_solar', 'birth_day_lunar', 'birth_month_lunar',
            'birth_year_lunar', 'death_day_lunar', 'death_month_lunar',
            'death_year_lunar',
        ];
        $target->update(array_intersect_key($data, array_flip($allowed)));
    }

    private function applyAddSpouse(Member $target, array $data): void
    {
        $spouseId = (int) ($data['spouse_id'] ?? 0);
        if ($spouseId < 1 || $spouseId === $target->id) {
            throw ValidationException::withMessages(['proposed_data.spouse_id' => 'Chọn phối ngẫu hợp lệ khác thành viên hiện tại.']);
        }

        $spouse = Member::query()->whereKey($spouseId)->where('family_id', $target->family_id)->first();
        if (! $spouse) {
            throw ValidationException::withMessages(['proposed_data.spouse_id' => 'Phối ngẫu phải thuộc cùng dòng họ.']);
        }
        if ($target->spouse_id && (int) $target->spouse_id !== $spouse->id) {
            throw ValidationException::withMessages(['proposed_data.spouse_id' => 'Thành viên đang có phối ngẫu khác.']);
        }
        if ($spouse->spouse_id && (int) $spouse->spouse_id !== $target->id) {
            throw ValidationException::withMessages(['proposed_data.spouse_id' => 'Thành viên được chọn đang có phối ngẫu khác.']);
        }

        $target->update(['spouse_id' => $spouse->id]);
        $spouse->update(['spouse_id' => $target->id]);
    }

    private function applyAddChild(Member $target, array $data): void
    {
        $allowed = [
            'full_name', 'nickname', 'role', 'gender', 'is_alive',
            'birth_date_solar', 'birth_day_lunar', 'birth_month_lunar',
            'birth_year_lunar', 'death_date_solar', 'death_day_lunar',
            'death_month_lunar', 'death_year_lunar', 'burial_place',
            'burial_map_url', 'home_map_url', 'bio', 'avatar_url', 'phone',
            'birthplace', 'address', 'order_in_family',
        ];
        $childData = array_intersect_key($data, array_flip($allowed));
        $fatherId = (int) ($data['father_id'] ?? $target->id);
        $motherId = isset($data['mother_id']) && $data['mother_id'] !== null ? (int) $data['mother_id'] : null;
        $parentIds = array_values(array_filter([$fatherId, $motherId]));
        $parents = Member::query()->whereIn('id', $parentIds)->where('family_id', $target->family_id)->get();
        if ($parents->count() !== count(array_unique($parentIds))) {
            throw ValidationException::withMessages(['proposed_data' => 'Cha/mẹ phải thuộc cùng dòng họ.']);
        }
        if ($fatherId === $motherId) {
            throw ValidationException::withMessages(['proposed_data.mother_id' => 'Cha và mẹ không thể là cùng một thành viên.']);
        }

        $childData['family_id'] = $target->family_id;
        $childData['father_id'] = $fatherId;
        $childData['mother_id'] = $motherId;
        $childData['generation'] = ($parents->max('generation') ?? $target->generation) + 1;
        $childData['order_in_family'] = 1 + (int) Member::query()
            ->where('family_id', $target->family_id)
            ->where('generation', $childData['generation'])
            ->max('order_in_family');
        Member::query()->create($childData);
    }
}
