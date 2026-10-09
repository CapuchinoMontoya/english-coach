<?php

namespace App\Services\AI;

use App\Models\CurriculumTopic;
use App\Models\StudentTopicProgress;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class SessionOrchestratorService
{
    // Reglas de mastery — todas deben cumplirse
    private const MIN_SESSIONS = 1;     // mínimo de sesiones para completar un tema

    // Repaso espaciado de gramática. Un tema "dominado" no volvía a salir NUNCA: el
    // vocabulario tenía Leitner y la gramática nada, así que lo aprendido se evaporaba.
    // Mismos intervalos que el SRS de vocabulario, para que el alumno sienta un solo
    // ritmo. El índice es el número de repasos ya hechos de ese tema.
    private const REVIEW_INTERVALS = [3, 7, 16, 45];

    /**
     * Mínima aprobatoria según el nivel del estudiante:
     * A1 y A2 → 70%, niveles superiores (B1+) → 80%.
     */
    public function passThreshold(string $level): int
    {
        return in_array(strtoupper($level), ['A1', 'A2'], true) ? 70 : 80;
    }

    /**
     * El tema ya completado que toca repasar, o null si ninguno está vencido.
     *
     * Se elige el MÁS ATRASADO, no el más antiguo: si el alumno vuelve después de un
     * mes, lo urgente es lo que lleva más tiempo sin tocarse.
     *
     * @return array{topic_id:int,title:string,aspects:array,errors:array,days:int}|null
     */
    public function topicDueForReview(User $user, ?int $excludeTopicId = null): ?array
    {
        $completados = StudentTopicProgress::query()
            ->where('user_id', $user->id)
            ->where('status', 'completed')
            ->when($excludeTopicId, fn ($q) => $q->where('curriculum_topic_id', '!=', $excludeTopicId))
            ->with('topic')
            ->get();

        $elegido     = null;
        $peorRetraso = -1;

        foreach ($completados as $progreso) {
            $datos   = $progreso->session_data ?? [];
            $repasos = (int) ($datos['reviews_done'] ?? 0);

            // Sin repasos previos, el reloj arranca cuando se completó el tema
            $desde = $datos['last_reviewed_at'] ?? $progreso->completed_at;
            if (! $desde) continue;

            $intervalo = self::REVIEW_INTERVALS[min($repasos, count(self::REVIEW_INTERVALS) - 1)];
            $vence     = Carbon::parse($desde)->addDays($intervalo);
            if ($vence->isFuture()) continue;

            $retraso = (int) $vence->diffInDays(now());
            if ($retraso > $peorRetraso) {
                $peorRetraso = $retraso;
                $elegido     = $progreso;
            }
        }

        if (! $elegido) return null;

        $datos = $elegido->session_data ?? [];

        return [
            'topic_id' => (int) $elegido->curriculum_topic_id,
            'title'    => (string) ($elegido->topic->title ?? ''),
            'aspects'  => array_slice($datos['aspects_covered'] ?? [], 0, 3),
            'errors'   => array_slice($datos['recurring_errors'] ?? [], 0, 3),
            'days'     => $peorRetraso,
        ];
    }

    /** Adelanta el reloj de repaso de un tema ya completado. */
    public function markTopicReviewed(User $user, int $topicId): void
    {
        $progreso = StudentTopicProgress::query()
            ->where('user_id', $user->id)
            ->where('curriculum_topic_id', $topicId)
            ->first();

        if (! $progreso) return;

        $datos                     = $progreso->session_data ?? [];
        $datos['reviews_done']     = (int) ($datos['reviews_done'] ?? 0) + 1;
        $datos['last_reviewed_at'] = now()->toDateString();

        $progreso->update(['session_data' => $datos]);
    }

    /**
     * Errores que el alumno repite, contando TODAS sus sesiones de todos los temas.
     *
     * El evaluador devuelve etiquetas canónicas cortas ("missing article before
     * profession"), así que se pueden contar por igualdad. Se consideran recurrentes a
     * partir de 2 apariciones; los del tema en curso van primero porque son los más
     * urgentes para el warm-up de hoy.
     *
     * @param  array<string, mixed>  $topicData  session_data del tema en curso
     * @return array<int, string>
     */
    private function recurringErrorsFor(User $user, array $topicData): array
    {
        $delTema = collect($topicData['sessions'] ?? [])->flatMap(fn ($s) => $s['errors'] ?? []);

        $deTodos = StudentTopicProgress::query()
            ->where('user_id', $user->id)
            ->pluck('session_data')
            ->flatMap(fn ($d) => collect(data_get($d, 'sessions', []))->flatMap(fn ($s) => $s['errors'] ?? []));

        $recurrentes = $deTodos->countBy()->filter(fn ($n) => $n >= 2)->keys();

        return $recurrentes
            ->sortByDesc(fn ($e) => $delTema->contains($e) ? 1 : 0)
            ->values()
            ->take(6)
            ->all();
    }

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
            // Del alumno, no solo de este tema: su patrón de error real (artículos,
            // tercera persona) persiste entre temas, y un contador que se reinicia con
            // cada tema nunca llega a 2 y no detecta nada.
            'recurring_errors'  => $this->recurringErrorsFor($user, $data),
            // Tema ya dominado que toca refrescar en el warm-up de hoy
            'spaced_review'     => $this->topicDueForReview($user, $topic->id),
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

        // 3. Recalcular errores recurrentes DE ESTE TEMA (su historial propio). Lo que
        //    se le muestra a la IA es la vista por alumno: ver recurringErrorsFor().
        $data['recurring_errors'] = collect($data['sessions'])
            ->flatMap(fn ($s) => $s['errors'] ?? [])
            ->countBy()
            ->filter(fn ($count) => $count >= 2)
            ->keys()
            ->values()
            ->all();

        // 4. Recalcular el score acumulado (ponderado: sesiones recientes pesan más)
        $cumulativeScore = $this->calculateCumulativeScore(collect($data['sessions']));

        // 5. Aplicar las reglas de mastery — umbral según el nivel del estudiante
        $threshold     = $this->passThreshold($user->learningProfile->real_level ?? 'B1');
        $sessionsCount = count($data['sessions']);
        $lastTwoScores = collect($data['sessions'])->take(-2)->pluck('score');

        // Cuántas sesiones pide este tema como mínimo. Antes bastaba con cubrir los
        // aspectos: un tema de 4 puntos se cerraba en 2 sesiones, y la segunda era la
        // primera vez que el alumno veía la mitad del material. Pedimos una pasada por
        // cada par de puntos MÁS una de consolidación, para que nadie dé por dominado
        // un tema en la misma sesión en que lo estrenó.
        $minSessions = max(
            self::MIN_SESSIONS,
            (int) ceil(count($topic->grammar_points ?? []) / 2) + 1
        );

        $mastered =
            empty($data['aspects_remaining'])                                  // todos los aspectos cubiertos
            && $cumulativeScore >= $threshold                                  // promedio sólido para su nivel
            && $sessionsCount >= $minSessions                                  // incluye la consolidación
            && $lastTwoScores->count() >= self::MIN_SESSIONS                   // hay suficientes sesiones
            && $lastTwoScores->every(fn ($s) => $s >= $threshold);            // consistencia para su nivel

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

        // 6.b El warm-up de esta sesión incluyó el tema que estaba vencido de repaso,
        //     así que adelantamos su reloj. Lo recalculamos en vez de recibirlo del
        //     cliente: es el mismo cálculo que se hizo al generar, y si alguna vez
        //     difiere, el tema simplemente vuelve a salir en la siguiente sesión.
        if ($vencido = $this->topicDueForReview($user, $topic->id)) {
            $this->markTopicReviewed($user, $vencido['topic_id']);
        }

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
     * Sube el nivel real del alumno (level_to de la transición dominada) y
     * arma el plan de la siguiente transición: todos sus temas en 'pending' y
     * el primero 'in_progress'. Si ya no hay más pistas (C1), solo sube el nivel.
     */
    public function levelUp(User $user, CurriculumTopic $last): void
    {
        $profile  = $user->learningProfile;
        $newLevel = $last->level_to;

        $nextTopics = CurriculumTopic::forLevel($newLevel)->get();
        // forLevel(C1) cae a B2→C1 (la misma pista): no hay más plan, solo sube el nivel
        $hasNextTrack = $nextTopics->isNotEmpty()
            && $nextTopics->first()->level_from !== $last->level_from;

        $plan = [
            'level_reached_at' => array_merge(
                $profile->current_plan['level_reached_at'] ?? [],
                [$newLevel => now()->toDateString()]
            ),
        ];

        if ($hasNextTrack) {
            foreach ($nextTopics as $t) {
                StudentTopicProgress::firstOrCreate(
                    ['user_id' => $user->id, 'curriculum_topic_id' => $t->id],
                    ['status' => 'pending', 'sessions_count' => 0, 'attempts' => 0]
                );
            }
            $first = $nextTopics->first();
            StudentTopicProgress::query()
                ->where('user_id', $user->id)
                ->where('curriculum_topic_id', $first->id)
                ->update(['status' => 'in_progress', 'started_at' => now()]);

            $plan += [
                'active_transition' => "{$first->level_from}_to_{$first->level_to}",
                'current_topic_id'  => $first->id,
                'started_at'        => now()->toDateString(),
                'total_topics'      => $nextTopics->count(),
            ];
        } else {
            $plan += ['active_transition' => null, 'current_topic_id' => null, 'completed_all' => true];
        }

        $profile->update([
            'real_level'   => $newLevel,
            'current_plan' => array_merge($profile->current_plan ?? [], $plan),
        ]);
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

        if (! $next) {
            // Era el último tema de la transición → el alumno SUBE DE NIVEL
            $this->levelUp($user, $current);
            return;
        }

        StudentTopicProgress::updateOrCreate(
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