<?php

namespace App\Http\Controllers;

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
        $systemPrompt = view('ai.prompts.placement', compact('user', 'profile'))->render();

        $messages = $request->input('messages', []);

        // Contamos cuántos mensajes ha enviado el usuario
        $userTurnCount = count(array_filter($messages, fn($m) => $m['role'] === 'user'));

        // Mensaje del sistema inyectado invisiblemente
        $systemNote = "[SYSTEM NOTE: Turn {$userTurnCount}/15. Adapt dynamically.]";

        if ($userTurnCount >= 15) {
            $systemNote = "[SYSTEM NOTE: Turn 15/15. FINAL TURN. You MUST wrap up the conversation warmly now, welcome the user to the platform, and append [EVALUATION_READY] at the very end.]";
        }

        // Inyectamos la nota en el último mensaje del usuario
        if ($userTurnCount > 0) {
            $lastIndex = count($messages) - 1;
            $messages[$lastIndex]['content'] .= "\n\n" . $systemNote;
        } elseif ($userTurnCount === 0) {
            $messages[] = [
                'role'    => 'user',
                'content' => $systemNote
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
            $msg['content'] = preg_replace('/\n\n\[SYSTEM NOTE:.*?\]/s', '', $msg['content']);
            return $msg;
        }, $messages);

        // Prompt de evaluación — pide SOLO JSON, sin markdown
        $evalPrompt = <<<PROMPT
            You are an expert CEFR English language assessor.
            Analyze the following conversation between an AI coach and a student.
            Evaluate the student's responses ONLY (not the coach's).

            Return ONLY a valid JSON object. No markdown, no explanation, no code blocks.

            {
            "real_level": "B1",
            "confidence": "high",
            "learning_style": {
                "preferred": "conversational",
                "pace": "moderate",
                "needs_encouragement": true,
                "frustrated_by": []
            },
            "weak_areas":      ["present perfect", "articles"],
            "strong_areas":    ["vocabulary", "reading comprehension"],
            "common_mistakes": ["omits auxiliary verb", "confuses since/for"],
            "teacher_notes": "Brief, specific notes about how to teach THIS student."
            }

            Levels: A0, A1, A2, B1, B2, C1
            Confidence: low | medium | high
            PROMPT;

        // Llamada NO streaming — espera el JSON completo
        $raw = $this->ai->complete('placement', $evalPrompt, $cleanMessages, 600);

        // Limpia posibles backticks de markdown que el modelo incluya
        $json = preg_replace('/```(?:json)?\s*|\s*```/', '', trim($raw));
        $evaluation = json_decode($json, true);

        // Fallback si el JSON falla
        if (! $evaluation || ! isset($evaluation['real_level'])) {
            $evaluation = [
                'real_level'      => $user->learningProfile->declared_level ?? 'A2',
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

        // Actualiza learning_profile
        $user->learningProfile->update([
            'real_level'     => $evaluation['real_level'],
            'weak_areas'     => $evaluation['weak_areas']     ?? [],
            'strong_areas'   => $evaluation['strong_areas']   ?? [],
            'learning_style' => $evaluation['learning_style'] ?? [],
            'placement_done' => true,
        ]);

        // Crea el UserAiContext inicial — el "LLM personal"
        // Si ya existe (re-run accidental), lo actualiza
        $user->aiContext()->updateOrCreate(
            ['user_id' => $user->id],
            [
                'context' => [
                    'identity' => [
                        'name'           => $user->name,
                        'declared_level' => $user->learningProfile->declared_level,
                        'real_level'     => $evaluation['real_level'],
                    ],
                    'learning_style'  => $evaluation['learning_style'],
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

        return redirect()->route('dashboard');
    }
}
