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
use App\Services\Vocabulary\VerbStudyService;
use App\Services\Vocabulary\VocabularyStudyService;
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
        private VocabularyStudyService $vocab,
        private VerbStudyService       $verbs,
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
            // Nivel del estudiante: controla idioma de la lección y el botón de traductor
            'level'         => $user->learningProfile->real_level ?? 'B1',
            'passThreshold' => $this->orchestrator->passThreshold($user->learningProfile->real_level ?? 'B1'),
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

        $focusWords = $this->vocab->focusWordsForTopic($user, $topic);
        $focusVerbs = $this->verbs->focusVerbsForLesson($user);

        $systemPrompt = $this->context->buildSystemPrompt(
            $user,
            'lesson_session',
            $topic,
            ['sessionState' => $state, 'focusWords' => $focusWords, 'focusVerbs' => $focusVerbs]
        );

        // Genera y sanea; reintenta una vez si la práctica queda con muy pocos
        // ejercicios válidos tras descartar los que vienen rotos.
        $session = null;
        for ($attempt = 1; $attempt <= 2; $attempt++) {
            $raw       = $this->ai->complete(
                'lesson',
                $systemPrompt,
                [['role' => 'user', 'content' => "Generate today's session now."]],
                4000
            );
            $candidate = $this->extractJson($raw);

            if (! $candidate || ! isset($candidate['mini_lesson'])) {
                continue;
            }

            $candidate = $this->sanitizeSession($candidate);
            $session   = $candidate;

            // Suficientes ejercicios buenos → no hace falta reintentar
            if (count($candidate['practice']['exercises'] ?? []) >= 3) {
                break;
            }
        }

        // Debe existir mini-lección y al menos un ejercicio de práctica respondible
        if (! $session || ! isset($session['mini_lesson']) || empty($session['practice']['exercises'])) {
            return response()->json(['error' => 'generation_failed'], 422);
        }

        $session['focus_words'] = $focusWords;
        $session['focus_verbs'] = $focusVerbs;

        // Los verbos foco entran al ciclo de repaso (aprender, no memorizar)
        if (! empty($focusVerbs)) {
            $this->verbs->introduceFocusVerbs($user, array_column($focusVerbs, 'verb'));
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
            ['sessionState' => $state, 'focusWords' => $submission['focus_words'] ?? []]
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

        $focusWords = collect($submission['focus_words'] ?? []);
        $allWords   = $focusWords->pluck('word')->filter()->values()->all();
        if (! empty($allWords)) {
            $this->vocab->introduceFocusWords($user, $allWords);
 
            $usedWords = array_values(array_intersect(
                $evaluation['vocabulary_used'] ?? [],
                $allWords
            ));
            if (! empty($usedWords)) {
                $this->vocab->markFocusWordsUsed($user, $usedWords);
            }
        }

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
     * Sanea los ejercicios generados: descarta los que no se pueden responder
     * y oculta la respuesta cuando la IA la dejó visible.
     */
    private function sanitizeSession(array $session): array
    {
        foreach (['warmup', 'practice'] as $section) {
            if (! isset($session[$section]['exercises']) || ! is_array($session[$section]['exercises'])) {
                continue;
            }

            $clean = [];
            foreach ($session[$section]['exercises'] as $ex) {
                if (! is_array($ex)) continue;
                $fixed = $this->sanitizeExercise($ex);
                if ($fixed !== null) $clean[] = $fixed;
            }

            $session[$section]['exercises'] = array_values($clean);
        }

        return $session;
    }

    /**
     * Valida/repara un ejercicio. Devuelve el ejercicio corregido o null si es
     * imposible de salvar (sin respuesta, sin hueco, opciones inválidas, etc.).
     */
    private function sanitizeExercise(array $ex): ?array
    {
        $type = $ex['type'] ?? null;

        switch ($type) {
            case 'fill_blank': {
                $answer   = is_string($ex['answer'] ?? null)   ? trim($ex['answer'])   : '';
                $question = is_string($ex['question'] ?? null) ? trim($ex['question']) : '';
                if ($answer === '' || $question === '') return null;

                // Quita un hint entre paréntesis que revele la respuesta: "(went)"
                $question = trim(preg_replace(
                    '/\s*\(\s*' . preg_quote($answer, '/') . '\s*\)/iu',
                    '',
                    $question
                ));

                $hasBlank = (bool) preg_match('/_{2,}/u', $question);
                if (! $hasBlank) {
                    // Convierte la respuesta visible en un hueco; si no aparece, es inservible
                    $pattern = '/\b' . preg_quote($answer, '/') . '\b/iu';
                    if (preg_match($pattern, $question)) {
                        $question = preg_replace($pattern, '_____', $question, 1);
                    } else {
                        return null;
                    }
                }

                $ex['question'] = $question;
                $ex['answer']   = $answer;
                $ex['options']  = null;
                return $ex;
            }

            case 'multiple_choice': {
                $options = $ex['options'] ?? null;
                if (! is_array($options)) return null;

                $options = array_values(array_filter(
                    array_map(fn ($o) => is_string($o) ? trim($o) : $o, $options),
                    fn ($o) => $o !== '' && $o !== null
                ));
                if (count($options) < 2) return null;

                $answer = $ex['answer'] ?? null;

                // Si la respuesta vino como texto, conviértela a índice (exacto o laxo)
                if (is_string($answer)) {
                    $idx = array_search(trim($answer), array_map('strval', $options), true);
                    if ($idx === false) {
                        foreach ($options as $i => $o) {
                            if (is_string($o) && mb_strtolower(trim($o)) === mb_strtolower(trim($answer))) {
                                $idx = $i;
                                break;
                            }
                        }
                    }
                    $answer = $idx === false ? null : $idx;
                }

                if (! is_int($answer) || $answer < 0 || $answer >= count($options)) return null;
                if (! is_string($ex['question'] ?? null) || trim($ex['question']) === '') return null;

                $ex['options'] = $options;
                $ex['answer']  = $answer;
                return $ex;
            }

            case 'error_correction':
            case 'translation_es_to_en': {
                $answer   = is_string($ex['answer'] ?? null)   ? trim($ex['answer'])   : '';
                $question = is_string($ex['question'] ?? null) ? trim($ex['question']) : '';
                if ($answer === '' || $question === '') return null;

                // En corrección de errores la frase con error no puede ser idéntica a la corregida
                if ($type === 'error_correction' && mb_strtolower($question) === mb_strtolower($answer)) {
                    return null;
                }

                $ex['answer']   = $answer;
                $ex['question'] = $question;
                $ex['options']  = null;
                return $ex;
            }

            case 'word_order': {
                $q     = $ex['question'] ?? null;
                $words = is_array($q)
                    ? $q
                    : (is_string($q) ? preg_split('/[\s\/]+/u', $q) : []);
                $words = array_values(array_filter(
                    array_map(fn ($w) => is_string($w) ? trim($w) : '', $words),
                    fn ($w) => $w !== ''
                ));

                $answer = is_string($ex['answer'] ?? null) ? trim($ex['answer']) : '';
                if (count($words) < 2 || $answer === '') return null;

                // Las palabras revueltas deben reconstruir EXACTAMENTE la respuesta
                $norm = fn ($s) => mb_strtolower(trim(preg_replace('/[^\p{L}\p{N}\s]/u', '', $s)));

                $answerWords = array_values(array_filter(
                    explode(' ', preg_replace('/\s+/', ' ', $norm($answer)))
                ));
                $questionWords = array_map($norm, $words);

                sort($answerWords);
                sort($questionWords);
                if ($answerWords !== $questionWords) return null;

                $ex['question'] = $words;
                $ex['answer']   = $answer;
                $ex['options']  = null;
                return $ex;
            }

            default:
                return null; // tipo desconocido → fuera
        }
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
