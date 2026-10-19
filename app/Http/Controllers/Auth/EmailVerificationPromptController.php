<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Support\VerificationThrottle;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EmailVerificationPromptController extends Controller
{
    /**
     * Show the email verification prompt page.
     */
    public function __invoke(Request $request): Response|RedirectResponse
    {
        $user = $request->user();

        if ($user->hasVerifiedEmail()) {
            return redirect()->intended(route('dashboard', absolute: false));
        }

        // El estado de los límites viaja también al cargar, no solo tras un reenvío: si
        // el usuario refresca, debe ver el botón esperando su turno y no uno activo que
        // el servidor va a rechazar.
        return Inertia::render('auth/verify-email', [
            'status'            => $request->session()->get('status'),
            'verificationState' => $request->session()->get('verificationState')
                ?? app(VerificationThrottle::class)->state($user),
        ]);
    }
}
