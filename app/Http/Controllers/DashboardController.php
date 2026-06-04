<?php

namespace App\Http\Controllers;

use App\Models\CurriculumTopic;
use App\Models\LearningSession;
use App\Services\AI\AIProviderService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Response;
use App\Services\WordOfTheDayService;

class DashboardController extends Controller
{
    // Mapa de transiciones por nivel real
    private const TRANSITIONS = [
        'A1' => 'A2',
        'A2' => 'B1',
        'B1' => 'B2',
        'B2' => 'C1',
        'C1' => 'C2',
    ];

    public function __construct(private AIProviderService $ai, protected WordOfTheDayService $wordService) {
        $this->wordService = $wordService;
    }

    public function index(Request $request): Response
    {
        $user    = $request->user();
        $profile = $user->learningProfile;

        $realLevel   = $profile->real_level ?? 'A2';
        $targetLevel = self::TRANSITIONS[$realLevel] ?? 'B1';

        // Tema actual en progreso (el primero en in_progress)
        $currentProgress = $user->topicProgress()
            ->with('topic')
            ->where('status', 'in_progress')
            ->first();

        // Total de temas desde la DB — no desde current_plan, para evitar
        // desincronización si el seeder se actualiza en el futuro
        $totalTopics = CurriculumTopic::query()
            ->where('level_from', $realLevel)
            ->where('level_to', $targetLevel)
            ->where('is_active', true)
            ->count('*');

        $completedTopics = $user->topicProgress()
            ->where('status', 'completed')
            ->count();

        return Inertia::render('dashboard', [
            'profile' => [
                'real_level'     => $realLevel,
                'declared_level' => $profile->declared_level,
                'transition'     => "{$realLevel}_to_{$targetLevel}",
            ],
            'currentTopic' => $currentProgress ? [
                'id'                 => $currentProgress->topic->id,
                'title'              => $currentProgress->topic->title,
                'description'        => $currentProgress->topic->description,
                'order'              => $currentProgress->topic->order,
                'estimated_sessions' => $currentProgress->topic->estimated_sessions,
                'sessions_done'      => $currentProgress->sessions_count,
            ] : null,
            'stats' => [
                'completed_topics' => $completedTopics,
                'total_topics'     => $totalTopics,
                'streak_days'      => $this->calculateStreak($user),
                'progress_percent' => $totalTopics > 0
                    ? round(($completedTopics / $totalTopics) * 100)
                    : 0,
            ],
            'wordOfTheDay' => $this->wordService->getWordOfTheDay(),
        ]);
    }

    // ── Racha de días consecutivos de estudio ─────────────────────────────────

    private function calculateStreak($user): int
    {
        // whereRaw evita el falso positivo de Intelephense con whereNotNull
        $dates = LearningSession::query()
            ->where('user_id', $user->id)
            ->where('mode', '!=', 'placement')
            ->whereRaw('score IS NOT NULL', [], 'and')
            ->selectRaw('DATE(created_at) as session_date')
            ->distinct()
            ->orderByDesc('session_date')
            ->pluck('session_date');

        if ($dates->isEmpty()) return 0;

        $today     = now()->toDateString();
        $yesterday = now()->subDay()->toDateString();

        // Si la última sesión no fue hoy ni ayer, la racha se rompió
        if ($dates->first() !== $today && $dates->first() !== $yesterday) {
            return 0;
        }

        $streak   = 0;
        $expected = $dates->first();

        foreach ($dates as $date) {
            if ($date === $expected) {
                $streak++;
                $expected = Carbon::parse($expected)->subDay()->toDateString();
            } else {
                break;
            }
        }

        return $streak;
    }
}