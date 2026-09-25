<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ChatMessageResource extends JsonResource
{
    public static $wrap = null;

    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'group_id' => $this->group_id,
            'sender_id' => $this->sender_id,
            'sender_name' => $this->sender?->name,
            'sender_avatar' => $this->sender?->member?->avatar_url,
            'sender_role' => $this->sender?->role,
            'message_text' => $this->message_text,
            'image_url' => $this->image_url,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
