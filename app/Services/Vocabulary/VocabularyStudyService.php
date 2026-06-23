<?php

namespace App\Services\Vocabulary;

use App\Models\User;
use App\Models\VocabularyItem;
use App\Models\VocabularyProgress;
use Illuminate\Support\Collection;

class VocabularyStudyService
{
    // ════════════════════════════════════════════════════════════════════════
    //  RESUMEN / ÍNDICE
    // ════════════════════════════════════════════════════════════════════════

    /**
     * Temas desbloqueados para el usuario con su progreso (nuevas/aprendiendo/dominadas).
     */
    public function themesFor(User $user): array
    {
        $level = $this->level($user);

        $items = VocabularyItem::unlockedFor($level)
            ->orderByRaw($this->levelOrderSql())
            ->orderBy('sort')
            ->get(['theme', 'level', 'word']);

        $progress = VocabularyProgress::where('user_id', $user->id)
            ->get()->keyBy('word');

        $themes = [];
        foreach ($items->groupBy('theme') as $theme => $group) {
            $words    = $group->pluck('word')->unique()->values();
            $mastered = 0;
            $learning = 0;

            foreach ($words as $w) {
                if ($p = $progress->get($w)) {
                    $p->status === 'mastered' ? $mastered++ : $learning++;
                }
            }

            $themes[] = [
                'theme'    => $theme,
                'level'    => $group->first()->level,
                'total'    => $words->count(),
                'mastered' => $mastered,
                'learning' => $learning,
                'new'      => $words->count() - $mastered - $learning,
            ];
        }

        return $themes;
    }

    public function dueCount(User $user): int
    {
        return VocabularyProgress::where('user_id', $user->id)->due()->count();
    }

    // ════════════════════════════════════════════════════════════════════════
    //  ARMAR SESIONES
    // ════════════════════════════════════════════════════════════════════════

    /**
     * Sesión mixta: palabras nuevas (con tope diario) + repasos vencidos.
     * Si se pasa $theme, se acota a ese tema.
     */
    public function buildSession(User $user, ?string $theme = null, int $size = 12): array
    {
        $level = $this->level($user);

        $newCap   = $this->newRemainingToday($user);
        $newItems = $this->pickNewWords($user, $level, $theme, $newCap);

        $reviewItems = $this->pickReviews($user, $level, $theme, $size);

        return $this->assemble($newItems, $reviewItems);
    }

    /**
     * Solo repasos vencidos (botón "Repasar").
     */
    public function buildReviews(User $user, int $size = 20): array
    {
        $level       = $this->level($user);
        $reviewItems = $this->pickReviews($user, $level, null, $size);

        return $this->assemble(collect(), $reviewItems);
    }

    // ── Selección de palabras ──────────────────────────────────────────────────

    private function pickNewWords(User $user, string $level, ?string $theme, int $cap): Collection
    {
        if ($cap <= 0) return collect();

        $known = VocabularyProgress::where('user_id', $user->id)->pluck('word')->all();

        return VocabularyItem::unlockedFor($level)
            ->when($theme, fn ($q) => $q->where('theme', $theme))
            ->orderByRaw($this->levelOrderSql())
            ->orderBy('sort')
            ->get()
            ->unique('word')
            ->reject(fn ($i) => in_array($i->word, $known, true))
            ->take($cap)
            ->values();
    }

    private function pickReviews(User $user, string $level, ?string $theme, int $size): Collection
    {
        $dueWords = VocabularyProgress::where('user_id', $user->id)->due()
            ->orderBy('due_at')
            ->limit($size)
            ->pluck('box', 'word');               // [word => box]

        if ($dueWords->isEmpty()) return collect();

        // Una fila representativa por palabra (para ejemplo/traducción)
        $items = VocabularyItem::unlockedFor($level)
            ->whereIn('word', $dueWords->keys())
            ->when($theme, fn ($q) => $q->where('theme', $theme))
            ->get()
            ->unique('word');

        // adjunta la caja actual a cada item (para decidir el tipo de ejercicio)
        return $items->map(function ($it) use ($dueWords) {
            $it->setAttribute('_box', $dueWords[$it->word] ?? 1);
            return $it;
        })->values();
    }

    // ── Construcción de cards ──────────────────────────────────────────────────

    private function assemble(Collection $newItems, Collection $reviewItems): array
    {
        $cards = [];

        // Nuevas primero (con intro), luego repasos
        foreach ($newItems as $it) {
            $cards[] = $this->buildCard($it, isNew: true, box: 0);
        }
        foreach ($reviewItems as $it) {
            $cards[] = $this->buildCard($it, isNew: false, box: $it->getAttribute('_box') ?? 1);
        }

        return $cards;
    }

    private function buildCard(VocabularyItem $it, bool $isNew, int $box): array
    {
        // Tipo de ejercicio según el estado de la palabra (reconocer → producir)
        if ($isNew) {
            $mode = 'mcq_en_es';                 // tras la intro
        } elseif ($box <= 2) {
            $mode = 'mcq_es_en';
        } else {
            $mode = $this->canCloze($it) ? 'cloze' : 'type';
        }

        $card = [
            'word'                => $it->word,
            'translation'         => $it->translation,
            'part_of_speech'      => $it->part_of_speech,
            'example'             => $it->example,
            'example_translation' => $it->example_translation,
            'phonetic'            => $it->phonetic,
            'theme'               => $it->theme,
            'is_new'              => $isNew,
            'mode'                => $mode,
        ];

        if (str_starts_with($mode, 'mcq')) {
            [$card['options'], $card['answer']] = $this->buildOptions($it, $mode);
        } elseif ($mode === 'cloze') {
            $card['cloze']  = $this->makeCloze($it);
            $card['answer'] = $it->word;
        } else { // type
            $card['answer'] = $it->word;
        }

        return $card;
    }

    /**
     * Opción múltiple: la correcta + 3 distractores plausibles
     * (mismo tema/nivel y mismo part_of_speech).
     */
    private function buildOptions(VocabularyItem $it, string $mode): array
    {
        $field   = str_contains($mode, 'en_es') ? 'translation' : 'word';
        $correct = $it->{$field};

        $distractors = VocabularyItem::where('theme', $it->theme)
            ->where('level', $it->level)
            ->where('part_of_speech', $it->part_of_speech)
            ->where('id', '!=', $it->id)
            ->where($field, '!=', $correct)
            ->inRandomOrder()->limit(10)
            ->pluck($field)->unique()->take(3)->values()->all();

        // Si no hay suficientes, rellena desde el nivel completo
        if (count($distractors) < 3) {
            $more = VocabularyItem::where('level', $it->level)
                ->where($field, '!=', $correct)
                ->inRandomOrder()->limit(15)
                ->pluck($field)->unique()
                ->reject(fn ($x) => in_array($x, $distractors, true))
                ->take(3 - count($distractors))->values()->all();
            $distractors = array_merge($distractors, $more);
        }

        $options = collect($distractors)->push($correct)->shuffle()->values()->all();

        return [$options, $correct];
    }

    private function canCloze(VocabularyItem $it): bool
    {
        return $it->example && stripos($it->example, $it->word) !== false;
    }

    private function makeCloze(VocabularyItem $it): string
    {
        $blanked = preg_replace(
            '/\b' . preg_quote($it->word, '/') . '\b/i',
            '_____',
            $it->example,
            1
        );
        return $blanked ?: $it->example;
    }

    // ════════════════════════════════════════════════════════════════════════
    //  REGISTRAR RESPUESTA (mueve la palabra en el SRS)
    // ════════════════════════════════════════════════════════════════════════

    public function recordAnswer(User $user, string $word, bool $correct): VocabularyProgress
    {
        $progress = VocabularyProgress::firstOrCreate(
            ['user_id' => $user->id, 'word' => $word],
            [
                'box'    => 1,
                'status' => 'learning',
                'level'  => $this->lowestLevelFor($word),
                'due_at' => now(),
            ]
        );

        $correct ? $progress->markCorrect() : $progress->markWrong();

        return $progress;
    }

    // ════════════════════════════════════════════════════════════════════════
    //  PALABRAS FOCO PARA LA LECCIÓN
    // ════════════════════════════════════════════════════════════════════════

    /**
     * Palabras foco para tejer en la sesión — SOLO del vocabulario del tema actual.
     * Prioriza palabras nuevas (que el usuario no ha visto); si faltan, completa con
     * otras del mismo tema.
     */
    public function focusWordsForTopic(User $user, \App\Models\CurriculumTopic $topic, int $count = 6): array
    {
        $pool = VocabularyItem::where('curriculum_topic_id', $topic->id)
            ->orderBy('sort')
            ->get()
            ->unique('word')
            ->values();

        if ($pool->isEmpty()) return [];

        $known = VocabularyProgress::where('user_id', $user->id)->pluck('word')->all();

        $new    = $pool->reject(fn ($i) => in_array($i->word, $known, true))->take($count);
        $picked = $new->count() >= $count
            ? $new
            : $new->concat($pool->take($count - $new->count()))->unique('word')->take($count);

        return $picked->map(fn ($i) => [
            'word'           => $i->word,
            'translation'    => $i->translation,
            'phonetic'       => $i->phonetic,
            'part_of_speech' => $i->part_of_speech,
            'example'        => $i->example,
        ])->values()->all();
    }

    /**
     * Mete las palabras foco al SRS como "introducidas" (entran al ciclo de repaso).
     */
    public function introduceFocusWords(User $user, array $words): void
    {
        foreach ($words as $word) {
            VocabularyProgress::firstOrCreate(
                ['user_id' => $user->id, 'word' => $word],
                ['box' => 1, 'status' => 'learning', 'level' => $this->lowestLevelFor($word), 'due_at' => now()]
            );
        }
    }

    /**
     * Da boost (avanza de caja) a las palabras que el usuario usó BIEN en la producción libre.
     */
    public function markFocusWordsUsed(User $user, array $words): void
    {
        foreach ($words as $word) {
            $this->recordAnswer($user, $word, true);
        }
    }

    // ════════════════════════════════════════════════════════════════════════
    //  HELPERS
    // ════════════════════════════════════════════════════════════════════════

    private function level(User $user): string
    {
        return $user->learningProfile->real_level ?? 'B1';
    }

    /** Palabras nuevas permitidas hoy, según el ritmo y lo ya introducido hoy. */
    private function newRemainingToday(User $user): int
    {
        $cap = match ($user->learningProfile->learning_style['pace'] ?? 'medium') {
            'slow'  => 5,
            'fast'  => 12,
            default => 8,
        };

        $introducedToday = VocabularyProgress::where('user_id', $user->id)
            ->whereDate('created_at', today())
            ->count();

        return max(0, $cap - $introducedToday);
    }

    private function lowestLevelFor(string $word): ?string
    {
        return VocabularyItem::where('word', $word)
            ->orderByRaw($this->levelOrderSql())
            ->value('level');
    }

    private function levelOrderSql(): string
    {
        return "FIELD(level,'A1','A2','B1','B2','C1','C2')";
    }
}