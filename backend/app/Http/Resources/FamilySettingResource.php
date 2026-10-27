<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FamilySettingResource extends JsonResource
{
    public static $wrap = null;

    public function toArray(Request $request): array
    {
        return [
            'family_id' => $this->family_id,
            'chat_enabled' => (bool) $this->chat_enabled,
            'image_upload_roles' => array_values($this->image_upload_roles ?? []),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
