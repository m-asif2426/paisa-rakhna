<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'admin@paisa.pk'],
            [
                'name'       => 'Super Admin',
                'email'      => 'admin@paisa.pk',
                'password'   => Hash::make('Admin@1234'),
                'is_admin'   => true,
                'is_active'  => true,
            ]
        );

        $this->command->info('✅ Admin created: admin@paisa.pk / Admin@1234');
    }
}
