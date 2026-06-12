<?php

namespace App\Http\Controllers;

use App\Jobs\UpdateUserAiContextJob;
use App\Jobs\DiscoverClipJob;
use App\Jobs\DiscoverListeningJob;
use App\Models\CurriculumTopic;
use App\Models\LearningSession;
use App\Models\TeachingTechnique;
use App\Services\AI\AIContextBuilderService;
use App\Services\AI\AIProviderService;
use App\Services\AI\SessionOrchestratorService;
use App\Services\Listening\ClipActivityService;
use App\Services\Listening\ListeningActivityService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SessionController extends Controller
{
    public function __construct(
        private AIProviderService          $ai,
        private AIContextBuilderService    $context,
        private SessionOrchestratorService $orchestrator,
        private ListeningActivityService   $listening,
        private ClipActivityService        $clips,
    ) {}

    // ── Página de la sesión ───────────────────────────────────────────────────

    public function show(Request $request, int $topicId): Response|RedirectResponse
    {
        $user  = $request->user();
        $topic = CurriculumTopic::findOrFail($topicId);

        // Guardia: no permitir saltar temas bloqueados
        if ($redirect = $this->guardTopicAccess($user, $topic)) {
            return $redirect;
        }

        $state = $this->orchestrator->getSessionState($user, $topic);

        return Inertia::render('lessons/session', [
            'topic' => [
                'id'          => $topic->id,
                'order'       => $topic->order,
                'title'       => $topic->title,
                'description' => $topic->description,
            ],
            'sessionState' => [
                'session_number'    => $state['session_number'],
                'is_first_session'  => $state['is_first_session'],
                'aspects_covered'   => $state['aspects_covered'],
                'aspects_remaining' => $state['aspects_remaining'],
                'cumulative_score'  => $state['cumulative_score'],
                'sessions_done'     => $state['sessions_done'],
                'min_sessions_met'  => $state['min_sessions_met'],
            ],
        ]);
    }

    // ── Genera el contenido adaptativo de la sesión ───────────────────────────

    public function generate(Request $request): JsonResponse
    {
        $request->validate(['topic_id' => 'required|integer']);

        $user  = $request->user();
        $topic = CurriculumTopic::findOrFail($request->topic_id);

        // ── 1. ¿Hay una sesión incompleta y reciente para reutilizar? ──
        $existing = LearningSession::query()
            ->where('user_id', $user->id)
            ->where('curriculum_topic_id', $topic->id)
            ->where('mode', 'lesson')
            ->whereNull('score')                            // no enviada aún
            ->whereNotNull('generated_content')             // tiene contenido
            ->where('created_at', '>=', now()->subDays(5))  // menos de 5 días
            ->latest()
            ->first();

        if ($existing) {
            return response()->json([
                'session_id' => $existing->id,
                'session'    => $existing->generated_content,
                'reused'     => true,
            ]);
        }

        // ── 2. No hay reutilizable → generar nueva ──
        $state = $this->orchestrator->getSessionState($user, $topic);

        $systemPrompt = $this->context->buildSystemPrompt(
            $user,
            'lesson_session',
            $topic,
            ['sessionState' => $state]
        );

        $raw = $this->ai->complete(
            'lesson',
            $systemPrompt,
            [['role' => 'user', 'content' => "Generate today's session now."]],
            4000
        );

        $session = $this->extractJson($raw);

        if (! $session || ! isset($session['mini_lesson'])) {
            return response()->json(['error' => 'generation_failed'], 422);
        }

        $learningSession = LearningSession::create([
            'user_id'             => $user->id,
            'learning_profile_id' => $user->learningProfile->id,
            'mode'                => 'lesson',
            'curriculum_topic_id' => $topic->id,
            'session_number'      => $state['session_number'],
            'topic_aspect'        => $session['aspect'] ?? null,
            'generated_content'   => $session,        // ← guardamos para reutilizar
            'counts_for_plan'     => true,
        ]);

        return response()->json([
            'session_id' => $learningSession->id,
            'session'    => $session,
            'reused'     => false,
        ]);
    }

    // ── Evalúa la sesión y procesa el resultado ───────────────────────────────

    public function submit(Request $request): JsonResponse
    {
        $request->validate([
            'topic_id'   => 'required|integer',
            'session_id' => 'required|integer',
            'submission' => 'required|array',
        ]);

        $user  = $request->user();
        $topic = CurriculumTopic::findOrFail($request->topic_id);
        $state = $this->orchestrator->getSessionState($user, $topic);

        $submission = $request->submission;

        // 1. Evaluar con Claude Haiku
        $systemPrompt = $this->context->buildSystemPrompt(
            $user,
            'session_evaluate',
            $topic,
            ['sessionState' => $state]
        );

        $raw = $this->ai->complete(
            'exam_evaluation',
            $systemPrompt,
            [['role' => 'user', 'content' => "Evaluate this submission:\n" . json_encode($submission)]],
            1500
        );

        $evaluation = $this->extractJson($raw);

        if (! $evaluation || ! isset($evaluation['session_score'])) {
            return response()->json(['error' => 'evaluation_failed'], 422);
        }

        $score = (int) $evaluation['session_score'];

        // 2. Guardar el score en la LearningSession
        LearningSession::query()
            ->where('id', $request->session_id)
            ->where('user_id', $user->id)
            ->update(['score' => $score]);

        // 3. Procesar el resultado en el orquestador (decide mastery)
        $result = $this->orchestrator->processSessionResult($user, $topic, [
            'session_score'          => $score,
            'aspect'                 => $submission['aspect'] ?? 'review',
            'grammar_points_covered' => $submission['grammar_points_covered'] ?? [],
            'errors_this_session'    => $evaluation['errors_this_session'] ?? [],
        ]);

        // 4. Registrar técnica exitosa en el shared pool si fue excelente y completó
        if ($score >= 85 && $result['mastered']) {
            $this->recordTeachingTechnique($user, $topic, $evaluation);
        }

        // 5. Actualizar perfil IA en background
        UpdateUserAiContextJob::dispatch(
            $user,
            [
                ['role' => 'user',      'content' => json_encode($submission)],
                ['role' => 'assistant', 'content' => json_encode($evaluation)],
            ],
            $score
        );

        $suggestActivity = null;
        if ($this->listening->shouldSuggest($user)) {
            // Alterna entre canción y clip para variar la práctica;
            // si el tipo preferido no está en caché, cae al otro.
            $preferClip = LearningSession::query()
                ->where('user_id', $user->id)
                ->where('mode', 'lesson')
                ->whereNotNull('score')
                ->count() % 2 === 0;

            $cached = $preferClip
                ? ($this->clips->getCached($user) ?? $this->listening->getCached($user))
                : ($this->listening->getCached($user) ?? $this->clips->getCached($user));

            if ($cached) {
                $suggestActivity = [
                    'id'     => $cached->id,
                    'type'   => $cached->type,
                    'title'  => $cached->title,
                    'artist' => $cached->artist,
                ];
            }

            // Rellenar el catálogo en segundo plano con lo que falte
            if (! $cached || $cached->type !== 'clip') {
                DiscoverClipJob::dispatch($user->id);
            }
            if (! $cached || $cached->type !== 'song') {
                DiscoverListeningJob::dispatch($user->id, $topic->id);
            }
        }

        // 6. Devolver evaluación + decisión de mastery
        return response()->json([
            'evaluation' => $evaluation,
            'result'     => $result,
            'suggest_activity' => $suggestActivity,
        ]);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    /**
     * Bloquea el acceso si el tema anterior no está completado.
     */
    private function guardTopicAccess($user, CurriculumTopic $topic): ?RedirectResponse
    {
        if ($topic->order <= 1) return null;

        $previous = CurriculumTopic::query()
            ->where('level_from', $topic->level_from)
            ->where('level_to', $topic->level_to)
            ->where('order', $topic->order - 1)
            ->first();

        if (! $previous) return null;

        $prevProgress = $user->topicProgress()
            ->where('curriculum_topic_id', $previous->id)
            ->first();

        if (! $prevProgress || $prevProgress->status !== 'completed') {
            return redirect()
                ->route('lessons.index')
                ->with('error', 'Completa el tema anterior antes de continuar.');
        }

        return null;
    }

    /**
     * Extrae JSON aunque venga con markdown o texto extra.
     */
    private function extractJson(string $raw): ?array
    {
        $json = preg_replace('/```(?:json)?\s*|\s*```/', '', trim($raw));

        if (! json_decode($json)) {
            preg_match('/\{.*\}/s', $json, $m);
            $json = $m[0] ?? $json;
        }

        $decoded = json_decode($json, true);
        return is_array($decoded) ? $decoded : null;
    }

    /**
     * Guarda una técnica de enseñanza exitosa en el pool compartido.
     */
    private function recordTeachingTechnique($user, CurriculumTopic $topic, array $evaluation): void
    {
        TeachingTechnique::create([
            'topic'             => $topic->title,
            'level'             => $user->learningProfile->real_level,
            'learning_style'    => data_get($user->aiContext?->context, 'learning_style.preferred', 'conversational'),
            'age_group'         => data_get($user->aiContext?->context, 'learning_style.age_group', '18_25'),
            'technique_summary' => $evaluation['free_production_feedback'] ?? 'Effective session approach.',
            'score'             => $evaluation['session_score'],
            'success_rate'      => $evaluation['session_score'],
            'usage_count'       => 1,
            'is_active'         => true,
        ]);
    }
}
