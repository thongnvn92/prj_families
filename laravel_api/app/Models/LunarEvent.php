<?php

namespace App\Models;

use App\Enums\LunarEventType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LunarEvent extends Model
{
    use HasFactory;

    protected $fillable = [
        'member_id', 'event_type', 'lunar_day', 'lunar_month', 'lunar_year',
        'solar_date', 'burial_place', 'organizer',
    ];

    protected function casts(): array
    {
        return [
            'event_type' => LunarEventType::class,
            'solar_date' => 'date',
        ];
    }

    public function member(): BelongsTo
    {
        return $this->belongsTo(Member::class);
    }

    public function dutyRegistrations(): HasMany
    {
        return $this->hasMany(EventDutyRegistration::class, 'event_id');
    }
}
