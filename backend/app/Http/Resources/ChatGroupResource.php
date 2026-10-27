<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ChatGroupResource extends JsonResource
{
    public static $wrap = null;

    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'family_id' => $this->family_id,
            'name' => $this->name,
            'type' => $this->type,
            'member_count' => $this->whenCounted('members'),
            'last_message' => $this->last_message ?? null,
            'unread_count' => 0,
            'avatar_url' => $this->whenLoaded('creator', fn () => $this->creator?->member?->avatar_url),
            'creator_role' => $this->whenLoaded('creator', fn () => $this->creator?->role),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
