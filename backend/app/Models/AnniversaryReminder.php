<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Lịch sử đã nhắc giỗ. Unique (lunar_event_id, reminded_for) nên job có thể chạy
 * lại an toàn mà không gửi trùng.
 */
class AnniversaryReminder extends Model
{
    use HasFactory;

    protected $fillable = [
        'lunar_event_id',
        'reminded_for',
        'reminded_at',
        'recipients_count',
    ];

    protected function casts(): array
    {
        return [
            'reminded_for' => 'date',
            'reminded_at' => 'datetime',
            'recipients_count' => 'integer',
        ];
    }

    public function event(): BelongsTo
    {
        return $this->belongsTo(LunarEvent::class, 'lunar_event_id');
    }
}
