<?php

namespace App\Jobs;

use App\Models\User;
use App\Services\AI\AIProviderService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class GenerateStudyPlanJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(public User $user) {}

    public function handle(AIProviderService $ai): void
    {
        $profile   = $this->user->learningProfile;
        $aiContext = $this->user->aiContext;

        if (! $profile || ! $aiContext) return;

        $context = $aiContext->context;

        $prompt = <<<PROMPT
        You are a CEFR English curriculum designer.
        Create a personalized study plan for this student.
        Return ONLY a valid JSON object. No markdown, no explanation.

        STUDENT PROFILE:
        - Real level: {$profile->real_level}
        - Goal: {$context['learning_style']['goal']}
        - Learning style: {$context['learning_style']['preferred']}
        - Time per day: {$context['learning_style']['time_per_day']} minutes
        - Weak areas: {$this->listToString($profile->weak_areas)}
        - Strong areas: {$this->listToString($profile->strong_areas)}
        - Teacher notes: {$context['teacher_notes']}

        PLAN STRUCTURE — return exactly this format:
        {
          "level": "A2",
          "total_units": 8,
          "estimated_weeks": 10,
          "units": [
            {
              "id": 1,
              "title": "Unit title",
              "description": "What this unit covers and why",
              "topics": ["topic 1", "topic 2", "topic 3"],
              "grammar_focus": ["grammar point 1", "grammar point 2"],
              "vocabulary_theme": "theme related to student goal/interests",
              "estimated_sessions": 3,
              "status": "pending"
            }
          ]
        }

        RULES:
        - Units go from easiest to hardest, building on each other.
        - Address weak areas progressively, not all at once.
        - Align vocabulary and topics with the student's goal and interests.
        - "pending" | "in_progress" | "completed" — all start as "pending".
        - 6 to 10 units total depending on the level gap to the next CEFR level.
        PROMPT;

        $messages = [['role' => 'user', 'content' => 'Generate the study plan now.']];

        $raw  = $ai->complete('lesson', $prompt, $messages, 2000);
        $json = preg_replace('/```(?:json)?\s*|\s*```/', '', trim($raw));

        if (! json_decode($json)) {
            preg_match('/\{.*\}/s', $json, $matches);
            $json = $matches[0] ?? $json;
        }

        $plan = json_decode($json, true);

        if ($plan && isset($plan['units'])) {
            $profile->update(['current_plan' => $plan]);
        }
    }

    private function listToString(?array $list): string
    {
        return empty($list) ? 'none detected' : implode(', ', $list);
    }
}