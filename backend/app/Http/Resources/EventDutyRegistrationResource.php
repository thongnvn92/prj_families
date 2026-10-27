<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EventDutyRegistrationResource extends JsonResource
{
    public static $wrap = null;

    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'event_id' => $this->event_id,
            'user_id' => $this->user_id,
            // member_id và volunteer_name lấy từ user đăng ký; frontend hiển thị tên người phụ trách.
            'member_id' => $this->user_id,
            'volunteer_name' => $this->whenLoaded('user', fn () => $this->user?->name),
            'duty_type' => $this->duty_type,
            'phone' => $this->phone,
            'note' => $this->note,
            // Endpoint dùng updateOrCreate nên mọi đăng ký đều được xác nhận ngay.
            'status' => 'confirmed',
            'registered_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
