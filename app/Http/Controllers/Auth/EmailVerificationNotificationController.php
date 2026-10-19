<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Support\VerificationThrottle;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class EmailVerificationNotificationController extends Controller
{
    public function __construct(private VerificationThrottle $throttle) {}

    /**
     * Send a new email verification notification.
     */
    public function store(Request $request): RedirectResponse
    {
        $user = $request->user();

        if ($user->hasVerifiedEmail()) {
            $this->throttle->clear($user);

            return redirect()->intended(route('dashboard', absolute: false));
        }

        // Los límites se comprueban aquí, no solo en el front: el botón deshabilitado es
        // comodidad, y cualquiera puede llamar al endpoint directo.
        if ($this->throttle->isExhausted($user)) {
            return back()->with([
                'status'            => 'verification-link-blocked',
                'verificationState' => $this->throttle->state($user),
            ]);
        }

        if ($this->throttle->secondsUntilRetry($user) > 0) {
            return back()->with([
                'status'            => 'verification-link-throttled',
                'verificationState' => $this->throttle->state($user),
            ]);
        }

        // Antes se devolvía siempre "enviado", incluso cuando el envío fallaba: el
        // usuario esperaba un correo que nunca salió y no tenía forma de saberlo.
        $enviado = $user->trySendEmailVerification();

        // Un envío fallido NO gasta intento ni arranca el cooldown: el usuario no tiene
        // por qué pagar un fallo de nuestro SMTP con uno de sus tres intentos.
        if ($enviado) {
            $this->throttle->record($user);
        }

        return back()->with([
            'status'            => $enviado ? 'verification-link-sent' : 'verification-link-failed',
            'verificationState' => $this->throttle->state($user),
        ]);
    }
}
