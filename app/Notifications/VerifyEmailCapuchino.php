<?php

namespace App\Notifications;

use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Notifications\Messages\MailMessage;

/**
 * Correo de verificación con el diseño de marca Capuchino.
 * Reutiliza la URL firmada de Laravel pero renderiza una plantilla propia.
 */
class VerifyEmailCapuchino extends VerifyEmail
{
    public function toMail($notifiable): MailMessage
    {
        $url = $this->verificationUrl($notifiable);

        return (new MailMessage)
            ->subject('Confirma tu correo · Confirm your email · Capuchino')
            ->view('emails.verify-email', [
                'url'          => $url,
                'user'         => $notifiable,
                'expireMinutes' => (int) config('auth.verification.expire', 60),
            ]);
    }
}
