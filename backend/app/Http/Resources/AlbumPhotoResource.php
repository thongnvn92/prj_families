<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AlbumPhotoResource extends JsonResource
{
    public static $wrap = null;

    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'family_id' => $this->family_id,
            'title' => $this->title,
            'description' => $this->description,
            'image_url' => $this->image_url,
            'event_date' => $this->event_date?->toDateString(),
            'category' => $this->category,
            'visibility' => $this->visibility,
            'tags' => $this->tags ?? [],
            'uploaded_by' => $this->uploaded_by,
            // Guest không được thấy tên thật của người đăng; resource bỏ trống khi relation chưa load.
            'uploader_name' => $this->whenLoaded('uploader', fn () => $this->uploader?->name),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
