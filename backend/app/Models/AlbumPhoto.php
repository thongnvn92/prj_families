<?php

namespace App\Models;

use App\Enums\PhotoCategory;
use App\Enums\PhotoVisibility;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AlbumPhoto extends Model
{
    use HasFactory;

    protected $fillable = [
        'family_id', 'title', 'description', 'image_url', 'event_date', 'category', 'visibility', 'uploaded_by', 'tags',
    ];

    protected function casts(): array
    {
        return [
            'event_date' => 'date',
            'category' => PhotoCategory::class,
            'visibility' => PhotoVisibility::class,
            'tags' => 'array',
        ];
    }

    public function family(): BelongsTo
    {
        return $this->belongsTo(Family::class);
    }

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
}
