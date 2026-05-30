<?php

namespace App\Services\AI\Providers;

use App\Services\AI\Contracts\AIProvider;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class GeminiProvider implements AIProvider
{
    private const BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

    public function __construct(
        private readonly string $apiKey,
        private readonly string $model,
    ) {}

    public function complete(string $systemPrompt, array $messages, int $maxTokens = 1024): string
    {
        $response = Http::timeout(60)
            ->post(self::BASE . "/{$this->model}:generateContent?key={$this->apiKey}",
                $this->buildBody($systemPrompt, $messages, $maxTokens)
            );

        if (! $response->successful()) {
            throw new RuntimeException("Gemini API error {$response->status()}: {$response->body()}");
        }

        return $response->json('candidates.0.content.parts.0.text', '');
    }

    public function stream(string $systemPrompt, array $messages, int $maxTokens = 1024): \Generator
    {
        // alt=sse activa el formato Server-Sent Events en Gemini
        $response = Http::withOptions(['stream' => true, 'read_timeout' => 60])
            ->post(self::BASE . "/{$this->model}:streamGenerateContent?alt=sse&key={$this->apiKey}",
                $this->buildBody($systemPrompt, $messages, $maxTokens)
            );

        if (! $response->successful()) {
            throw new RuntimeException("Gemini stream error {$response->status()}");
        }

        $body   = $response->getBody();
        $buffer = '';

        while (! $body->eof()) {
            $buffer .= $body->read(8192);

            while (($pos = strpos($buffer, "\n")) !== false) {
                $line   = trim(substr($buffer, 0, $pos));
                $buffer = substr($buffer, $pos + 1);

                if (! str_starts_with($line, 'data: ')) continue;

                $data = json_decode(substr($line, 6), true);
                if (! $data) continue;

                $text = $data['candidates'][0]['content']['parts'][0]['text'] ?? null;
                if ($text !== null) yield $text;
            }
        }
    }

    /**
     * Normaliza el formato de Claude (estándar interno) al formato de Gemini.
     * Los mensajes siempre viajan en formato Claude internamente.
     */
    private function buildBody(string $systemPrompt, array $messages, int $maxTokens): array
    {
        return [
            'systemInstruction' => [
                'parts' => [['text' => $systemPrompt]],
            ],
            'contents' => array_map(fn ($msg) => [
                'role'  => $msg['role'] === 'assistant' ? 'model' : 'user',
                'parts' => [['text' => $msg['content']]],
            ], $messages),
            'generationConfig' => [
                'maxOutputTokens' => $maxTokens,
                'temperature'     => 0.7,
            ],
        ];
    }
}