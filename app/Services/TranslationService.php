<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache; 
use Exception;

class TranslationService
{
    protected string $apiKey;
    protected string $apiUrl = 'https://api-free.deepl.com/v2/translate';

    public function __construct()
    {
        $this->apiKey = env('DEEPL_API_KEY'); 
    }

    public function translateHtml(string $html, string $targetLang = 'ES'): string
    {
        $cacheKey = 'deepl_trans_' . md5($html . '_' . strtolower($targetLang));

        return Cache::remember($cacheKey, now()->addMonths(6), function () use ($html, $targetLang) {
            
            $response = Http::withHeaders([
                'Authorization' => 'DeepL-Auth-Key ' . $this->apiKey,
            ])->post($this->apiUrl, [
                'text' => [$html],
                'target_lang' => strtoupper($targetLang),
                'tag_handling' => 'html',
            ]);

            if ($response->successful()) {
                return $response->json()['translations'][0]['text'];
            }

            throw new Exception('Error al conectar con la API de DeepL: ' . $response->body());
        });
    }
}