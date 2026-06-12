<?php

namespace App\Jobs;

use App\Models\User;
use App\Services\Listening\ClipActivityService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class DiscoverClipJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public int $userId,
    ) {}

    public function handle(ClipActivityService $service): void
    {
        $user = User::query()->find($this->userId);
        if (! $user) return;

        // Descubre (IA + YouTube + captions) y guarda en el catálogo para la próxima vez
        $service->getActivityFor($user);
    }
}
