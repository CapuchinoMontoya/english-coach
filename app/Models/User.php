<?php

namespace App\Models;

use Illuminate\Support\Facades\Log;
use App\Notifications\VerifyEmailCapuchino;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Notification;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;

class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable;

    /**
     * Envía el correo de verificación con el diseño de marca Capuchino.
     *
     * Devuelve si SALIÓ de verdad. No lanza: un fallo de SMTP no debe tumbar el
     * registro. Pero antes se tragaba la excepción en silencio y quien reenviaba veía
     * "te lo mandamos" aunque no se hubiera mandado nada, así que ahora el resultado
     * se reporta y quien llama decide qué decirle al usuario.
     */
    public function trySendEmailVerification(): bool
    {
        try {
            // sendNow() y no notify(): la notificación es encolable, y si la encolamos
            // aquí devolveríamos "salió" cuando en realidad solo quedó en la cola. Quien
            // reenvía está esperando una respuesta honesta, así que aquí se manda ya.
            Notification::sendNow($this, new VerifyEmailCapuchino);

            return true;
        } catch (\Throwable $e) {
            Log::error('No se pudo enviar la verificación de correo.', [
                'email'     => $this->email,
                'excepcion' => $e::class,
                'mensaje'   => $e->getMessage(),
            ]);

            return false;
        }
    }

    /**
     * Contrato de MustVerifyEmail. Lo usa el listener del evento Registered, o sea el
     * registro, y ahí el correo sale DESPUÉS de responder.
     *
     * Hablar con SMTP dentro de la petición dejaba la pantalla de registro congelada
     * varios segundos (en producción, con Gmail lento, bastante más), y si la conexión
     * se agotaba el correo no salía nunca: parecía que solo funcionaba el botón de
     * reenviar. Diferirlo devuelve la pantalla al instante y el envío ocurre igual.
     *
     * El reenvío NO pasa por aquí: llama a trySendEmailVerification() directo porque
     * necesita saber en el momento si salió, para decírselo al usuario.
     */
    public function sendEmailVerificationNotification(): void
    {
        // Medido: el registro en sí son ~270 ms y el SMTP ~2 s. defer() saca el correo de
        // la respuesta, pero sigue ocupando este worker de PHP, y como Inertia pide
        // /dashboard justo después, esa petición se forma detrás. De ahí la espera.
        //
        // La salida de verdad es que lo mande OTRO proceso. Se activa poniendo
        // MAIL_QUEUE_CONNECTION=database en el .env y corriendo `php artisan queue:work`.
        //
        // Es una conexión propia y NO el QUEUE_CONNECTION global a propósito: moviendo el
        // global, GenerateStudyPlanJob y UpdateUserAiContextJob también se encolarían, y
        // sin un worker vivo un alumno acabaría el placement sin plan de estudio. Así,
        // mientras no se configure, todo sigue exactamente como hoy.
        $conexion = config('mail.queue_connection');

        if (! $conexion) {
            defer(fn () => $this->trySendEmailVerification());

            return;
        }

        $this->notify((new VerifyEmailCapuchino)->onConnection($conexion));
    }

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        // Lo fija el servidor cuando Google ya comprobó el correo, nunca el formulario.
        // Faltaba aquí, así que User::create([... 'email_verified_at' => now()]) se
        // descartaba en silencio y el alta por Google acababa SIN verificar, mandando al
        // usuario a la pantalla de "confirma tu correo" sin razón. Es seguro: ningún
        // controlador asigna desde $request->all(), todos usan listas explícitas.
        'email_verified_at',
        'password',
        'google_id',
        'role',
        'homework_enabled',
        'avatar',
        'email_notifications',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected $casts = [
        'homework_enabled' => 'boolean',
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'email_notifications' => 'boolean',
    ];

    public function learningProfile()
    {
        return $this->hasOne(LearningProfile::class);
    }

    public function materials()
    {
        return $this->hasMany(Material::class);
    }

    public function learningSessions()
    {
        return $this->hasMany(LearningSession::class);
    }

    public function homeworkSubmissions()
    {
        return $this->hasMany(HomeworkSubmission::class);
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function aiContext(): HasOne
    {
        return $this->hasOne(UserAiContext::class);
    }

    public function topicProgress(): HasMany
    {
        return $this->hasMany(StudentTopicProgress::class);
    }

    protected function getAvatarUrlAttribute(): ?string
    {
        if (! $this->avatar) return null;
        return Storage::disk('public')->url($this->avatar);
    }
}
