<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\LearningProfile;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Laravel\Socialite\Facades\Socialite;

class GoogleAuthController extends Controller
{
    public function redirect()
    {
        return Socialite::driver('google')->redirect();
    }

    public function callback()
    {
        $googleUser = Socialite::driver('google')->user();

        $user = User::where('google_id', $googleUser->getId())->first();

        if (! $user) {
            $user = User::where('email', $googleUser->getEmail())->first();

            if ($user) {
                // Existing email account — link Google ID and log in directly
                $user->update(['google_id' => $googleUser->getId()]);
            } else {
                // Brand-new user — require invitation code before creating account
                session([
                    'google_pending' => [
                        'name'      => $googleUser->getName(),
                        'email'     => $googleUser->getEmail(),
                        'google_id' => $googleUser->getId(),
                    ],
                ]);

                return redirect()->route('auth.google.invite');
            }
        }

        Auth::login($user, remember: true);

        return redirect()->intended(route('dashboard'));
    }

    public function showInvite()
    {
        $pending = session('google_pending');

        if (! $pending) {
            return redirect()->route('register');
        }

        return Inertia::render('auth/google-invite', [
            'name'  => $pending['name'],
            'email' => $pending['email'],
        ]);
    }

    public function completeInvite(Request $request)
    {
        $pending = session('google_pending');

        if (! $pending) {
            return redirect()->route('register');
        }

        $request->validate([
            'invitation_code' => 'required|string',
        ]);

        if ($request->invitation_code !== config('app.invitation_code')) {
            return back()->withErrors(['invitation_code' => 'El código de invitación no es válido.']);
        }

        $user = User::create([
            'name'              => $pending['name'],
            'email'             => $pending['email'],
            'google_id'         => $pending['google_id'],
            'email_verified_at' => now(),
            'password'          => null,
            'role'              => 'student',
        ]);

        LearningProfile::create([
            'user_id'        => $user->id,
            'placement_done' => false,
        ]);

        session()->forget('google_pending');

        Auth::login($user, remember: true);

        return redirect()->intended(route('dashboard'));
    }
}
