<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Services\Listening\ClipActivityService;
use Illuminate\Console\Command;

class DiscoverClipActivity extends Command
{
    protected $signature = 'listening:discover-clip {userId} {--count=1 : Cuántos clips intentar agregar}';
    protected $description = 'Descubre clips de video (escenas con preguntas) según los gustos de un usuario y los guarda en el catálogo';

    public function handle(ClipActivityService $service): int
    {
        $user = User::query()->find($this->argument('userId'));

        if (! $user) {
            $this->error("No existe el usuario #{$this->argument('userId')}");
            return self::FAILURE;
        }

        $level     = $user->learningProfile->real_level ?? 'B1';
        $interests = $user->learningProfile->learning_style['interests'] ?? [];

        $this->info("Usuario: {$user->name} — nivel {$level}");
        $this->line('Intereses: ' . (implode(', ', $interests) ?: '(ninguno)'));

        $found = 0;
        $tries = (int) $this->option('count');

        for ($i = 0; $i < $tries; $i++) {
            $this->info("Buscando clip " . ($i + 1) . "/{$tries}...");

            $activity = $service->discover($user, $level, $interests);

            if ($activity) {
                $questions = count($activity->questions_by_level[$level] ?? []);
                $this->info("✓ #{$activity->id} — {$activity->artist}: {$activity->title} ({$questions} preguntas, video {$activity->youtube_video_id})");
                $found++;
            } else {
                $this->warn('✗ Ningún candidato cuajó (sin video embebible o sin subtítulos).');
            }
        }

        $this->line("Listo: {$found}/{$tries} clips agregados al catálogo.");

        return $found > 0 ? self::SUCCESS : self::FAILURE;
    }
}
