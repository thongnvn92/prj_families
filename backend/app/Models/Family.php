<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Family extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'code',
        'root_ancestor_name',
        'origin_place',
        'description',
    ];

    public function members(): HasMany
    {
        return $this->hasMany(Member::class);
    }

    /**
     * Tài khoản thuộc dòng họ — nguồn để gửi thông báo nhắc giỗ trong ứng dụng.
     */
    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function albums(): HasMany
    {
        return $this->hasMany(AlbumPhoto::class);
    }

    public function chatGroups(): HasMany
    {
        return $this->hasMany(ChatGroup::class);
    }

    public function prayers(): HasMany
    {
        return $this->hasMany(Prayer::class);
    }

    public function settings(): HasOne
    {
        return $this->hasOne(FamilySetting::class);
    }
}
