<?php

namespace App\Notifications;

use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;

/**
 * Correo de verificación con el diseño de marca Capuchino.
 * Reutiliza la URL firmada de Laravel pero renderiza una plantilla propia.
 *
 * Encolable: hablar con SMTP toma unos 2 s y eso no puede pasar dentro de la petición de
 * registro. Con una cola de verdad (QUEUE_CONNECTION=database + `queue:work`) la manda
 * otro proceso y el registro responde al instante. Con 'sync' no hay a dónde encolar, y
 * User::sendEmailVerificationNotification() recurre a defer().
 *
 * El REENVÍO no la encola: usa Notification::sendNow() porque necesita saber en el momento
 * si el correo salió, para decírselo al usuario en pantalla.
 */
class VerifyEmailCapuchino extends VerifyEmail implements ShouldQueue
{
    use Queueable;

    /** Reintentos antes de darla por fallida. */
    public $tries = 3;

    /** Espera entre reintentos, en segundos. */
    public $backoff = [10, 60];


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
