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
            ['Nguyễn Văn Minh', 'death_anniversary', 19, 8, 3, 'Khu di tích gia tộc, Bắc Ninh', 'Ban Trưởng tộc · Chi 3'],
            ['Nguyễn Thị Sáu', 'death_anniversary', 7, 10, 7, 'Khu di tích gia tộc, Bắc Ninh', 'Ban Trưởng tộc · Chi 3'],
            ['Nguyễn Văn Thành', 'death_anniversary', 23, 12, 12, 'Nghĩa trang làng Trung, Bắc Ninh', 'Trưởng chi Nguyễn Văn Hiền'],
            ['Nguyễn Thị Nga', 'death_anniversary', 5, 11, 18, 'Nghĩa trang làng Trung, Bắc Ninh', 'Trưởng chi Nguyễn Văn Hiền'],
            ['Nguyễn Văn Dũng', 'death_anniversary', 29, 3, 26, 'Khu di tích gia tộc, Bắc Ninh', 'Trưởng chi Nguyễn Văn Tuấn'],
            ['Nguyễn Văn Đức', 'birth_anniversary', 8, 2, 34, 'Ghi nhận sinh nhật thành viên', 'Gia đình Họ Nguyễn'],
        ];
        $members = Member::query()->where('family_id', $family->id)->get()->keyBy('full_name');
        foreach ($seeds as [$name, $type, $day, $month, $offset, $place, $organizer]) {
            $member = Member::query()->where('family_id', $family->id)->where('full_name', $name)->firstOrFail();
            LunarEvent::query()->updateOrCreate(
                ['member_id' => $member->id, 'event_type' => $type, 'lunar_day' => $day, 'lunar_month' => $month],
                ['lunar_year' => null, 'solar_date' => today()->addDays($offset), 'burial_place' => $place, 'organizer' => $organizer],
            );
        }
    }
}
