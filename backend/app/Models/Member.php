<?php

namespace App\Models;

use App\Enums\MemberGender;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Member extends Model
{
    use HasFactory;

    protected $fillable = [
        'family_id', 'full_name', 'nickname', 'role', 'gender', 'father_id', 'mother_id', 'spouse_id',
        'generation', 'order_in_family', 'is_alive', 'birth_date_solar', 'birth_day_lunar',
        'birth_month_lunar', 'birth_year_lunar', 'death_date_solar', 'death_day_lunar',
        'death_month_lunar', 'death_year_lunar', 'burial_place', 'burial_map_url', 'home_map_url',
        'bio', 'avatar_url', 'phone', 'birthplace', 'address',
    ];

    protected function casts(): array
    {
        return [
            'gender' => MemberGender::class,
            'is_alive' => 'boolean',
            'birth_date_solar' => 'date',
            'death_date_solar' => 'date',
        ];
    }

    public function family(): BelongsTo
    {
        return $this->belongsTo(Family::class);
    }

    public function father(): BelongsTo
    {
        return $this->belongsTo(self::class, 'father_id');
    }

    public function mother(): BelongsTo
    {
        return $this->belongsTo(self::class, 'mother_id');
    }

    public function spouse(): BelongsTo
    {
        return $this->belongsTo(self::class, 'spouse_id');
    }

    public function user(): HasOne
    {
        return $this->hasOne(User::class);
    }

    public function lunarEvents(): HasMany
    {
        return $this->hasMany(LunarEvent::class);
    }

    public function childrenAsFather(): HasMany
    {
        return $this->hasMany(self::class, 'father_id');
    }

    public function childrenAsMother(): HasMany
    {
        return $this->hasMany(self::class, 'mother_id');
    }
}
