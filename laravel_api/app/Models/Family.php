<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

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
}
