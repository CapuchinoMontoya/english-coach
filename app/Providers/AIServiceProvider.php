<?php

namespace App\Providers;

use App\Services\AI\AIProviderService;
use App\Services\AI\AIContextBuilderService;
use App\Services\AI\SessionOrchestratorService;
use Illuminate\Support\ServiceProvider;

class AIServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(AIProviderService::class);
        $this->app->singleton(AIContextBuilderService::class);
        $this->app->singleton(SessionOrchestratorService::class);
    }
}