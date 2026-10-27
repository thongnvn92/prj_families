<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PendingEditResource extends JsonResource
{
    public static $wrap = null;

    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'requester_id' => $this->requester_id,
            'requester_name' => $this->requester?->name,
            'requester_role' => $this->requester?->role,
            'edit_type' => $this->edit_type,
            'target_member_id' => $this->target_member_id,
            'target_member_name' => $this->targetMember?->full_name,
            'proposed_data' => $this->proposed_data,
            'current_data' => $this->current_data,
            'status' => $this->status,
            'reject_reason' => $this->reject_reason,
            'reviewer_id' => $this->reviewer_id,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
