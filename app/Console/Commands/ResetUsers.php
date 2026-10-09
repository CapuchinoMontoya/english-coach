<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;

/**
 * Borra TODOS los usuarios y su información para empezar pruebas en limpio.
 *
 * NO toca el catálogo de contenido: curriculum_topics, vocabulary_items, verbs
 * y listening_activities (canciones/clips con sus letras y preguntas) se quedan.
 *
 *   php artisan users:reset                      → pide confirmación
 *   php artisan users:reset --force              → sin preguntar
 *   php artisan users:reset --dry-run            → solo muestra qué borraría
 *   php artisan users:reset --keep=a@b.com       → conserva esa(s) cuenta(s)
 *   php artisan users:reset --with-cache         → limpia también la caché
 */
class ResetUsers extends Command
{
    protected $signature = 'users:reset
        {--force : No pedir confirmación}
        {--dry-run : Solo mostrar qué se borraría, sin borrar nada}
        {--keep=* : Email(es) de cuentas a conservar}
        {--with-cache : Limpiar también la caché de la aplicación}';

    protected $description = 'Borra todos los usuarios y sus datos, conservando el catálogo de contenido';

    /** Tablas de datos de usuario, en orden de dependencia (hijas primero). */
    private const USER_TABLES = [
        'session_messages',          // depende de learning_sessions
        'homework_submissions',
        'materials',
        'listening_activity_user',
        'vocabulary_progress',
        'verb_progress',
        'student_topic_progress',
        'user_ai_contexts',
        'learning_sessions',
        'learning_profiles',
        'users',
    ];

    /** Tablas auxiliares que también quedan sucias tras las pruebas. */
    private const SUPPORT_TABLES = [
        'sessions',               // sesiones de login (todos quedan deslogueados)
        'password_reset_tokens',
        'teaching_techniques',    // pool derivado de las sesiones de usuario
        'jobs',
        'failed_jobs',
        'job_batches',
    ];

    /** Catálogo de contenido: NUNCA se toca. */
    private const PROTECTED_TABLES = [
        'curriculum_topics',
        'vocabulary_items',
        'verbs',
        'listening_activities',
        'migrations',
    ];

    public function handle(): int
    {
        $dry   = (bool) $this->option('dry-run');
        $keep  = array_filter((array) $this->option('keep'));

        $keepIds = $keep
            ? DB::table('users')->whereIn('email', $keep)->pluck('id')->all()
            : [];

        if ($keep && empty($keepIds)) {
            $this->error('Ninguna de las cuentas de --keep existe: ' . implode(', ', $keep));
            return self::FAILURE;
        }

        // ── Reporte de lo que se va a borrar ──
        $this->newLine();
        $this->line('<fg=red;options=bold>  SE VA A BORRAR  </>');

        $totals = [];
        foreach (array_merge(self::USER_TABLES, self::SUPPORT_TABLES) as $t) {
            if (! Schema::hasTable($t)) continue;

            $count = $this->scopedQuery($t, $keepIds)->count();
            $totals[$t] = $count;
            if ($count > 0) $this->line(sprintf('    %-26s %6d', $t, $count));
        }

        $avatars = $this->avatarFiles($keepIds);
        if ($avatars) $this->line(sprintf('    %-26s %6d  (archivos en disco)', 'avatares', count($avatars)));

        $played = DB::table('listening_activities')->where('times_played', '>', 0)->count();
        if ($played) $this->line(sprintf('    %-26s %6d  (se resetea a 0)', 'times_played', $played));

        if (array_sum($totals) === 0 && ! $avatars && ! $played) {
            $this->info('  Ya está todo limpio. Nada que hacer.');
            return self::SUCCESS;
        }

        // ── Lo que se conserva ──
        $this->newLine();
        $this->line('<fg=green;options=bold>  SE CONSERVA  </>');
        foreach (self::PROTECTED_TABLES as $t) {
            if (Schema::hasTable($t)) {
                $this->line(sprintf('    %-26s %6d', $t, DB::table($t)->count()));
            }
        }
        if ($keepIds) {
            $emails = DB::table('users')->whereIn('id', $keepIds)->pluck('email')->implode(', ');
            $this->line("    cuentas conservadas:      {$emails}");
        }
        $this->newLine();

        if ($dry) {
            $this->comment('  DRY RUN: no se borró nada.');
            return self::SUCCESS;
        }

        if (! $this->option('force') && ! $this->confirm('¿Borrar definitivamente? Esto no se puede deshacer.', false)) {
            $this->comment('  Cancelado.');
            return self::SUCCESS;
        }

        // ── Borrado ──
        $wipeAll = empty($keepIds);

        Schema::disableForeignKeyConstraints();
        try {
            if ($wipeAll) {
                // Sin transacción: TRUNCATE hace commit implícito en MySQL y
                // reventaría el COMMIT final ("There is no active transaction").
                foreach (self::USER_TABLES as $t) {
                    if (Schema::hasTable($t)) DB::table($t)->truncate();
                }
            } else {
                // Borrado selectivo: aquí sí son DELETEs y la transacción es segura.
                DB::transaction(function () use ($keepIds) {
                    foreach (self::USER_TABLES as $t) {
                        if (Schema::hasTable($t)) $this->scopedQuery($t, $keepIds)->delete();
                    }
                });
            }

            // Auxiliares: siempre se vacían por completo
            foreach (self::SUPPORT_TABLES as $t) {
                if (Schema::hasTable($t)) DB::table($t)->truncate();
            }

            // Contador derivado del uso
            DB::table('listening_activities')->where('times_played', '>', 0)->update(['times_played' => 0]);
        } finally {
            Schema::enableForeignKeyConstraints();
        }

        // Avatares en disco
        foreach ($this->avatarFiles($keepIds) as $file) {
            Storage::disk('public')->delete($file);
        }

        if ($this->option('with-cache')) {
            $this->call('cache:clear');
        }

        $this->newLine();
        $this->info('  Listo. Base de datos lista para un usuario nuevo.');
        $this->line('  Regístrate con el código de invitación de tu .env (INVITATION_CODE).');

        return self::SUCCESS;
    }

    /** Query de una tabla, respetando las cuentas conservadas. */
    private function scopedQuery(string $table, array $keepIds)
    {
        $q = DB::table($table);

        if (empty($keepIds)) return $q;

        if ($table === 'users') {
            return $q->whereNotIn('id', $keepIds);
        }

        if (Schema::hasColumn($table, 'user_id')) {
            return $q->whereNotIn('user_id', $keepIds);
        }

        // session_messages cuelga de learning_sessions
        if ($table === 'session_messages') {
            return $q->whereNotIn('learning_session_id', function ($sub) use ($keepIds) {
                $sub->select('id')->from('learning_sessions')->whereIn('user_id', $keepIds);
            });
        }

        return $q;
    }

    /** Avatares a borrar del disco público. */
    private function avatarFiles(array $keepIds): array
    {
        if (! Schema::hasColumn('users', 'avatar')) return [];

        $files = DB::table('users')
            ->whereNotNull('avatar')
            ->when($keepIds, fn ($q) => $q->whereNotIn('id', $keepIds))
            ->pluck('avatar')
            ->all();

        return array_values(array_filter($files, fn ($f) => Storage::disk('public')->exists($f)));
    }
}
