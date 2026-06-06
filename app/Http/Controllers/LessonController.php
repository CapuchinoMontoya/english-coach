<?php

namespace App\Http\Controllers;

use App\Models\CurriculumTopic;
use App\Services\AI\AIContextBuilderService;
use App\Services\AI\AIProviderService;
use Illuminate\Http\Request;
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
