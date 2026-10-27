<?php

namespace App\Models;

use App\Enums\PrayerCategory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Prayer extends Model
{
    use HasFactory;

    protected $fillable = ['family_id', 'title', 'category', 'content', 'author_id'];

    protected function casts(): array
    {
        return ['category' => PrayerCategory::class];
    }

    public function family(): BelongsTo
    {
        return $this->belongsTo(Family::class);
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'author_id');
    }
}
