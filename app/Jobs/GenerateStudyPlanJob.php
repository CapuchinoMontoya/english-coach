<?php
// ─── app/Jobs/GenerateStudyPlanJob.php ───────────────────────────────────────
// Renombrado conceptualmente a "InitializeStudyPlan"
// Ya no genera el plan — lo asigna desde el curriculum fijo

namespace App\Jobs;

use App\Models\CurriculumTopic;
use App\Models\StudentTopicProgress;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class GenerateStudyPlanJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(public User $user) {}

    public function handle(): void
    {
        $profile   = $this->user->learningProfile;
        $realLevel = $profile->real_level ?? 'A2';

        // 1. Obtener los temas del curriculum para el nivel del usuario
        $topics = CurriculumTopic::forLevel($realLevel)->get();

        if ($topics->isEmpty()) {
            // Fallback si no hay temas para ese nivel
            Log::warning("No curriculum topics found for level {$realLevel}", [
                'user_id' => $this->user->id,
            ]);
            return;
        }

        // 2. Crear registros de progreso para cada tema (todos como 'pending')
        //    Ignorar si ya existen (re-run seguro)
        DB::transaction(function () use ($topics) {
            foreach ($topics as $topic) {
                StudentTopicProgress::firstOrCreate(
                    [
                        'user_id'              => $this->user->id,
                        'curriculum_topic_id'  => $topic->id,
                    ],
                    [
                        'status'        => 'pending',
                        'sessions_count'=> 0,
                        'attempts'      => 0,
                    ]
                );
            }
        });

        // 3. Marcar el primer tema como 'in_progress' y registrar la fecha de inicio
        $firstProgress = StudentTopicProgress::query()->where('user_id', $this->user->id)
            ->whereHas('topic', fn ($q) => $q->forLevel($this->user->learningProfile->real_level))
            ->orderBy('id')
            ->first();

        if ($firstProgress) {
            $firstProgress->markAsStarted();
        }

        // 4. Actualizar current_plan con el puntero simple
        $firstTopic = $topics->first();

        $profile->update([
            'current_plan' => [
                'active_transition' => "{$firstTopic->level_from}_to_{$firstTopic->level_to}",
                'current_topic_id'  => $firstTopic->id,
                'started_at'        => now()->toDateString(),
                'total_topics'      => $topics->count(),
            ],
        ]);
    }
}