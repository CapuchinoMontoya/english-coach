<?php

namespace App\Services\AI;

use App\Models\CurriculumTopic;
use App\Models\StudentTopicProgress;
use App\Models\User;
use Illuminate\Support\Collection;

class SessionOrchestratorService
{
    // Reglas de mastery — todas deben cumplirse
    private const MIN_SESSIONS        = 2;     // nunca se completa en una sentada
    private const MIN_CUMULATIVE      = 75;    // promedio ponderado mínimo
    private const MIN_LAST_TWO_SCORE  = 70;    // consistencia en las últimas 2 sesiones

    /**
     * Determina el estado de la sesión actual para un tema.
     * Esto es lo que el frontend recibe ANTES de generar el contenido.
     */
    public function getSessionState(User $user, CurriculumTopic $topic): array
    {
        $progress = StudentTopicProgress::query()->firstOrCreate(
            ['user_id' => $user->id, 'curriculum_topic_id' => $topic->id],
            ['status' => 'in_progress', 'started_at' => now()]
        );

        $data          = $progress->getSessionDataOrInit();
        $sessionsDone  = count($data['sessions']);
        $lastSessionAt = $progress->last_session_at;

        return [
            'session_number'    => $sessionsDone + 1,
            'is_first_session'  => $sessionsDone === 0,
            'aspects_covered'   => $data['aspects_covered'],
            'aspects_remaining' => $data['aspects_remaining'],
            'recurring_errors'  => $data['recurring_errors'],
            'cumulative_score'  => (float) ($progress->cumulative_score ?? 0),
            'sessions_done'     => $sessionsDone,
            'min_sessions_met'  => $sessionsDone >= self::MIN_SESSIONS,
            'days_since_last'   => $lastSessionAt ? (int) $lastSessionAt->diffInDays(now()) : null,
            'previous_sessions' => $data['sessions'],   // historial para el contexto de la IA
        ];
    }

    /**
     * Procesa el resultado de una sesión completada.
     * Actualiza la memoria, recalcula el score acumulado y decide el mastery.
     *
     * @param array $result  La evaluación de la IA con:
     *   - session_score (int)
     *   - aspect (string)
     *   - grammar_points_covered (array)
     *   - errors_this_session (array)
     */
    public function processSessionResult(User $user, CurriculumTopic $topic, array $result): array
    {
        $progress = StudentTopicProgress::query()
            ->where('user_id', $user->id)
            ->where('curriculum_topic_id', $topic->id)
            ->firstOrFail();

        $data          = $progress->getSessionDataOrInit();
        $sessionNumber = count($data['sessions']) + 1;
        $score         = (int) ($result['session_score'] ?? 0);
        $covered       = $result['grammar_points_covered'] ?? [];
        $errors        = $result['errors_this_session'] ?? [];

        // 1. Registrar la sesión en el historial
        $data['sessions'][] = [
            'number'                 => $sessionNumber,
            'aspect'                 => $result['aspect'] ?? 'review',
            'grammar_points_covered' => $covered,
            'score'                  => $score,
            'errors'                 => $errors,
            'date'                   => now()->toDateString(),
        ];

        // 2. Mover los grammar points cubiertos de "remaining" a "covered"
        $data['aspects_covered'] = array_values(array_unique(
            array_merge($data['aspects_covered'], $covered)
        ));
        $data['aspects_remaining'] = array_values(array_diff(
            $topic->grammar_points ?? [],
            $data['aspects_covered']
        ));

        // 3. Recalcular errores recurrentes (aparecen en 2+ sesiones)
        $data['recurring_errors'] = collect($data['sessions'])
            ->flatMap(fn ($s) => $s['errors'] ?? [])
            ->countBy()
            ->filter(fn ($count) => $count >= 2)
            ->keys()
            ->values()
            ->all();

        // 4. Recalcular el score acumulado (ponderado: sesiones recientes pesan más)
        $cumulativeScore = $this->calculateCumulativeScore(collect($data['sessions']));

        // 5. Aplicar las reglas de mastery
        $sessionsCount = count($data['sessions']);
        $lastTwoScores = collect($data['sessions'])->take(-2)->pluck('score');

        $mastered =
            empty($data['aspects_remaining'])                          // todos los aspectos cubiertos
            && $cumulativeScore >= self::MIN_CUMULATIVE                 // promedio sólido
            && $sessionsCount >= self::MIN_SESSIONS                     // mínimo 2 sesiones
            && $lastTwoScores->count() >= 2                            // hay al menos 2 sesiones
            && $lastTwoScores->every(fn ($s) => $s >= self::MIN_LAST_TWO_SCORE); // consistencia

        // 6. Persistir el estado
        $progress->update([
            'session_data'     => $data,
            'cumulative_score' => $cumulativeScore,
            'sessions_count'   => $sessionsCount,
            'attempts'         => $progress->attempts + 1,
            'last_session_at'  => now(),
            'status'           => $mastered ? 'completed' : 'in_progress',
            'score'            => $mastered ? (int) round($cumulativeScore) : $progress->score,
            'completed_at'     => $mastered ? now() : null,
        ]);

        // 7. Si dominó el tema, activar el siguiente del plan
        if ($mastered) {
            $this->activateNextTopic($user, $topic);
        }

        return [
            'mastered'             => $mastered,
            'session_score'        => $score,
            'cumulative_score'     => (int) round($cumulativeScore),
            'sessions_count'       => $sessionsCount,
            'aspects_remaining'    => $data['aspects_remaining'],
            'aspects_covered'      => $data['aspects_covered'],
            'recurring_errors'     => $data['recurring_errors'],
            // Mensaje para el estudiante según el resultado
            'next_step' => $mastered
                ? 'topic_completed'
                : (empty($data['aspects_remaining'])
                    ? 'needs_consolidation'   // cubrió todo pero falta consistencia/score
                    : 'next_session'),         // falta cubrir más aspectos
        ];
    }

    /**
     * Score acumulado ponderado: las sesiones recientes pesan más.
     * Refleja la mejora del estudiante en el tiempo, no castiga un mal inicio.
     */
    private function calculateCumulativeScore(Collection $sessions): float
    {
        if ($sessions->isEmpty()) return 0;

        $weightedSum = 0;
        $totalWeight = 0;

        foreach ($sessions->values() as $i => $session) {
            $weight       = $i + 1;   // sesión 1 → peso 1, sesión 2 → peso 2...
            $weightedSum += ($session['score'] ?? 0) * $weight;
            $totalWeight += $weight;
        }

        return $totalWeight > 0 ? round($weightedSum / $totalWeight, 2) : 0;
    }

    /**
     * Activa el siguiente tema del plan cuando el actual se domina.
     */
    private function activateNextTopic(User $user, CurriculumTopic $current): void
    {
        $next = CurriculumTopic::query()
            ->where('level_from', $current->level_from)
            ->where('level_to', $current->level_to)
            ->where('order', $current->order + 1)
            ->where('is_active', true)
            ->first();

        if (! $next) return;   // era el último tema del nivel — ¡subió de nivel!

        StudentTopicProgress::firstOrCreate(
            ['user_id' => $user->id, 'curriculum_topic_id' => $next->id],
            ['status' => 'in_progress', 'started_at' => now()]
        );

        $user->learningProfile->update([
            'current_plan' => array_merge(
                $user->learningProfile->current_plan ?? [],
                ['current_topic_id' => $next->id]
            ),
        ]);
    }
}