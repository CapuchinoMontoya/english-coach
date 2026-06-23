<?php

namespace App\Console\Commands;

use App\Models\CurriculumTopic;
use App\Models\VocabularyItem;
use App\Services\AI\AIProviderService;
use Illuminate\Console\Command;

class GenerateVocabulary extends Command
{
    protected $signature = 'vocabulary:generate
        {--topic= : Generar solo para un curriculum_topic_id}
        {--force : Regenerar aunque el tema ya tenga palabras}
        {--debug : Mostrar la respuesta cruda de la IA}';

    protected $description = 'Genera el vocabulario (vía IA) para todos los temas del curriculum';

    public function handle(AIProviderService $ai): int
    {
        $topics = CurriculumTopic::query()
            ->when($this->option('topic'), fn ($q) => $q->where('id', $this->option('topic')))
            ->where('is_active', true)
            ->orderBy('order')
            ->get();

        if ($topics->isEmpty()) {
            $this->error('No hay temas que procesar.');
            return self::FAILURE;
        }

        $totalWords = 0;

        foreach ($topics as $topic) {
            $themes = $topic->vocabulary_themes ?? [];
            if (empty($themes)) continue;

            $this->newLine();
            $this->info("[{$topic->id}] {$topic->title}  ({$topic->level_from}→{$topic->level_to})");

            foreach ($themes as $theme) {
                $already = VocabularyItem::where('curriculum_topic_id', $topic->id)
                    ->where('theme', $theme)
                    ->count();

                if ($already > 0 && ! $this->option('force')) {
                    $this->line("  ⏭  {$theme} — ya tiene {$already} palabras");
                    continue;
                }

                // Con --force, limpia las palabras viejas de ese tema antes de regenerar
                if ($already > 0 && $this->option('force')) {
                    VocabularyItem::where('curriculum_topic_id', $topic->id)
                        ->where('theme', $theme)->delete();
                }

                $this->line("  ⏳ {$theme}...");

                $prompt = view('ai.prompts.vocabulary_generate', [
                    'theme'      => $theme,
                    'level'      => $topic->level_from,
                    'topicTitle' => $topic->title,
                    'count'      => '20 to 35',
                ])->render();

                if ($this->option('debug')) {
                    $this->line('    ── PROMPT (inicio) ──');
                    $this->line('    ' . str_replace("\n", "\n    ", substr($prompt, 0, 500)));
                    $this->line('    ──');
                }

                $raw = $ai->complete(
                    'activity',                 // Gemini — barato; con thinking desactivado responde completo
                    $prompt,
                    [['role' => 'user', 'content' => 'Generate the vocabulary now.']],
                    4500
                );

                if ($this->option('debug')) {
                    $this->line('    ' . substr($raw, 0, 400));
                }

                $words = $this->extractJson($raw)['words'] ?? [];

                if (empty($words)) {
                    $this->warn("    ⚠ 0 palabras (revisa con --debug)");
                    continue;
                }

                $count = 0;
                foreach ($words as $i => $w) {
                    if (empty($w['word']) || empty($w['translation'])) continue;

                    VocabularyItem::updateOrCreate(
                        [
                            'curriculum_topic_id' => $topic->id,
                            'theme'               => $theme,
                            'word'                => trim($w['word']),
                        ],
                        [
                            'level'               => $topic->level_from,
                            'translation'         => trim($w['translation']),
                            'part_of_speech'      => $w['part_of_speech'] ?? null,
                            'example'             => $w['example'] ?? null,
                            'example_translation' => $w['example_translation'] ?? null,
                            'phonetic'            => $w['phonetic'] ?? null,
                            'sort'                => $i,
                        ]
                    );
                    $count++;
                }

                $totalWords += $count;
                $this->line("    ✓ {$count} palabras guardadas");
            }
        }

        $this->newLine();
        $this->info("✓ Listo. {$totalWords} palabras generadas en total.");
        return self::SUCCESS;
    }

    private function extractJson(string $raw): array
    {
        $json = preg_replace('/```(?:json)?\s*|\s*```/', '', trim($raw));
        if (json_decode($json) === null && preg_match('/\{.*\}/s', $json, $m)) {
            $json = $m[0];
        }
        return json_decode($json, true) ?: [];
    }
}