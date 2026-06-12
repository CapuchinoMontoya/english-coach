<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\ProfileUpdateRequest;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    /**
     * Página de perfil con todos los datos del usuario.
     */
    public function edit(Request $request): Response
    {
        $user    = $request->user();
        $profile = $user->learningProfile;

        return Inertia::render('settings/profile', [
            'mustVerifyEmail' => $user instanceof MustVerifyEmail,
            'status'          => $request->session()->get('status'),
            'settings'        => [
                'avatar_url'          => $user->avatar_url,
                'homework_enabled'    => (bool) $user->homework_enabled,
                'email_notifications' => (bool) $user->email_notifications,
                'interests'           => $profile->learning_style['interests'] ?? [],
            ],
        ]);
    }

    /**
     * Actualiza nombre, email, preferencias e intereses.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $user      = $request->user();
        $validated = $request->validated();

        $user->fill([
            'name'                => $validated['name'],
            'email'               => $validated['email'],
            'homework_enabled'    => $request->boolean('homework_enabled'),
            'email_notifications' => $request->boolean('email_notifications'),
        ]);

        if ($user->isDirty('email')) {
            $user->email_verified_at = null;
        }

        $user->save();

        // Intereses viven en learning_profiles.learning_style
        if ($request->has('interests')) {
            $profile = $user->learningProfile;
            $style   = $profile->learning_style ?? [];
            $style['interests'] = array_values(array_filter(
                $request->input('interests', []),
                fn ($i) => is_string($i) && trim($i) !== ''
            ));
            $profile->update(['learning_style' => $style]);
        }

        return to_route('profile.edit');
    }

    /**
     * Sube/actualiza la foto de perfil.
     */
    public function updateAvatar(Request $request): RedirectResponse
    {
        $request->validate([
            'avatar' => ['required', 'image', 'max:2048'], // 2 MB
        ]);

        $user = $request->user();

        // Borra la anterior si existe
        if ($user->avatar) {
            Storage::disk('public')->delete($user->avatar);
        }

        $path = $request->file('avatar')->store('avatars', 'public');
        $user->update(['avatar' => $path]);

        return to_route('profile.edit');
    }

    /**
     * Elimina la foto de perfil.
     */
    public function deleteAvatar(Request $request): RedirectResponse
    {
        $user = $request->user();

        if ($user->avatar) {
            Storage::disk('public')->delete($user->avatar);
            $user->update(['avatar' => null]);
        }

        return to_route('profile.edit');
    }

    /**
     * Elimina la cuenta.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();

        Auth::logout();

        if ($user->avatar) {
            Storage::disk('public')->delete($user->avatar);
        }

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }
}