<?php

use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\ConfirmablePasswordController;
use App\Http\Controllers\Auth\EmailVerificationNotificationController;
use App\Http\Controllers\Auth\EmailVerificationPromptController;
use App\Http\Controllers\Auth\GoogleAuthController;
use App\Http\Controllers\Auth\NewPasswordController;
use App\Http\Controllers\Auth\PasswordResetLinkController;
use App\Http\Controllers\Auth\RegisteredUserController;
use App\Http\Controllers\Auth\VerifyEmailController;
use App\Http\Controllers\PlacementController;
use App\Http\Controllers\OnboardingController;
use App\Http\Controllers\Settings\PasswordController;
use App\Http\Controllers\Settings\ProfileController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// ── Root ──────────────────────────────────────────────────────────────────────
Route::get('/', function () {
    return auth()->check()
        ? redirect()->route('dashboard')
        : redirect()->route('login');
})->name('home');

Route::get('/design', fn() => Inertia::render('DesignSystem'))->name('design-system');

// ── Google OAuth ──────────────────────────────────────────────────────────────
Route::get('auth/google', [GoogleAuthController::class, 'redirect'])->name('auth.google');
Route::get('auth/google/callback', [GoogleAuthController::class, 'callback'])->name('auth.google.callback');
Route::get('auth/google/invite', [GoogleAuthController::class, 'showInvite'])->name('auth.google.invite');
Route::post('auth/google/invite', [GoogleAuthController::class, 'completeInvite'])->name('auth.google.invite.submit');

// ── Guests only ───────────────────────────────────────────────────────────────
Route::middleware('guest')->group(function () {
    Route::get('register', [RegisteredUserController::class, 'create'])->name('register');
    Route::post('register', [RegisteredUserController::class, 'store']);

    Route::get('login', [AuthenticatedSessionController::class, 'create'])->name('login');
    Route::post('login', [AuthenticatedSessionController::class, 'store']);

    Route::get('forgot-password', [PasswordResetLinkController::class, 'create'])->name('password.request');
    Route::post('forgot-password', [PasswordResetLinkController::class, 'store'])->name('password.email');

    Route::get('reset-password/{token}', [NewPasswordController::class, 'create'])->name('password.reset');
    Route::post('reset-password', [NewPasswordController::class, 'store'])->name('password.store');
});

Route::middleware(['auth', 'verified', 'role:student'])->group(function () {
    Route::get('/onboarding', [OnboardingController::class, 'index'])->name('onboarding');
    Route::post('/onboarding', [OnboardingController::class, 'store'])->name('onboarding.store');
});

Route::middleware(['auth', 'verified', 'role:student','onboarding.done'])->group(function () {
    Route::get('/placement', [PlacementController::class, 'index'])->name('placement');
    Route::post('/placement/chat', [PlacementController::class, 'chat'])->name('placement.chat');
    Route::post('/placement/complete', [PlacementController::class, 'complete'])->name('placement.complete');
});

// ── Authenticated + verified ──────────────────────────────────────────────────
Route::middleware(['auth', 'verified', 'role:student', 'placement.done'])->group(function () {
    Route::get('/dashboard',  fn() => Inertia::render('dashboard'))->name('dashboard');
    Route::get('/lessons',    fn() => Inertia::render('lessons/index'))->name('lessons.index');
    Route::get('/vocabulary', fn() => Inertia::render('vocabulary/index'))->name('vocabulary.index');
    Route::get('/grammar',    fn() => Inertia::render('grammar/index'))->name('grammar.index');
    Route::get('/flashcards', fn() => Inertia::render('flashcards/index'))->name('flashcards.index');
    Route::get('/progress',   fn() => Inertia::render('progress/index'))->name('progress.index');
    Route::get('/streak',     fn() => Inertia::render('streak/index'))->name('streak.index');
});

// ── Authenticated (email verification, password, logout, settings) ────────────
Route::middleware('auth')->group(function () {

    // Email verification
    Route::get('verify-email', EmailVerificationPromptController::class)->name('verification.notice');
    Route::get('verify-email/{id}/{hash}', VerifyEmailController::class)
        ->middleware(['signed', 'throttle:6,1'])
        ->name('verification.verify');
    Route::post('email/verification-notification', [EmailVerificationNotificationController::class, 'store'])
        ->middleware('throttle:6,1')
        ->name('verification.send');

    // Password confirmation
    Route::get('confirm-password', [ConfirmablePasswordController::class, 'show'])->name('password.confirm');
    Route::post('confirm-password', [ConfirmablePasswordController::class, 'store']);

    // Logout
    Route::post('logout', [AuthenticatedSessionController::class, 'destroy'])->name('logout');

    // Settings
    Route::redirect('settings', 'settings/profile');
    Route::get('settings/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('settings/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('settings/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
    Route::get('settings/password', [PasswordController::class, 'edit'])->name('password.edit');
    Route::put('settings/password', [PasswordController::class, 'update'])->name('password.update');
    Route::get('settings/appearance', fn() => Inertia::render('settings/appearance'))->name('appearance');
});
