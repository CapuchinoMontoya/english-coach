<?php

namespace App\Http\Controllers;

use App\Jobs\GenerateStudyPlanJob;
use App\Services\AI\AIProviderService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
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

            ━━━ STEP 0 — COUNT BEFORE YOU JUDGE (do this first, always) ━━━
            Do not form an impression and then justify it. Measure first.

            Go through the STUDENT's turns one by one and work out three numbers:

            (1) TOTAL TURNS the student took.
            (2) ENGLISH-CARRIED TURNS: turns where the substance of the answer was in
                English. A turn is NOT English-carried if the student answered the question
                in Spanish and only sprinkled English fragments, quoted phrases, or single
                words into it — even many of them, even long ones. Ask yourself: if I
                deleted every Spanish word from this turn, would an answer still be there?
                If no, it is a SPANISH turn.
            (3) COMPLETE SELF-BUILT ENGLISH SENTENCES: sentences with a subject and a verb
                that the student composed themselves AND that stand on their own inside an
                English-carried turn. Only count sentences from the turns you classified as
                English-carried in (2) — a sentence that appears inside a Spanish answer is
                a fragment, not a demonstration, however well formed it is.
                Do NOT count: fragments embedded in Spanish ("Yo... I work in office, ¿así
                se dice?"), three-word attempts ("I feel nervous", "I like fútbol"),
                memorized phrases, email boilerplate they are reporting rather than
                composing, or anything Alex said first.
                If (3) comes out higher than a handful while (2) is low, you have counted
                fragments — go back and recount.

            You MUST report these three numbers in the "production_census" field, and your
            level has to be consistent with them. This is the guard against the single
            biggest failure mode of this assessment: a student who is articulate, funny and
            self-aware IN SPANISH reads as advanced, when their English is barely there.

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

            These DO raise the level — count them as real evidence when you see them:
            - Original sentences the student built themselves, with more than one clause,
              joined by because / but / so / when / although.
            - Narrating something that happened, with past tenses that mostly work.
            - Giving an opinion AND justifying it, or comparing two things.
            - Perfect aspect ("I have worked here for three years", "I've been working"),
              future forms, passives, or modals of speculation ("it might have been").
            - Conditionals, even imperfect ones ("if I could travel for work, that would be
              better").
            - Sustaining several turns in English WITHOUT switching to Spanish, and asking
              for clarification in English ("Sorry, what do you mean?").
            - Self-correcting or paraphrasing around a word they don't know, instead of
              stopping.
            Non-native slips (prepositions, articles, "depend of", "more better") do NOT cap
            the level. B1 and B2 speakers make them constantly. Judge RANGE and CONTROL of
            structures, not error count.

            But this evidence only counts when it appears in SUSTAINED production the student
            drove themselves. One broken fragment inside an otherwise Spanish answer
            ("Ummm... I work in office... ¿así se dice?") is an ATTEMPT, not a demonstration.
            Count how many separate, self-built English sentences with a subject and a verb
            the student produced across the whole conversation, and weigh that, not the best
            single moment.

            Be conservative ONLY when the evidence is genuinely tied between two adjacent
            levels — then pick the lower one. Do NOT apply it as a general downward pull: if
            the student clearly shows what a level requires, assign that level even when
            their English is far from perfect.
            Both errors hurt. Overplacing a beginner drowns them; underplacing an
            intermediate makes them grind through months of material they already know,
            which is the fastest way to lose them.

            ━━━ CEFR RUBRIC (English PRODUCTION) ━━━
            A0: Almost no English. Only a handful of isolated words. Cannot build any phrase.
            A1: Uses only memorized words and fixed formulaic phrases. Leans on cognates and
                gestures. Cannot construct original sentences. Understands only isolated familiar
                words, not full spoken sentences. Answers mostly in Spanish.
            A2: Can PRODUCE simple ORIGINAL sentences in English about familiar topics
                (self, family, routine, likes) using basic present/past. Manages short routine
                exchanges in English and gets the gist of simple, slow English — not just single words.
            B1: Sustains the conversation in ENGLISH without falling back to Spanish. Joins
                clauses into connected discourse, narrates past experiences, gives opinions
                with reasons, handles present perfect and future, attempts conditionals.
                Copes with most everyday and work situations. Still has persistent errors
                (prepositions, articles) and struggles with abstract or idiomatic language —
                but simplifies or paraphrases instead of giving up.
            B2: Fluent and detailed across abstract topics. Argues a position, concedes a
                point, speculates, and compares with nuance. Comfortable with a RANGE of
                structures: perfect aspects, all conditionals, passive voice, modals of
                speculation. Some natural collocations and idioms. Occasional subtle
                non-native slips remain.
            C1: Sophisticated, near-native range, register control and nuance. Handles
                implicit meaning and shifts tone deliberately.

            Work the thresholds IN ORDER. Each one is a yes/no question about what you can
            actually see in the transcript.

            GATE 0 — THE LANGUAGE FLOOR. Apply this before anything else, using your census.
            If ENGLISH-CARRIED TURNS are fewer than half of TOTAL TURNS, the student cannot
            yet hold a conversation in English, and the ceiling is A1 — full stop. It does
            not matter how rich, funny or self-aware they were in Spanish, how many English
            fragments they sprinkled in, or how well they explained their own difficulties.
            Assign A1 (A0 if there was essentially no English) and stop here.
            This gate is not negotiable and it overrides every other signal below, including
            the sentence count in the next threshold. If the census fails this gate, the
            answer is A1 and you do not read any further. The platform also re-checks this
            arithmetic after you answer and will correct the level if you got it wrong, so
            there is nothing to gain by stretching it.

            A1 vs A2: among the students who passed Gate 0, did they produce at least 3
            COMPLETE SELF-BUILT ENGLISH SENTENCES (your census number 3)?
              - Fewer than 3  → A1. Stop here.
              - 3 or more     → continue to the next threshold.

            A2 vs B1: ALL THREE must be true, judged on English only:
              (a) Most of their turns were ENGLISH-CARRIED (census 2 clearly above half),
                  and they did NOT retreat to Spanish when the topic got harder.
              (b) They produced connected multi-clause English discourse joined by
                  because / but / so / when / although — not just strings of short sentences.
              (c) They narrated a past experience OR justified an opinion, in English.
              - Any one of them false → A2. Stop here.
              - All three true        → at least B1. Continue to the next threshold.
            Describing a difficulty in Spanish is not (c). Reporting a phrase they once
            wrote in an email ("The delivery is in two weeks") is not (b).

            B1 vs B2: Did the student handle an ABSTRACT or HYPOTHETICAL question with a
            developed answer, AND show a RANGE of structures beyond past and present
            (perfect aspects, conditionals, passive, modals of speculation), AND argue or
            qualify a position rather than just describe?
              - No  → B1.
              - Yes → B2 (C1 only for near-native range, register control and nuance).

            If the conversation never gave the student a chance to show a threshold — for
            example Alex asked every hard question in Spanish, or the chat ended after three
            turns — say so in "evidence" and set "confidence" to "low". Do NOT invent the
            missing evidence, and do NOT punish the student for a question that was never
            asked: judge the highest level they actually demonstrated.

            Return ONLY a valid JSON object. No markdown, no explanation, no code blocks.

            {
            "real_level": "A1",
            "confidence": "high",
            "production_census": {
                "total_turns": 10,
                "english_carried_turns": 2,
                "complete_english_sentences": 1
            },
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

        // Llamada NO streaming — espera el JSON completo.
        //
        // El tope era 800 tokens y esta respuesta mide ~650 de forma habitual: en
        // cuanto el modelo se extendía un poco, el JSON llegaba truncado, no parseaba
        // y caíamos al fallback, que asigna un nivel SIN haber evaluado nada. Se nota
        // tarde y mal (el alumno queda mal colocado), así que damos margen y
        // reintentamos antes de rendirnos.
        // El transcript va como TEXTO en un solo mensaje de usuario. Pasarlo como el
        // array `messages` convertía la evaluación en "continúa esta charla": si el
        // último turno era de Alex, el modelo no tenía nada que continuar y devolvía
        // cadena vacía. La evaluación moría y el fallback colocaba a todos en A1.
        $transcript = collect($cleanMessages)
            ->map(function ($m) {
                $quien = ($m['role'] ?? 'user') === 'assistant' ? 'ALEX (the coach)' : 'STUDENT';
                $texto = str_replace('[EVALUATION_READY]', '', (string) ($m['content'] ?? ''));

                return $quien . ': ' . trim($texto);
            })
            ->filter(fn ($l) => mb_strlen($l) > 12)
            ->implode("\n\n");

        $evalMessages = [[
            'role'    => 'user',
            'content' => "Here is the full placement conversation to assess. Judge ONLY the "
                . "STUDENT's English, never ALEX's.\n\n"
                . "─── CONVERSATION ───\n{$transcript}\n─── END ───\n\n"
                . 'Return the JSON object now, and nothing else.',
        ]];

        $evaluation = null;

        foreach ([2500, 4000] as $attempt => $maxTokens) {
            $raw  = $this->ai->complete('placement', $evalPrompt, $evalMessages, $maxTokens);
            $json = preg_replace('/```(?:json)?\s*|\s*```/', '', trim($raw));

            if (! json_decode($json)) {
                preg_match('/\{.*\}/s', $json, $matches);
                $json = $matches[0] ?? $json;
            }

            $decoded = json_decode($json, true);

            if ($decoded && isset($decoded['real_level'])) {
                $evaluation = $decoded;
                break;
            }

            Log::warning('Placement: la evaluación no devolvió JSON usable.', [
                'user_id'     => $user->id,
                'attempt'     => $attempt + 1,
                'max_tokens'  => $maxTokens,
                'raw_length'  => strlen($raw),
                'raw_tail'    => mb_substr($raw, -200),
            ]);
        }

        // Fallback si el JSON falla incluso tras reintentar
        if (! $evaluation || ! isset($evaluation['real_level'])) {
            Log::error('Placement: cayendo al nivel por defecto sin evaluación real.', [
                'user_id'        => $user->id,
                'declared_level' => $user->learningProfile->declared_level,
            ]);
            // Sin evaluación válida, la mejor pista disponible es lo que el alumno dijo
            // de sí mismo en el onboarding. Asumir A1 siempre mandaba a un B2 al
            // principio del temario, que es el peor error posible aquí.
            $autoevaluado = match (data_get($user->learningProfile->learning_style, 'self_assessed_level')) {
                'elementary'   => 'A2',
                'intermediate' => 'B1',
                'advanced'     => 'B2',
                default        => 'A1',
            };

            $evaluation = [
                'real_level'      => $user->learningProfile->declared_level ?? $autoevaluado,
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

        // El curriculum cubre A1→B2 (C1 es la meta final). A0 se enseña como A1 y
        // C1/C2 se colocan en la pista B2→C1 para que el plan nunca quede vacío.
        $evaluation['real_level'] = match (strtoupper((string) $evaluation['real_level'])) {
            'A0', 'A1' => 'A1',
            'A2'       => 'A2',
            'B1'       => 'B1',
            default    => 'B2',
        };

        // ── Compuerta del idioma, aplicada aquí y no solo en el prompt ──────────────
        // Si el alumno no sostuvo ni la mitad de sus turnos en inglés, no puede estar por
        // encima de A1 por mucho inglés suelto que haya soltado. El modelo calcula bien el
        // censo pero luego lo pasa por alto (3 de 9 turnos y aun así proponía A2), así que
        // la aritmética se rehace aquí. Solo BAJA el nivel, nunca lo sube, y si no viene
        // censo no se toca nada: no inventamos una medición que no existe.
        $censo    = $evaluation['production_census'] ?? null;
        $turnos   = (int) ($censo['total_turns'] ?? 0);
        $enIngles = (int) ($censo['english_carried_turns'] ?? 0);

        if ($turnos >= 4 && $enIngles * 2 < $turnos && $evaluation['real_level'] !== 'A1') {
            Log::info('Placement: nivel limitado a A1 por la compuerta del idioma.', [
                'user_id'   => $user->id,
                'propuesto' => $evaluation['real_level'],
                'turnos'    => $turnos,
                'en_ingles' => $enIngles,
            ]);

            $evaluation['real_level'] = 'A1';
            $evaluation['confidence'] = 'medium';
            $evaluation['evidence']   = "[Nivel limitado a A1: solo {$enIngles} de {$turnos} "
                . 'turnos se sostuvieron en inglés.] ' . ($evaluation['evidence'] ?? '');
        }

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
