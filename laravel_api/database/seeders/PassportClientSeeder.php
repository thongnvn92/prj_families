<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Laravel\Passport\ClientRepository;
use Laravel\Passport\Passport;

class PassportClientSeeder extends Seeder
{
    public function run(): void
    {
        $clients = app(ClientRepository::class);
        if (! Passport::client()->where('personal_access_client', true)->exists()) {
            $clients->createPersonalAccessClient(null, 'Gia Phả Online Personal Access Client', config('app.url'));
        }
        if (! Passport::client()->where('password_client', true)->exists()) {
            $clients->createPasswordGrantClient(null, 'Gia Phả Online Password Grant Client', config('app.url'));
        }
    }
}
