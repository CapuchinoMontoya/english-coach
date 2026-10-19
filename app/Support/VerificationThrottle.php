<?php

namespace App\Support;

use App\Models\User;
use Illuminate\Support\Facades\RateLimiter;

/**
 * Límites del reenvío del correo de verificación.
 *
 * Dos reglas, las dos en el servidor: el botón deshabilitado del front es comodidad,
 * no seguridad, y alguien puede llamar al endpoint directo.
 *
 *   1. 60 segundos entre un reenvío y el siguiente.
 *   2. Máximo 3 reenvíos por hora.
 *
 * La ventana de los 3 intentos es de una hora y no permanente a propósito: a un usuario
 * legítimo cuyo proveedor tardó en entregar no se le puede cerrar la puerta para siempre
 * sin que alguien lo desbloquee a mano. Pasada la hora vuelve a tener sus 3.
 *
 * Un envío que FALLA no gasta intento: lo registra quien llama, solo si el correo salió.
 */
class VerificationThrottle
{
    /** Segundos de espera obligatoria entre reenvíos. */
    public const COOLDOWN = 60;

    /** Reenvíos permitidos por ventana. */
    public const MAX_ATTEMPTS = 3;

    /** Duración de la ventana de intentos, en segundos. */
    public const WINDOW = 3600;

    private function cooldownKey(User $user): string
    {
        return 'verif-cooldown:' . $user->id;
    }

    private function attemptsKey(User $user): string
    {
        return 'verif-attempts:' . $user->id;
    }

    /** Segundos que faltan para poder reenviar, 0 si ya puede. */
    public function secondsUntilRetry(User $user): int
    {
        return RateLimiter::tooManyAttempts($this->cooldownKey($user), 1)
            ? RateLimiter::availableIn($this->cooldownKey($user))
            : 0;
    }

    /** ¿Agotó los 3 intentos de la ventana? */
    public function isExhausted(User $user): bool
    {
        return RateLimiter::tooManyAttempts($this->attemptsKey($user), self::MAX_ATTEMPTS);
    }

    /** Segundos que faltan para recuperar los intentos. */
    public function secondsUntilReset(User $user): int
    {
        return RateLimiter::availableIn($this->attemptsKey($user));
    }

    /** Intentos que le quedan en esta ventana. */
    public function attemptsLeft(User $user): int
    {
        return max(0, self::MAX_ATTEMPTS - RateLimiter::attempts($this->attemptsKey($user)));
    }

    /** Anota un reenvío que SÍ salió: arranca el cooldown y gasta un intento. */
    public function record(User $user): void
    {
        RateLimiter::hit($this->cooldownKey($user), self::COOLDOWN);
        RateLimiter::hit($this->attemptsKey($user), self::WINDOW);
    }

    /**
     * Lo que la pantalla necesita para pintarse: cuánto esperar, cuántos intentos quedan
     * y si está bloqueado. Así un refresco muestra el estado real y no un botón activo
     * que el servidor va a rechazar.
     *
     * @return array{wait:int, attempts_left:int, max_attempts:int, blocked:bool}
     */
    public function state(User $user): array
    {
        $bloqueado = $this->isExhausted($user);

        return [
            'wait'          => $bloqueado ? $this->secondsUntilReset($user) : $this->secondsUntilRetry($user),
            'attempts_left' => $this->attemptsLeft($user),
            'max_attempts'  => self::MAX_ATTEMPTS,
            'blocked'       => $bloqueado,
        ];
    }

    /** Borra los límites de un usuario (tras verificar, o para soporte). */
    public function clear(User $user): void
    {
        RateLimiter::clear($this->cooldownKey($user));
        RateLimiter::clear($this->attemptsKey($user));
    }
}
