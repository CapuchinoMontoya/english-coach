<?php

namespace App\Jobs;

use App\Models\User;
use App\Services\AI\AIProviderService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class UpdateUserAiContextJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public User  $user,
        public array $messages,
        public int   $score,
    ) {}

    public function handle(AIProviderService $ai): void
    {
        $context   = $this->user->aiContext;
        if (! $context) return;

        $firstName = explode(' ', trim($this->user->name))[0];

        $prompt = "You are analyzing a completed English lesson session. "
            . "Based on the conversation below, update the student profile JSON. "
            . "The student scored {$this->score}/100 in this session. "
            . "Return ONLY the updated JSON context, no markdown, no explanation.\n\n"
            . "CURRENT PROFILE:\n" . json_encode($context->context, JSON_PRETTY_PRINT) . "\n\n"
            . "Update: weak_areas, strong_areas, common_mistakes, teacher_notes, and behavioral fields "
            . "based on what you observed in this session. Keep identity and learning_style mostly stable.";

        $raw = $ai->complete('profile_update', $prompt, $this->messages, 800);

        $json = preg_replace('/```(?:json)?\s*|\s*```/', '', trim($raw));
        preg_match('/\{.*\}/s', $json, $matches);
        $updated = json_decode($matches[0] ?? $json, true);

        if ($updated && isset($updated['identity'])) {
            $context->update([
                'context'         => $updated,
                'last_updated_at' => now(),
            ]);
        }
    }
}