<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\Family;
use App\Models\Member;
use App\Models\User;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $family = Family::query()->where('code', 'nguyen-chi-3')->firstOrFail();
        $member = fn (string $name) => Member::query()->where('family_id', $family->id)->where('full_name', $name)->first();
        $root = $member('Nguyễn Văn Minh');
        $users = [
            ['name' => 'Nguyễn Văn An', 'email' => 'admin@gia-pha.local', 'role' => UserRole::Admin, 'member' => $member('Nguyễn Văn Đức')],
            ['name' => 'Nguyễn Văn Tuấn', 'email' => 'mod@gia-pha.local', 'role' => UserRole::Mod, 'member' => $member('Nguyễn Văn Tuấn')],
            ['name' => 'Nguyễn Văn Hiền', 'email' => 'editor@gia-pha.local', 'role' => UserRole::Editor, 'member' => $member('Nguyễn Văn Hiền')],
            ['name' => 'Nguyễn Gia Bảo', 'email' => 'member@gia-pha.local', 'role' => UserRole::Member, 'member' => $member('Nguyễn Gia Bảo')],
            ['name' => 'Khách dòng họ', 'email' => 'guest@gia-pha.local', 'role' => UserRole::Guest, 'member' => null],
        ];
        foreach ($users as $data) {
            User::query()->updateOrCreate(
                ['email' => $data['email']],
                [
                    'name' => $data['name'],
                    'password' => 'password',
                    'role' => $data['role'],
                    'family_id' => $family->id,
                    'member_id' => $data['member']?->id,
                    'managed_root_member_id' => in_array($data['role'], [UserRole::Mod, UserRole::Editor], true) ? $root?->id : null,
                    'email_verified_at' => now(),
                ],
            );
        }
    }
}
