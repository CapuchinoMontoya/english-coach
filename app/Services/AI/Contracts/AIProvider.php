<?php

namespace App\Services\AI\Contracts;

interface AIProvider
{
    /**
     * Respuesta completa — para jobs, evaluaciones, word of the day.
     */
    public function complete(string $systemPrompt, array $messages, int $maxTokens = 1024): string;

    /**
     * Streaming — para el chat en tiempo real.
     * Yields chunks de texto conforme llegan.
     */
    public function stream(string $systemPrompt, array $messages, int $maxTokens = 1024): \Generator;
}