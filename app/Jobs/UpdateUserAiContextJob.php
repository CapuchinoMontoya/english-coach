<?php

namespace App\Jobs;

use Illuminate\Support\Facades\Log;
use App\Models\LearningSession;
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
        try {
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
            // La IA aporta el juicio cualitativo (weak_areas, notas), nunca los datos
            // duros: delegarle un contador daba "1 sesión" después de seis. Y identity
            // lleva el nivel real del alumno, que solo mueve el orquestador.
            $previous = $context->context ?? [];

            $updated['identity'] = $previous['identity'] ?? ($updated['identity'] ?? []);

            $updated['behavioral'] = array_merge(
                $updated['behavioral'] ?? [],
                ['sessions_completed' => LearningSession::query()
                    ->where('user_id', $this->user->id)
                    ->where('mode', 'lesson')
                    ->whereNotNull('score')
                    ->count()],
            );

            $context->update([
                'context'         => $updated,
                'last_updated_at' => now(),
            ]);
        }
        } catch (\Throwable $e) {
            Log::warning(static::class . ' falló: ' . $e->getMessage());
        }
    }
}
