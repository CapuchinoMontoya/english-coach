<?php

namespace App\Services\AI\Providers;

use App\Services\AI\Contracts\AIProvider;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class ClaudeProvider implements AIProvider
{
    public function __construct(
        private readonly string $apiKey,
        private readonly string $model,
    ) {}

    public function complete(string $systemPrompt, array $messages, int $maxTokens = 1024): string
    {
        $response = Http::withHeaders($this->headers())
            ->timeout(120)
            ->post('https://api.anthropic.com/v1/messages', [
                'model'      => $this->model,
                'max_tokens' => $maxTokens,
                'system'     => $systemPrompt,
                'messages'   => $messages,
            ]);

        if (! $response->successful()) {
            throw new RuntimeException("Claude API error {$response->status()}: {$response->body()}");
        }

        return $response->json('content.0.text', '');
    }

    public function stream(string $systemPrompt, array $messages, int $maxTokens = 1024): \Generator
    {
        $response = Http::withHeaders($this->headers())
            ->withOptions(['stream' => true, 'read_timeout' => 120])
            ->post('https://api.anthropic.com/v1/messages', [
                'model'      => $this->model,
                'max_tokens' => $maxTokens,
                'system'     => $systemPrompt,
                'messages'   => $messages,
                'stream'     => true,
            ]);

        if (! $response->successful()) {
            throw new RuntimeException("Claude stream error {$response->status()}");
        }

        $body   = $response->getBody();
        $buffer = '';

        while (! $body->eof()) {
            $buffer .= $body->read(8192);

            while (($pos = strpos($buffer, "\n")) !== false) {
                $line   = trim(substr($buffer, 0, $pos));
                $buffer = substr($buffer, $pos + 1);

                if (! str_starts_with($line, 'data: ')) continue;

                $json = substr($line, 6);
                if ($json === '[DONE]') return;

                $data = json_decode($json, true);
                if (! $data) continue;

                if (
                    ($data['type'] ?? '') === 'content_block_delta' &&
                    ($data['delta']['type'] ?? '') === 'text_delta'
                ) {
                    yield $data['delta']['text'];
                }

                if (($data['type'] ?? '') === 'message_stop') return;
            }
        }
    }

    private function headers(): array
    {
        return [
            'x-api-key'         => $this->apiKey,
            'anthropic-version' => '2023-06-01',
            'content-type'      => 'application/json',
        ];
    }
}