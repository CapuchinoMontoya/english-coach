<?php

namespace App\Console\Commands;

use App\Models\ListeningActivity;
use App\Services\AI\AIProviderService;
use Illuminate\Console\Command;

class PrepareListeningActivity extends Command
{
    protected $signature = 'listening:prepare {id : ID de la listening_activity}';
    protected $description = 'Selecciona los blanks por nivel (vía IA) para una canción';

    private array $levels = ['A1', 'A2', 'B1', 'B2', 'C1'];

    public function handle(AIProviderService $ai): int
    {
        $activity = ListeningActivity::query()->find($this->argument('id'));

        if (! $activity) {
            $this->error("No existe la actividad #{$this->argument('id')}");
            return self::FAILURE;
        }

        $lines = collect($activity->synced_lyrics)
            ->map(fn ($l) => ['text' => $l['text']])
            ->values()
            ->all();

        $blanksByLevel = [];

        foreach ($this->levels as $level) {
            $this->info("Seleccionando blanks para {$level}...");

            $prompt = view('ai.prompts.listening_blanks', [
                'level' => $level,
                'lines' => $lines,
            ])->render();

            $raw = $ai->complete(
                'activity',                                  // Gemini Flash-Lite — barato
                $prompt,
                [['role' => 'user', 'content' => 'Select the blanks now.']],
                1200
            );

            $json = preg_replace('/```(?:json)?\s*|\s*```/', '', trim($raw));
            if (! json_decode($json)) {
                preg_match('/\{.*\}/s', $json, $m);
                $json = $m[0] ?? $json;
            }
            $decoded = json_decode($json, true);

            // Validar que las palabras realmente existan en su línea
            $valid = collect($decoded['blanks'] ?? [])
                ->filter(function ($b) use ($activity) {
                    $line = $activity->synced_lyrics[$b['line']] ?? null;
                    if (! $line) return false;
                    return stripos($line['text'], $b['word']) !== false;
                })
                ->map(fn ($b) => [
                    'line'        => (int) $b['line'],
                    'word'        => $b['word'],
                    'distractors' => array_slice($b['distractors'] ?? [], 0, 3),
                ])
                ->values()
                ->all();

            $blanksByLevel[$level] = $valid;
            $this->line("  → ".count($valid)." blanks");
        }

        $activity->update(['blanks_by_level' => $blanksByLevel]);

        $this->info("✓ Listo. Blanks guardados para todos los niveles.");
        return self::SUCCESS;
    }
}