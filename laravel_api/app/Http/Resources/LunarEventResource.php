<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LunarEventResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'member_id' => $this->member_id,
            'member_name' => $this->whenLoaded('member', fn () => $this->member?->full_name),
            'generation' => $this->whenLoaded('member', fn () => $this->member?->generation),
            'event_type' => $this->event_type,
            'lunar_day' => $this->lunar_day,
            'lunar_month' => $this->lunar_month,
            'lunar_year' => $this->lunar_year,
            'solar_date' => $this->solar_date?->toDateString(),
            'days_remaining' => now()->startOfDay()->diffInDays($this->solar_date?->startOfDay(), false),
            'burial_place' => $this->burial_place,
            'organizer' => $this->organizer,
            'status' => ((int) ($this->duty_registrations_count ?? 0)) > 0 ? 'registered' : 'upcoming',
        ];
    }
}
