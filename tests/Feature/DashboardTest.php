<?php

use App\Models\User;

test('guests are redirected to the login page', function () {
    $this->get('/dashboard')->assertRedirect('/login');
});

test('students without onboarding are sent to onboarding', function () {
    $user = User::factory()->create();
    \App\Models\LearningProfile::create(['user_id' => $user->id, 'placement_done' => false]);

    $this->actingAs($user)->get('/dashboard')->assertRedirect('/onboarding');
});

test('students without placement are sent to placement', function () {
    $user = User::factory()->create();
    \App\Models\LearningProfile::create(['user_id' => $user->id, 'onboarding_done' => true, 'placement_done' => false]);

    $this->actingAs($user)->get('/dashboard')->assertRedirect('/placement');
});

test('ready students can visit the dashboard and main sections', function () {
    \Illuminate\Support\Facades\Http::fake(); // sin llamadas externas (palabra del día usa fallback local)
    $user = User::factory()->ready('A2')->create();

    foreach (['/dashboard', '/lessons', '/vocabulary', '/verbs', '/listening', '/streak'] as $path) {
        $this->actingAs($user)->get($path)->assertOk();
    }
});
