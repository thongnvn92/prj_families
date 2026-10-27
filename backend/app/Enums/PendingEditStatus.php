<?php

namespace App\Enums;

enum PendingEditStatus: string
{
    case Pending = 'pending';
    case Approved = 'approved';
    case Rejected = 'rejected';
}
