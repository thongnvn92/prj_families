<?php

namespace App\Models;

use App\Enums\EventDutyType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EventDutyRegistration extends Model
{
    use HasFactory;

    protected $fillable = ['event_id', 'user_id', 'duty_type', 'phone', 'note'];

    protected function casts(): array
    {
        return ['duty_type' => EventDutyType::class];
    }

    public function event(): BelongsTo
    {
        return $this->belongsTo(LunarEvent::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
