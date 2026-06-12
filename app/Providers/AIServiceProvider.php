<?php

namespace App\Providers;

use App\Services\AI\AIProviderService;
use App\Services\AI\AIContextBuilderService;
use App\Services\AI\SessionOrchestratorService;
use App\Services\Listening\ClipActivityService;
use App\Services\Listening\ListeningActivityService;
use App\Services\Listening\LrcLibService;
use App\Services\Listening\YouTubeCaptionService;
use App\Services\Listening\YouTubeFinderService;
use Illuminate\Support\ServiceProvider;

class AIServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(AIProviderService::class);
        $this->app->singleton(AIContextBuilderService::class);
        $this->app->singleton(SessionOrchestratorService::class);
        $this->app->singleton(LrcLibService::class);
        $this->app->singleton(YouTubeFinderService::class);
        $this->app->singleton(YouTubeCaptionService::class);
        $this->app->singleton(ListeningActivityService::class);
        $this->app->singleton(ClipActivityService::class);
    }
}
