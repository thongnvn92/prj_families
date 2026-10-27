<?php

namespace App\Enums;

enum PendingEditType: string
{
    case AddChild = 'add_child';
    case AddSpouse = 'add_spouse';
    case UpdateInfo = 'update_info';
}
