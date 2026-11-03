<?php

namespace Database\Seeders;

use App\Models\Family;
use App\Models\LunarEvent;
use App\Models\Member;
use Illuminate\Database\Seeder;

class LunarEventSeeder extends Seeder
{
    public function run(): void
    {
        $family = Family::query()->where('code', 'nguyen-chi-3')->firstOrFail();
        $seeds = [
            ['Bốn', 'death_anniversary', 1, 1, 3, 'Chưa cập nhật', 'Gia đình Họ Nguyễn'],
            ['Nguyễn Văn Thảo', 'death_anniversary', 1, 1, 7, 'Chưa cập nhật', 'Gia đình Họ Nguyễn'],
            ['Nguyễn Văn Thuận', 'death_anniversary', 1, 1, 12, 'Chưa cập nhật', 'Gia đình Họ Nguyễn'],
        ];
        foreach ($seeds as [$name, $type, $day, $month, $offset, $place, $organizer]) {
            $member = Member::query()->where('family_id', $family->id)->where('full_name', $name)->firstOrFail();
            LunarEvent::query()->updateOrCreate(
                ['member_id' => $member->id, 'event_type' => $type, 'lunar_day' => $day, 'lunar_month' => $month],
                ['lunar_year' => null, 'solar_date' => today()->addDays($offset), 'burial_place' => $place, 'organizer' => $organizer],
            );
        }
    }
}
