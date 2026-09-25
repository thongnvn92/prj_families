<?php

use App\Models\ChatGroup;
use App\Models\User;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('chat-groups.{chatGroup}', function (User $user, ChatGroup $chatGroup): bool {
    return $user->role->value === 'admin'
        || ($user->family_id !== null && (int) $user->family_id === (int) $chatGroup->family_id && $chatGroup->members()->whereKey($user->id)->exists());
});
