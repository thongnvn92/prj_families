<?php

namespace App\Enums;

enum UserRole: string
{
    case Admin = 'admin';
    case Mod = 'mod';
    case Editor = 'editor';
    case Member = 'member';
    case Guest = 'guest';

    public function canViewPrivateData(): bool
    {
        return $this !== self::Guest;
    }

    public function canDirectlyEditMembers(): bool
    {
        return in_array($this, [self::Admin, self::Mod, self::Editor], true);
    }

    public function canReviewEdits(): bool
    {
        return in_array($this, [self::Admin, self::Mod], true);
    }
}
