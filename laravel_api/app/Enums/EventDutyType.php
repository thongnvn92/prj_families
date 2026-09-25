<?php

namespace App\Enums;

enum EventDutyType: string
{
    case MamCung = 'mam_cung';
    case HauCan = 'hau_can';
    case Both = 'both';
}
