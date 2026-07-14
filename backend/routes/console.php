<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use App\Models\User;
use App\Models\Role;
use App\Models\Facility;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Hash;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('user:create', function () {
    $email = $this->ask('Enter user email (e.g. nurse2@partocare.cm)');
    if (User::where('email', $email)->exists()) {
        $this->error('A user with this email already exists!');
        return;
    }

    $firstName = $this->ask('Enter first name');
    $lastName = $this->ask('Enter last name');
    $password = $this->secret('Enter password (leave blank for "password")') ?: 'password';
    
    // Choose Role
    $roles = Role::all();
    if ($roles->isEmpty()) {
        $this->error('No roles found in database. Please run migrations and seeders first.');
        return;
    }
    $roleOptions = $roles->pluck('name', 'id')->toArray();
    $roleId = $this->choice('Select user role', $roleOptions, 'r-midwife');

    // Choose Facility
    $facilities = Facility::all();
    if ($facilities->isEmpty()) {
        $this->error('No facilities found in database. Please run migrations and seeders first.');
        return;
    }
    $facilityOptions = $facilities->pluck('name', 'id')->toArray();
    $facilityId = $this->choice('Select health facility', $facilityOptions, 'fac-ndiki');

    $user = User::create([
        'id' => 'u-' . Str::random(9),
        'role_id' => $roleId,
        'facility_id' => $facilityId,
        'first_name' => $firstName,
        'last_name' => $lastName,
        'email' => $email,
        'password' => Hash::make($password),
        'status' => 'ACTIVE'
    ]);

    $this->info("User created successfully! ID: {$user->id}");
})->purpose('Create a new PartoCare user and assign their clinical role');
