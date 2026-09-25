<?php

namespace Database\Seeders;

use App\Enums\MemberGender;
use App\Models\Family;
use App\Models\Member;
use Illuminate\Database\Seeder;

class MemberSeeder extends Seeder
{
    public function run(): void
    {
        $family = Family::query()->updateOrCreate(
            ['code' => 'nguyen-chi-3'],
            [
                'name' => 'Gia phả Họ Nguyễn — Chi 3',
                'root_ancestor_name' => 'Nguyễn Văn Minh',
                'origin_place' => 'Thôn Trung, Bắc Ninh',
                'description' => 'Dữ liệu gia phả mẫu 23 thành viên, 5 thế hệ.',
            ],
        );
        $snapshot = json_decode(file_get_contents(database_path('seeders/data/family_members.json')), true, flags: JSON_THROW_ON_ERROR);
        $ids = [];
        $order = [];
        foreach ($snapshot as $index => $data) {
            [$birthDay, $birthMonth, $birthYear] = $this->parseLunar($data['birthLunar'] ?? null);
            [$deathDay, $deathMonth, $deathYear] = $this->parseLunar($data['deathLunar'] ?? null);
            $member = Member::query()->updateOrCreate(
                ['family_id' => $family->id, 'full_name' => $data['name']],
                [
                    'nickname' => $data['nickname'] ?? null,
                    'role' => $data['role'] ?? 'Thành viên',
                    'gender' => MemberGender::from($data['gender'] ?? 'other'),
                    'generation' => $data['generation'],
                    'order_in_family' => ($order[$data['generation']] ?? 0) + 1,
                    'is_alive' => $data['isAlive'] ?? true,
                    'birth_date_solar' => $this->validDate($data['birthDateSolar'] ?? null),
                    'birth_day_lunar' => $birthDay,
                    'birth_month_lunar' => $birthMonth,
                    'birth_year_lunar' => $birthYear,
                    'death_date_solar' => $this->validDate($data['deathDateSolar'] ?? null),
                    'death_day_lunar' => $deathDay,
                    'death_month_lunar' => $deathMonth,
                    'death_year_lunar' => $deathYear,
                    'burial_place' => $data['burialPlace'] ?? null,
                    'burial_map_url' => $data['burialMapUrl'] ?? null,
                    'home_map_url' => $data['homeMapUrl'] ?? null,
                    'bio' => $data['bio'] ?? null,
                    'avatar_url' => $data['avatarUrl'] ?: null,
                    'phone' => $data['phone'] ?: null,
                    'address' => $data['address'] ?: null,
                ],
            );
            $order[$data['generation']] = $member->order_in_family;
            $ids[$data['id']] = $member->id;
        }
        foreach ($snapshot as $data) {
            Member::query()->whereKey($ids[$data['id']])->update([
                'father_id' => isset($data['fatherId']) ? $ids[$data['fatherId']] : null,
                'mother_id' => isset($data['motherId']) ? $ids[$data['motherId']] : null,
                'spouse_id' => isset($data['spouseId']) ? $ids[$data['spouseId']] : null,
            ]);
        }
    }

    private function parseLunar(?string $value): array
    {
        if (! $value || ! preg_match('/(\d{1,2})\s*\/\s*(\d{1,2})\s*\/\s*(\d{4})/', $value, $matches)) {
            return [null, null, null];
        }

        return [(int) $matches[1], (int) $matches[2], (int) $matches[3]];
    }

    private function validDate(?string $value): ?string
    {
        return $value && preg_match('/^\d{4}-\d{2}-\d{2}$/', $value) ? $value : null;
    }
}
