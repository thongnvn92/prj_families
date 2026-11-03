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
        $root = $member('Nguyễn Văn Rinh');
        $users = [
            ['name' => 'Nguyễn Văn Rinh', 'email' => 'nvthanhhoian@gmail.com', 'legacyEmail' => 'admin@gia-pha.local', 'role' => UserRole::Admin, 'member' => $member('Nguyễn Văn Rinh')],
            ['name' => 'Nguyễn Thị Dung', 'email' => 'dungnt@nguyenvan.naol.cloud', 'legacyEmail' => 'mod@gia-pha.local', 'role' => UserRole::Mod, 'member' => $member('Nguyễn Thị Dung')],
            ['name' => 'Nguyễn Văn Toàn', 'email' => 'toannv@nguyenvan.naol.cloud', 'legacyEmail' => 'editor@gia-pha.local', 'role' => UserRole::Editor, 'member' => $member('Nguyễn Văn Toàn')],
            ['name' => 'Nguyễn Văn Thành', 'email' => 'thanhnv@nguyenvan.naol.cloud', 'legacyEmail' => 'member@gia-pha.local', 'role' => UserRole::Member, 'member' => $member('Nguyễn Văn Thành')],
            ['name' => 'Khách dòng họ', 'email' => 'guest@gia-pha.local', 'legacyEmail' => 'guest@gia-pha.local', 'role' => UserRole::Guest, 'member' => null],
        ];
        foreach ($users as $data) {
            $user = User::query()->where('email', $data['email'])->first()
                ?? User::query()->where('email', $data['legacyEmail'])->first()
                ?? new User;
            $user->fill([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => 'password',
                'role' => $data['role'],
                'family_id' => $family->id,
                'member_id' => $data['member']?->id,
                'managed_root_member_id' => in_array($data['role'], [UserRole::Mod, UserRole::Editor], true) ? $root?->id : null,
                'email_verified_at' => now(),
            ])->save();
        }
    }
}
