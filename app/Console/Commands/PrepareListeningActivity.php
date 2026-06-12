<?php

namespace App\Console\Commands;

use App\Models\ListeningActivity;
use App\Services\AI\AIProviderService;
use Illuminate\Console\Command;

class PrepareListeningActivity extends Command
{
    protected $signature = 'listening:prepare {id} {--debug}';
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

        $this->info("Canción: {$activity->artist} — {$activity->title}");
        $this->line("Líneas cargadas de synced_lyrics: " . count($lines));

        if (count($lines) === 0) {
            $this->error("⚠ synced_lyrics está vacío. Revisa que se guardó bien la letra.");
            return self::FAILURE;
        }

        $blanksByLevel = [];

        foreach ($this->levels as $level) {
            $this->info("Seleccionando blanks para {$level}...");

            $prompt = view('ai.prompts.listening_blanks', [
                'level'        => $level,
                'lines'        => $lines,
                'grammarFocus' => null,
            ])->render();

            $raw = $ai->complete(
                'activity',
                $prompt,
                [['role' => 'user', 'content' => 'Select the blanks now.']],
                1500
            );

            // ── Diagnóstico ──
            if ($this->option('debug')) {
                $this->line("  ─ Respuesta cruda de la IA (".strlen($raw)." chars):");
                $this->line("  " . substr($raw, 0, 600));
                $this->line("  ─");
            }

            $decoded   = $this->extractJson($raw);
            $rawBlanks = $decoded['blanks'] ?? [];
            $this->line("  IA devolvió " . count($rawBlanks) . " blanks crudos");

            if (count($rawBlanks) === 0 && ! $this->option('debug')) {
                $this->warn("  (corre con --debug para ver la respuesta cruda)");
            }

            // Validar que la palabra exista en su línea
            $valid = [];
            foreach ($rawBlanks as $b) {
                $idx  = (int) ($b['line'] ?? -1);
                $word = trim($b['word'] ?? '');
                $line = $activity->synced_lyrics[$idx] ?? null;

                if ($line && $word !== '' && stripos($line['text'], $word) !== false) {
                    $valid[] = [
                        'line'        => $idx,
                        'word'        => $word,
                        'distractors' => array_slice($b['distractors'] ?? [], 0, 3),
                    ];
                } elseif ($this->option('debug')) {
                    $this->line("    ✗ '{$word}' no está en línea {$idx}");
                }
            }

            $blanksByLevel[$level] = $valid;
            $this->line("  → " . count($valid) . " blanks válidos");
        }

        $activity->update(['blanks_by_level' => $blanksByLevel]);

        $this->info("✓ Listo. Blanks guardados.");
        return self::SUCCESS;
    }

    private function extractJson(string $raw): array
    {
        $json = preg_replace('/```(?:json)?\s*|\s*```/', '', trim($raw));
        if (json_decode($json) === null) {
            if (preg_match('/\{.*\}/s', $json, $m)) $json = $m[0];
        }
        return json_decode($json, true) ?: [];
    }
}