<?php

namespace App\Http\Resources;

use App\Enums\UserRole;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MemberResource extends JsonResource
{
    public static $wrap = null;

    /**
     * Summary công khai: không chứa SĐT, địa chỉ, ngày chi tiết, mộ phần hoặc bản đồ.
     * Người dùng nội bộ nhận đầy đủ các trường còn lại.
     */
    public function toArray(Request $request): array
    {
        $user = $request->user();
        $role = $user?->role;
        $guest = ! $role instanceof UserRole || $role === UserRole::Guest;
        $base = [
            'id' => $this->id,
            'full_name' => $this->full_name,
            'generation' => $this->generation,
            'birth_year' => $this->birth_date_solar?->year ?? $this->birth_year_lunar,
            'death_year' => $this->death_date_solar?->year ?? $this->death_year_lunar,
            'is_alive' => $this->is_alive,
            'father_id' => $this->father_id,
            'mother_id' => $this->mother_id,
            'spouse_id' => $this->spouse_id,
            'father_name' => $this->whenLoaded('father', fn () => $this->father?->full_name),
            'mother_name' => $this->whenLoaded('mother', fn () => $this->mother?->full_name),
            'spouse_name' => $this->whenLoaded('spouse', fn () => $this->spouse?->full_name),
        ];

        if ($guest) {
            return $base;
        }

        return array_merge($base, [
            'family_id' => $this->family_id,
            'nickname' => $this->nickname,
            'role' => $this->role,
            'gender' => $this->gender,
            'order_in_family' => $this->order_in_family,
            'birth_date_solar' => $this->birth_date_solar?->toDateString(),
            'birth_day_lunar' => $this->birth_day_lunar,
            'birth_month_lunar' => $this->birth_month_lunar,
            'birth_year_lunar' => $this->birth_year_lunar,
            'death_date_solar' => $this->death_date_solar?->toDateString(),
            'death_day_lunar' => $this->death_day_lunar,
            'death_month_lunar' => $this->death_month_lunar,
            'death_year_lunar' => $this->death_year_lunar,
            'burial_place' => $this->burial_place,
            'burial_map_url' => $this->burial_map_url,
            'home_map_url' => $this->home_map_url,
            'bio' => $this->bio,
            'avatar_url' => $this->avatar_url,
            'phone' => $this->phone,
            'address' => $this->address,
        ]);
    }
}
