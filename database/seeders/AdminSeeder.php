<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    // database/seeders/AdminSeeder.php
    public function run(): void
    {
        User::create([
            'name'     => 'Admin',
            'email'    => 'alejocapuchinom@gmail.com',
            'password' => Hash::make('admin1234'),
            'role'     => 'admin',
        ]);
    }
}
