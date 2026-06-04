<?php

namespace App\Http\Controllers;

use App\Jobs\UpdateUserAiContextJob;
use App\Models\CurriculumTopic;
use App\Models\TeachingTechnique;
use App\Services\AI\AIContextBuilderService;
use App\Services\AI\AIProviderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Response;

class LessonController extends Controller
{
    public function __construct(
        private AIProviderService       $ai,
        private AIContextBuilderService $context,
    ) {}

    // ── Lista de temas ────────────────────────────────────────────────────────

    public function index(Request $request): Response
    {
        $user    = $request->user();
        $profile = $user->learningProfile;

        $map  = ['A1' => 'A2', 'A2' => 'B1', 'B1' => 'B2', 'B2' => 'C1', 'C1' => 'C2'];
        $from = $profile->real_level ?? 'A2';
        $to   = $map[$from] ?? 'B1';

        $topics = CurriculumTopic::query()
            ->where('level_from', $from)
            ->where('level_to', $to)
            ->where('is_active', true)
            ->orderBy('order', 'asc')
            ->get()
            ->map(function ($topic) use ($user) {
                $progress = $user->topicProgress()
                    ->where('curriculum_topic_id', $topic->id)
                    ->first();
                return [
                    'id'          => $topic->id,
                    'order'       => $topic->order,
                    'title'       => $topic->title,
                    'description' => $topic->description,
                    'status'      => $progress?->status ?? 'pending',
                    'score'       => $progress?->score,
                    'locked'      => ($progress?->status ?? 'pending') === 'pending'
                        && $topic->order > 1,
                ];
            });

        // 1. Define the missing variables
        $transition = "{$from}_to_{$to}";
        $level      = $from;

        // 2. Pass them to the Inertia frontend
        return Inertia::render('lessons/index', compact('topics', 'transition', 'level'));
    }

    // ── Página de la lección (solo carga la UI, la teoría se genera aparte) ──

    public function show(Request $request, int $topicId): Response
    {
        $user  = $request->user();
        $topic = CurriculumTopic::findOrFail($topicId);

        // Verificar que el topic está disponible para este usuario
        $progress = $user->topicProgress()
            ->where('curriculum_topic_id', $topicId)
            ->firstOrFail();

        // Marcar como in_progress si estaba pending
        if ($progress->status === 'pending') {
            $progress->markAsStarted();
        }

        return Inertia::render('lessons/show', [
            'topic' => [
                'id'             => $topic->id,
                'order'          => $topic->order,
                'title'          => $topic->title,
                'description'    => $topic->description,
                'grammar_points' => $topic->grammar_points,
            ],
            'progress' => [
                'status'       => $progress->status,
                'sessions_done' => $progress->sessions_count,
                'attempts'     => $progress->attempts,
            ],
        ]);
    }

    // ── Genera la teoría (HTML) — cacheada 7 días por usuario+tema ───────────

    public function theory(Request $request): JsonResponse
    {
        $request->validate(['topic_id' => 'required|integer']);

        $user      = $request->user();
        $topic     = CurriculumTopic::findOrFail($request->topic_id);
        $cacheKey  = "lesson_theory_{$user->id}_{$topic->id}";

        $html = Cache::remember($cacheKey, now()->addDays(7), function () use ($user, $topic) {
            $systemPrompt = $this->context->buildSystemPrompt($user, 'lesson_theory', $topic);

            return $this->ai->complete(
                'lesson',
                $systemPrompt,
                [['role' => 'user', 'content' => 'Generate the lesson now.']],
                2000
            );
        });

        return response()->json(['html' => $html]);
    }

    // ── Genera ejercicios (JSON) — siempre frescos ────────────────────────────

    public function exercises(Request $request): JsonResponse
    {
        $request->validate(['topic_id' => 'required|integer']);

        $user         = $request->user();
        $topic        = CurriculumTopic::findOrFail($request->topic_id);
        $systemPrompt = $this->context->buildSystemPrompt($user, 'lesson_exercises', $topic);

        $raw = $this->ai->complete(
            'activity',   // Gemini — modelo barato para ejercicios
            $systemPrompt,
            [['role' => 'user', 'content' => 'Generate 7 exercises now.']],
            4500
        );

        $json      = preg_replace('/```(?:json)?\s*|\s*```/', '', trim($raw));
        preg_match('/(\{.*\}|\[.*\])/s', $json, $matches);
        $cleanJson = $matches[0] ?? $json;
        $exercises = json_decode($cleanJson, true);

        // 4. (Opcional pero recomendado) Imprimir error si el JSON es inválido
        if (json_last_error() !== JSON_ERROR_NONE) {
            // DEBUG: Retornaremos temporalmente el error y el string crudo al frontend
            // para que puedas ver exactamente qué está rompiendo el JSON.
            return response()->json([
                'debug_error' => true,
                'message' => 'El JSON devuelto por la IA es inválido.',
                'php_error' => json_last_error_msg(),
                'clean_json_attempted' => $cleanJson
            ], 422);
        }

        // 5. Garantizar la estructura que espera el Frontend
        // Si $exercises se decodificó bien pero es un arreglo plano, lo envolvemos.
        if (is_array($exercises) && !isset($exercises['exercises'])) {
            // Dependiendo de tu lógica, tal vez necesites ajustarlo si el front espera otro nombre
            $exercises = ['exercises' => $exercises];
        }

        // 6. Retornamos asegurando siempre la misma estructura base
        return response()->json($exercises ?? ['exercises' => []]);
    }

    // ── Evalúa las respuestas del estudiante ──────────────────────────────────

    public function evaluate(Request $request): JsonResponse
    {
        $request->validate([
            'topic_id'  => 'required|integer',
            'exercises' => 'required|array',   // [{id, type, question, answer, student_answer}]
        ]);

        $user         = $request->user();
        $topic        = CurriculumTopic::findOrFail($request->topic_id);
        $systemPrompt = $this->context->buildSystemPrompt($user, 'lesson_evaluate', $topic);

        $exercisesJson = json_encode($request->exercises);

        $raw = $this->ai->complete(
            'exam_evaluation',   // Claude Haiku — evaluación pedagógica real
            $systemPrompt,
            [['role' => 'user', 'content' => "Evaluate these answers:\n{$exercisesJson}"]],
            1000
        );

        $json   = preg_replace('/```(?:json)?\s*|\s*```/', '', trim($raw));
        preg_match('/\{.*\}/s', $json, $matches);
        $result = json_decode($matches[0] ?? $json, true);

        return response()->json($result ?? [
            'overall_score'    => 0,
            'passed'           => false,
            'feedback_summary' => 'Evaluation error. Please try again.',
            'exercises'        => [],
        ]);
    }

    // ── Finaliza la lección y actualiza el progreso ───────────────────────────

    public function complete(Request $request): JsonResponse
    {
        $request->validate([
            'topic_id'        => 'required|integer',
            'score'           => 'required|integer|min:0|max:100',
            'feedback_summary' => 'nullable|string',
        ]);

        $user     = $request->user();
        $topic    = CurriculumTopic::findOrFail($request->topic_id);
        $score    = $request->score;
        $progress = $user->topicProgress()
            ->where('curriculum_topic_id', $topic->id)
            ->firstOrFail();

        $progress->increment('sessions_count');
        $progress->increment('attempts');

        if ($score >= 70) {
            $progress->markAsCompleted($score);
            $this->activateNextTopic($user, $topic);

            // Shared learning pool — registra la técnica si fue muy buena
            if ($score >= 85 && $request->feedback_summary) {
                TeachingTechnique::create([
                    'topic'             => $topic->title,
                    'level'             => $user->learningProfile->real_level,
                    'learning_style'    => data_get($user->aiContext?->context, 'learning_style.preferred', 'conversational'),
                    'age_group'         => data_get($user->aiContext?->context, 'learning_style.age_group', '18_25'),
                    'technique_summary' => $request->feedback_summary,
                    'score'             => $score,
                    'success_rate'      => $score,
                    'usage_count'       => 1,
                    'is_active'         => true,
                ]);
            }

            // Invalidar la caché de la teoría (para que la próxima vez se regenere si cambia el perfil)
            Cache::forget("lesson_theory_{$user->id}_{$topic->id}");
        } else {
            $progress->update(['status' => 'needs_review']);
        }

        // Actualizar el perfil de IA en background
        UpdateUserAiContextJob::dispatch($user, [], $score);

        return response()->json([
            'passed'   => $score >= 70,
            'score'    => $score,
            'redirect' => route('lessons.index'),
        ]);
    }

    private function activateNextTopic($user, CurriculumTopic $current): void
    {
        $next = CurriculumTopic::query()
            ->where('level_from', $current->level_from)
            ->where('level_to', $current->level_to)
            ->where('order', $current->order + 1)
            ->where('is_active', true)
            ->first();

        if ($next) {
            $user->topicProgress()
                ->where('curriculum_topic_id', $next->id)
                ->where('status', 'pending')
                ->update(['status' => 'in_progress', 'started_at' => now()]);

            $user->learningProfile->update([
                'current_plan' => array_merge(
                    $user->learningProfile->current_plan ?? [],
                    ['current_topic_id' => $next->id]
                ),
            ]);
        }
    }
}
