<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;
use App\Models\LearningProfile;

class RegisteredUserController extends Controller
{
    /**
     * Show the registration page.
     */
    public function create(): Response
    {
        return Inertia::render('auth/register');
    }

    /**
     * Handle an incoming registration request.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name'            => 'required|string|max:255',
            'email'           => 'required|string|lowercase|email|max:255|unique:' . User::class,
            'password'        => ['required', 'confirmed', Rules\Password::defaults()],
            'invitation_code' => 'required|string',
        ]);

        // Validación del código de invitación
        if ($request->invitation_code !== config('app.invitation_code')) {
            return back()->withErrors([
                'invitation_code' => 'El código de invitación no es válido.',
            ]);
        }

        $user = User::create([
            'name'     => $request->name,
            'email'    => $request->email,
            'password' => Hash::make($request->password),
            'role'     => 'student',
        ]);

        // Crear perfil de aprendizaje vacío automáticamente
        LearningProfile::create([
            'user_id'       => $user->id,
            'placement_done' => false,
        ]);

        event(new Registered($user));
        Auth::login($user);

        return redirect(route('dashboard'));
    }
}
