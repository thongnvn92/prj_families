<?php

namespace Database\Seeders;

use App\Models\Family;
use App\Models\User;
use App\Support\FamilySettings;
use Illuminate\Database\Seeder;

class FamilySettingSeeder extends Seeder
{
    public function run(): void
    {
        $familyId = (int) Family::query()->where('code', 'nguyen-chi-3')->value('id');
        abort_if($familyId === 0, 'Chưa có dòng họ mẫu để seed cấu hình tính năng.');

        // Dòng họ mẫu chạy với chat bật và admin/mod/editor được đưa ảnh lên hệ thống.
        FamilySettings::update(
            $familyId,
            true,
            ['admin', 'mod', 'editor'],
            User::query()->where('email', 'admin@gia-pha.local')->value('id'),
        );
    }
}
