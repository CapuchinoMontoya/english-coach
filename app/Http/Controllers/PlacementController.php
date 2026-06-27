<?php

namespace App\Http\Controllers;

use App\Jobs\GenerateStudyPlanJob;
use App\Services\AI\AIProviderService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Response;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\StreamedResponse;

class PlacementController extends Controller
{
    public function __construct(private AIProviderService $ai) {}

    public function index(Request $request): Response
    {
        return Inertia::render('Placement/Index', [
            'user' => $request->user()->only('id', 'name', 'email'),
        ]);
    }

    public function chat(Request $request): StreamedResponse
    {
        $request->validate(['messages' => 'array']);

        $user    = $request->user();
        $profile = $user->learningProfile;
        $systemPrompt = view('ai.prompts.placement', [
            'user'       => $user,
            'profile'    => $profile,
            'first_name' => explode(' ', trim($user->name))[0],
        ])->render();
        $messages = $request->input('messages', []);

        // Contamos cuántos mensajes ha enviado el usuario
        $userTurnCount = count(array_filter($messages, fn($m) => $m['role'] === 'user'));

        // Mensaje del sistema inyectado invisiblemente
        $systemNote = "[SYSTEM NOTE: Turn {$userTurnCount}/15. Adapt dynamically.]";

        if ($userTurnCount >= 15) {
            $systemNote = "[SYSTEM NOTE: Turn 15/15. FINAL TURN. You MUST wrap up the conversation warmly now, welcome the user to the platform, and append [EVALUATION_READY] at the very end.]";
        }

        if ($userTurnCount > 0) {
            $lastIndex = count($messages) - 1;
            $messages[$lastIndex]['content'] .= "\n\n" . $systemNote;
        } elseif ($userTurnCount === 0) {
            $messages[] = [
                'role'    => 'user',
                'content' => '[START_CONVERSATION] ' . $systemNote,
            ];
        }

        return response()->stream(function () use ($systemPrompt, $messages) {
            foreach ($this->ai->stream('placement', $systemPrompt, $messages) as $chunk) {
                echo 'data: ' . json_encode(['text' => $chunk]) . "\n\n";
                ob_flush();
                flush();
            }
            echo 'data: ' . json_encode(['done' => true]) . "\n\n";
            ob_flush();
            flush();
        }, 200, [
            'Content-Type'      => 'text/event-stream',
            'Cache-Control'     => 'no-cache',
            'X-Accel-Buffering' => 'no',
        ]);
    }

    public function complete(Request $request): RedirectResponse
    {
        $request->validate([
            'messages' => 'required|array|min:2',
        ]);

        $user     = $request->user();
        $messages = $request->input('messages');

        // Limpia las notas de sistema inyectadas antes de mandar a evaluar
        $cleanMessages = array_map(function ($msg) {
            $content = preg_replace('/\n\n\[SYSTEM NOTE:.*?\]/s', '', $msg['content']);
            $content = str_replace('[START_CONVERSATION] ', '', $content);
            $msg['content'] = trim($content);
            return $msg;
        }, $messages);


        // Prompt de evaluación — pide SOLO JSON, sin markdown
        $evalPrompt = <<<PROMPT
            You are a STRICT, expert CEFR English assessor for a learning app.
            Analyze the conversation between an AI coach (Alex) and a student.
            Evaluate ONLY the student's ENGLISH ability — never the coach's.

            ━━━ HOW TO JUDGE (read carefully) ━━━
            Base the level ONLY on the English the student actually PRODUCED themselves.
            The following DO NOT raise the level — ignore them as evidence of English skill:
            - Fluency, detail, humor or storytelling in SPANISH (their native language).
            - Saying or "understanding" words nearly identical in Spanish
              (cognates: "americano", "return", "travel", "visit", "medium", "cappuccino", numbers).
            - Recognizing a few isolated familiar words while admitting they did NOT
              understand the full sentence.
            - Memorized survival phrases ("Hello, one coffee please", "Thank you", "Medium, please").
            - The coach's praise, encouragement, or ANY level the coach mentioned — ignore it entirely.

            Be CONSERVATIVE. If the evidence sits between two levels, choose the LOWER one.
            Overplacing a beginner frustrates them; underplacing is the safer error.

            ━━━ CEFR RUBRIC (English PRODUCTION) ━━━
            A0: Almost no English. Only a handful of isolated words. Cannot build any phrase.
            A1: Uses only memorized words and fixed formulaic phrases. Leans on cognates and
                gestures. Cannot construct original sentences. Understands only isolated familiar
                words, not full spoken sentences. Answers mostly in Spanish.
            A2: Can PRODUCE simple ORIGINAL sentences in English about familiar topics
                (self, family, routine, likes) using basic present/past. Manages short routine
                exchanges in English and gets the gist of simple, slow English — not just single words.
            B1: Connects sentences, gives opinions, narrates experiences, copes with most everyday
                situations in English.
            B2: Fluent and detailed; argues and explains comfortably.
            C1: Sophisticated, near-native range and nuance.

            DECISIVE TEST for A1 vs A2: Did the student CONSTRUCT at least a few original simple
            English sentences (NOT memorized phrases, NOT single cognate words)?
              - No  → A1  (or A0 if there was barely any English at all).
              - Yes → A2 or higher, per the rubric.

            Return ONLY a valid JSON object. No markdown, no explanation, no code blocks.

            {
            "real_level": "A1",
            "confidence": "high",
            "evidence": "1-2 sentences quoting the ACTUAL English the student produced and why it maps to this level.",
            "learning_style": {
                "preferred": "conversational",
                "pace": "moderate",
                "needs_encouragement": true,
                "frustrated_by": []
            },
            "weak_areas":      ["basic sentence building", "present simple"],
            "strong_areas":    ["motivation", "guessing from context"],
            "common_mistakes": ["relies on memorized phrases", "no original sentences yet"],
            "teacher_notes": "Brief, specific notes about how to teach THIS student."
            }

            Levels: A0, A1, A2, B1, B2, C1
            Confidence: low | medium | high
            PROMPT;

        // Llamada NO streaming — espera el JSON completo
        $raw  = $this->ai->complete('placement', $evalPrompt, $cleanMessages, 800);
        $json = preg_replace('/```(?:json)?\s*|\s*```/', '', trim($raw));

        if (! json_decode($json)) {
            preg_match('/\{.*\}/s', $json, $matches);
            $json = $matches[0] ?? $json;
        }

        $evaluation = json_decode($json, true);

        // Fallback si el JSON falla
        if (! $evaluation || ! isset($evaluation['real_level'])) {
            $evaluation = [
                'real_level'      => $user->learningProfile->declared_level ?? 'A1',
                'confidence'      => 'low',
                'learning_style'  => [
                    'preferred'           => 'conversational',
                    'pace'                => 'moderate',
                    'needs_encouragement' => true,
                    'frustrated_by'       => [],
                ],
                'weak_areas'      => [],
                'strong_areas'    => [],
                'common_mistakes' => [],
                'teacher_notes'   => 'Placement completed. Manual review recommended.',
            ];
        }

        $profile = $user->learningProfile;

        $profile->update([
            'real_level'     => $evaluation['real_level'],
            'weak_areas'     => $evaluation['weak_areas']     ?? [],
            'strong_areas'   => $evaluation['strong_areas']   ?? [],
            'learning_style' => array_merge(
                $profile->learning_style ?? [],
                $evaluation['learning_style'] ?? []
            ),
            'placement_done' => true,
        ]);

        // Crea el UserAiContext inicial — el "LLM personal"
        // Si ya existe (re-run accidental), lo actualiza
        $user->aiContext()->updateOrCreate(
            ['user_id' => $user->id],
            [
                'context' => [
                    'identity' => [
                        'name' => explode(' ', trim($user->name))[0],
                        'declared_level' => $user->learningProfile->declared_level,
                        'real_level'     => $evaluation['real_level'],
                    ],
                    'learning_style'  => $profile->learning_style,
                    'academic'        => [
                        'weak_areas'      => $evaluation['weak_areas']     ?? [],
                        'strong_areas'    => $evaluation['strong_areas']   ?? [],
                        'common_mistakes' => $evaluation['common_mistakes'] ?? [],
                        'current_unit'    => null,
                        'completed_units' => [],
                    ],
                    'behavioral'      => [
                        'sessions_completed'  => 0,
                        'best_response_to'    => [],
                        'engagement_triggers' => [],
                    ],
                    'teacher_notes'   => $evaluation['teacher_notes'] ?? '',
                ],
                'last_updated_at' => now(),
            ]
        );

        GenerateStudyPlanJob::dispatch($user)->afterCommit();

        return redirect()->route('dashboard');
    }
}
