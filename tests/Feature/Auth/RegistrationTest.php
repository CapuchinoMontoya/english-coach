<?php

test('registration screen can be rendered', function () {
    $this->get('/register')->assertStatus(200);
});

test('new users can register with a valid invitation code', function () {
    config(['app.invitation_code' => 'BETA-2026']);

    $response = $this->post('/register', [
        'name'                  => 'Test User',
        'email'                 => 'test@example.com',
        'password'              => 'password',
        'password_confirmation' => 'password',
        'invitation_code'       => 'BETA-2026',
    ]);

    $this->assertAuthenticated();
    $response->assertRedirect(route('dashboard', absolute: false));
    $this->assertDatabaseHas('learning_profiles', ['user_id' => auth()->id(), 'placement_done' => 0]);
});

test('registration is rejected with a wrong invitation code', function () {
    config(['app.invitation_code' => 'BETA-2026']);

    $this->post('/register', [
        'name'                  => 'Test User',
        'email'                 => 'test2@example.com',
        'password'              => 'password',
        'password_confirmation' => 'password',
        'invitation_code'       => 'wrong',
    ])->assertSessionHasErrors('invitation_code');

    $this->assertGuest();
});
