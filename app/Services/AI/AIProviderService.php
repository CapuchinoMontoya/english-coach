<?php

namespace App\Services\AI;

use App\Services\AI\Contracts\AIProvider;
use App\Services\AI\Providers\ClaudeProvider;
use App\Services\AI\Providers\GeminiProvider;
use InvalidArgumentException;

class AIProviderService
{
    // Cache de instancias — no creamos el mismo provider dos veces
    private array $resolved = [];

    /**
     * Retorna el provider correcto para la tarea.
     * La tarea viene de config/ai.php → providers.{task}
     */
    public function for(string $task): AIProvider
    {
        $name = config("ai.providers.{$task}")
            ?? throw new InvalidArgumentException("Sin provider para la tarea: [{$task}]");

        return $this->resolved[$name] ??= $this->make($name);
    }

    public function complete(string $task, string $systemPrompt, array $messages, int $maxTokens = 1024): string
    {
        return $this->for($task)->complete($systemPrompt, $messages, $maxTokens);
    }

    public function stream(string $task, string $systemPrompt, array $messages, int $maxTokens = 1024): \Generator
    {
        return $this->for($task)->stream($systemPrompt, $messages, $maxTokens);
    }

    private function make(string $provider): AIProvider
    {
        return match ($provider) {
            'claude' => new ClaudeProvider(
                apiKey: config('ai.claude.api_key'),
                model:  config('ai.claude.model'),
            ),
            'gemini' => new GeminiProvider(
                apiKey: config('ai.gemini.api_key'),
                model:  config('ai.gemini.model'),
            ),
            default  => throw new InvalidArgumentException("Provider desconocido: [{$provider}]"),
        };
    }
}