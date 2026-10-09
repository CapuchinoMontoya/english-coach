<?php

namespace App\Jobs;

use Illuminate\Support\Facades\Log;
use App\Models\CurriculumTopic;
use App\Models\User;
use App\Services\Listening\ListeningActivityService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class DiscoverListeningJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public int  $userId,
        public ?int $topicId = null,
    ) {}

    public function handle(ListeningActivityService $service): void
    {
        try {
            $user = User::query()->find($this->userId);
            if (! $user) return;

            $topic = $this->topicId ? CurriculumTopic::query()->find($this->topicId) : null;

            // Descubre (IA + LRCLIB + YouTube) y guarda en el catálogo para la próxima vez
            $service->getActivityFor($user, $topic);
        } catch (\Throwable $e) {
            Log::warning(static::class . ' falló: ' . $e->getMessage());
        }
    }
}