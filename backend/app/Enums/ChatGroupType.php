<?php

namespace App\Enums;

enum ChatGroupType: string
{
    case All = 'all';
    case Branch = 'branch';
    case Custom = 'custom';
}
