<?php

namespace App\Http\Controllers;

use App\Services\AI\AIContextBuilderService;
use App\Services\AI\AIProviderService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class OnboardingController extends Controller
{

    public function __construct(
        private AIProviderService       $ai,
        private AIContextBuilderService $context,
    ) {}

    public function index(Request $request): Response
    {
        return Inertia::render('Onboarding/Index', [
            'user' => $request->user()->only('id', 'name'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        // 1. Validamos TODOS los pasos que vienen de React
        $validated = $request->validate([
            'goal'           => 'required|string|in:work,travel,school,general',
            'learning_style' => 'required|string|in:visual,conversational,reading_writing,exercises',
            'personality'    => 'required|string|in:extrovert,ambivert,introvert',
            'interests'      => 'required|array|min:1', // Es un arreglo por las burbujas
            'interests.*'    => 'string', // Cada interés debe ser texto
            'time_per_day'   => 'required|string|in:10_15,20_30,30_60,60_plus',
            'age_group'      => 'required|string|in:under_18,18_25,26_35,36_plus',
            'current_level'  => 'required|string|in:beginner,elementary,intermediate,advanced',
        ]);

        $profile = $request->user()->learningProfile;

        // 2. Guardamos la data estructurada en la columna JSON
        $profile->update([
            'learning_style' => array_merge($profile->learning_style ?? [], [
                'goal'           => $validated['goal'],
                'preferred'      => $validated['learning_style'],
                'personality'    => $validated['personality'],
                'interests'      => $validated['interests'], // Guardamos el arreglo de gustos
                'time_per_day'   => $validated['time_per_day'],
                'age_group'      => $validated['age_group'],
                'self_assessed_level' => $validated['current_level'],
            ]),
            'onboarding_done' => true,
        ]);

        return redirect()->route('placement');
    }

    public function getInterests(Request $request)
    {
        $topic = $request->input('topic');

        // 1. Instrucciones rediseñadas para "Granularidad Progresiva y Popular"
        $systemPrompt = "You are a helpful assistant for an English learning app. 
                     The user is building their interest profile. Your job is to provide the NEXT LEVEL of detail based on their selection.
                     
                     RULES:
                     1. If the prompt is empty, provide broad, universal categories.
                     2. If the topic is a broad category (e.g., 'Music', 'Movies'), return popular sub-genres.
                     3. If the topic is a sub-genre (e.g., 'Hip Hop', 'Sci-Fi'), return world-famous artists, movies, games, or franchises.
                     4. EVERY item you return must be GLOBALLY RECOGNIZED and POPULAR. No obscure or highly niche topics.
                     5. Keep them VERY short (1 to 3 words maximum).
                     
                     CRITICAL: Your response must be ONLY a valid JSON array of exactly 6 strings. No markdown, no formatting, no extra text.";

        // 2. Lógica de prompts dependiente del estado del embudo
        $userPrompt = $topic
            ? "The user selected: '{$topic}'. Generate 6 highly popular, globally recognized sub-topics or famous examples related to it."
            : "Generate 6 of the most broad, universally popular entertainment and lifestyle categories (e.g., Movies, Music, Sports, Video Games, Travel, Food).";

        try {
            $raw = $this->ai->complete(
                'activity',
                $systemPrompt,
                [['role' => 'user', 'content' => $userPrompt]],
                1000
            );

            $cleanJson = trim(preg_replace('/^```json\s*|\s*```$/i', '', $raw));
            $topics = json_decode($cleanJson, true);

            if (!is_array($topics)) {
                throw new \Exception("Invalid JSON format from AI");
            }

            return response()->json(['topics' => $topics]);
        } catch (\Exception $e) {
            // Fallback ajustado a Nivel 1 (Categorías amplias)
            $fallback = ['Movies & TV', 'Music', 'Sports', 'Video Games', 'Travel', 'Food & Cooking'];
            return response()->json(['topics' => $fallback]);
        }
    }
}
