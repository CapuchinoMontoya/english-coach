<?php

use App\Models\LearningProfile;
use App\Models\User;
use App\Notifications\VerifyEmailCapuchino;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Notification;
use Laravel\Socialite\Facades\Socialite;

// Los tres fallos del flujo de verificación, encontrados probando el registro real:
//  1. El registro por formulario debe mandar el correo (y con nuestra plantilla).
//  2. El reenvío decía "enviado" aunque el envío fallara.
//  3. Entrar con Google a una cuenta ya existente no la marcaba verificada, así que
//     quien venía del formulario sin verificar seguía atorado en la pantalla.

test('el registro por formulario manda la verificacion con la plantilla propia', function () {
    Notification::fake();

    $this->post('/register', [
        'name'                  => 'Nuevo Alumno',
        'email'                 => 'nuevo@example.test',
        'password'              => 'Password123!',
        'password_confirmation' => 'Password123!',
        'invitation_code'       => config('app.invitation_code'),
    ]);

    $user = User::where('email', 'nuevo@example.test')->firstOrFail();

    expect($user->email_verified_at)->toBeNull();
    Notification::assertSentTo($user, VerifyEmailCapuchino::class);
});

test('el reenvio avisa cuando el correo si sale', function () {
    Notification::fake();

    $user = User::factory()->create(['email_verified_at' => null]);

    $this->actingAs($user)
        ->post('/email/verification-notification')
        ->assertSessionHas('status', 'verification-link-sent');

    Notification::assertSentTo($user, VerifyEmailCapuchino::class);
});

test('el reenvio avisa cuando el correo NO sale, en vez de decir que si', function () {
    $user = User::factory()->create(['email_verified_at' => null]);

    // SMTP caído: el mailer revienta al intentar enviar
    Mail::shouldReceive('mailer')->andThrow(new RuntimeException('smtp caido'));

    $this->actingAs($user)
        ->post('/email/verification-notification')
        ->assertSessionHas('status', 'verification-link-failed');
});

test('entrar con google a una cuenta existente sin verificar la deja verificada', function () {
    $user = User::factory()->create([
        'email'             => 'ya.existia@example.test',
        'email_verified_at' => null,
        'google_id'         => null,
    ]);
    LearningProfile::create(['user_id' => $user->id, 'placement_done' => false]);

    $googleUser = Mockery::mock('Laravel\Socialite\Contracts\User');
    $googleUser->shouldReceive('getId')->andReturn('google-123');
    $googleUser->shouldReceive('getEmail')->andReturn('ya.existia@example.test');
    $googleUser->shouldReceive('getName')->andReturn('Ya Existia');

    $driver = Mockery::mock();
    $driver->shouldReceive('user')->andReturn($googleUser);
    Socialite::shouldReceive('driver')->with('google')->andReturn($driver);

    $this->get('/auth/google/callback')->assertRedirect();

    $user->refresh();
    expect($user->google_id)->toBe('google-123');
    expect($user->email_verified_at)->not->toBeNull();
    expect($user->hasVerifiedEmail())->toBeTrue();
});

test('el alta nueva por google queda verificada de una vez', function () {
    $this->withSession(['google_pending' => [
        'name' => 'Recien Llegado', 'email' => 'recien@example.test', 'google_id' => 'google-999',
    ]]);

    $this->post('/auth/google/invite', ['invitation_code' => config('app.invitation_code')])
        ->assertRedirect();

    $user = User::where('email', 'recien@example.test')->firstOrFail();
    expect($user->hasVerifiedEmail())->toBeTrue();
});

// ── Límites del reenvío: 60 s de espera y 3 intentos por hora ─────────────────

test('el segundo reenvio dentro del minuto se rechaza', function () {
    Notification::fake();
    $user = User::factory()->create(['email_verified_at' => null]);

    $this->actingAs($user)->post('/email/verification-notification')
        ->assertSessionHas('status', 'verification-link-sent');

    $this->actingAs($user)->post('/email/verification-notification')
        ->assertSessionHas('status', 'verification-link-throttled');

    // Solo salió uno, no dos
    Notification::assertSentToTimes($user, VerifyEmailCapuchino::class, 1);
});

test('pasados los 60 segundos se puede reenviar otra vez', function () {
    Notification::fake();
    $user = User::factory()->create(['email_verified_at' => null]);

    $this->actingAs($user)->post('/email/verification-notification');

    $this->travel(61)->seconds();

    $this->actingAs($user)->post('/email/verification-notification')
        ->assertSessionHas('status', 'verification-link-sent');

    Notification::assertSentToTimes($user, VerifyEmailCapuchino::class, 2);
});

test('al cuarto intento queda bloqueado', function () {
    Notification::fake();
    $user = User::factory()->create(['email_verified_at' => null]);

    for ($i = 1; $i <= 3; $i++) {
        $this->actingAs($user)->post('/email/verification-notification')
            ->assertSessionHas('status', 'verification-link-sent');
        $this->travel(61)->seconds();
    }

    $this->actingAs($user)->post('/email/verification-notification')
        ->assertSessionHas('status', 'verification-link-blocked');

    Notification::assertSentToTimes($user, VerifyEmailCapuchino::class, 3);
});

test('un envio fallido no gasta ninguno de los tres intentos', function () {
    $user = User::factory()->create(['email_verified_at' => null]);

    Mail::shouldReceive('mailer')->andThrow(new RuntimeException('smtp caido'));

    $this->actingAs($user)->post('/email/verification-notification')
        ->assertSessionHas('status', 'verification-link-failed');

    $estado = app(App\Support\VerificationThrottle::class)->state($user->fresh());

    expect($estado['attempts_left'])->toBe(3);
    expect($estado['wait'])->toBe(0);
});

test('la pantalla recibe el estado de los limites al cargar', function () {
    Notification::fake();
    $user = User::factory()->create(['email_verified_at' => null]);

    $this->actingAs($user)->post('/email/verification-notification');

    $this->actingAs($user)->get('/verify-email')->assertInertia(
        fn ($page) => $page
            ->where('verificationState.attempts_left', 2)
            ->where('verificationState.max_attempts', 3)
            ->where('verificationState.blocked', false)
            ->where('verificationState.wait', fn ($w) => $w > 0 && $w <= 60)
    );
});
