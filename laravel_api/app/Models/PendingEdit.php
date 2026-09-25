<?php

namespace App\Models;

use App\Enums\PendingEditStatus;
use App\Enums\PendingEditType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PendingEdit extends Model
{
    use HasFactory;

    protected $fillable = [
        'requester_id', 'edit_type', 'target_member_id', 'proposed_data', 'current_data',
        'status', 'reject_reason', 'reviewer_id',
    ];

    protected function casts(): array
    {
        return [
            'edit_type' => PendingEditType::class,
            'status' => PendingEditStatus::class,
            'proposed_data' => 'array',
            'current_data' => 'array',
        ];
    }

    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requester_id');
    }

    public function targetMember(): BelongsTo
    {
        return $this->belongsTo(Member::class, 'target_member_id');
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewer_id');
    }
}
