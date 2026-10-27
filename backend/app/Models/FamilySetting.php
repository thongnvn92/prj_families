<?php

namespace App\Models;

use App\Enums\UserRole;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FamilySetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'family_id',
        'chat_enabled',
        'image_upload_roles',
        'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'chat_enabled' => 'boolean',
            'image_upload_roles' => 'array',
        ];
    }

    public function family(): BelongsTo
    {
        return $this->belongsTo(Family::class);
    }

    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function allowsImageUpload(UserRole $role): bool
    {
        return in_array($role->value, $this->image_upload_roles ?? [], true);
    }
}
