<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WordOfTheDayService
{
    /**
     * Obtiene la palabra del día de forma completamente aleatoria usando Datamuse y DictionaryAPI,
     * o recurre al JSON local si las APIs fallan.
     */
    public function getWordOfTheDay(): array
    {
        $cacheKey = "word_of_the_day_" . now()->toDateString();

        return Cache::remember($cacheKey, now()->endOfDay(), function () {
            
            $wordLevels = $this->loadWordLevels();

            $maxAttempts = 3;

            for ($i = 0; $i < $maxAttempts; $i++) {
                try {
                    $randomLetter = chr(rand(97, 122));
                    $wordResponse = Http::timeout(3)->get("https://api.datamuse.com/words?sp={$randomLetter}*&max=50");

                    if ($wordResponse->successful()) {
                        $wordsArray = $wordResponse->json();

                        if (!empty($wordsArray)) {
                            $randomIndex = array_rand($wordsArray);
                            $word = strtolower($wordsArray[$randomIndex]['word']);

                            // 3. Consultamos la API del diccionario para esa palabra
                            $dictResponse = Http::timeout(3)->get("https://api.dictionaryapi.dev/api/v2/entries/en/{$word}");

                            if ($dictResponse->successful()) {
                                $data = $dictResponse->json()[0];
                                
                                // Asignamos el nivel desde nuestro JSON, o C1 por defecto si no existe ahí
                                $wordLevel = $wordLevels[$word] ?? 'C1';

                                return $this->formatDictionaryData($word, $data, $wordLevel);
                            }
                        }
                    }
                } catch (\Exception $e) {
                    // Si alguna API falla, registramos el error y el ciclo intentará de nuevo
                    Log::warning("Fallo en las APIs para obtener palabra aleatoria: " . $e->getMessage());
                    continue; 
                }
            }

            // 4. Si después de 3 intentos fallaron las APIs, tomamos una palabra aleatoria de todo el JSON
            return $this->getFallbackFromJson($wordLevels);
        });
    }

    /**
     * Carga el archivo JSON local y lo convierte en un mapa de [palabra => nivel]
     */
    private function loadWordLevels(): array
    {
        $jsonPath = storage_path('app/cefr_words.json');
        $wordLevels = [];

        if (file_exists($jsonPath)) {
            $jsonContent = json_decode(file_get_contents($jsonPath), true);

            if (is_array($jsonContent)) {
                foreach ($jsonContent as $item) {
                    if (isset($item['value']['word']) && isset($item['value']['level'])) {
                        $wordLevels[strtolower($item['value']['word'])] = strtoupper($item['value']['level']);
                    }
                }
            }
        }

        return $wordLevels;
    }

    /**
     * Formatea la respuesta de la API para que coincida con tu estructura.
     */
    private function formatDictionaryData(string $word, array $data, string $level): array
    {
        // Extraer significados
        $meaningsList = [];
        if (!empty($data['meanings'])) {
            foreach ($data['meanings'] as $meaning) {
                $meaningsList[] = [
                    'type' => $meaning['partOfSpeech'] ?? 'word',
                    'definition' => $meaning['definitions'][0]['definition'] ?? 'No definition available.'
                ];
            }
        }

        // Extraer fonética (buscamos la primera que tenga texto)
        $phonetic = '';
        if (!empty($data['phonetics'])) {
            foreach ($data['phonetics'] as $p) {
                if (!empty($p['text'])) {
                    $phonetic = $p['text'];
                    break;
                }
            }
        }
        $phonetic = $phonetic ?: '/' . $word . '/'; // Fonética por defecto si no viene en la API

        return [
            'word' => $word,
            'pronunciation' => $phonetic,
            'meanings' => $meaningsList,
            'level' => $level,
        ];
    }

    /**
     * Si las APIs fallan, toma una palabra completamente al azar de todo el JSON.
     */
    private function getFallbackFromJson(array $wordLevels): array
    {
        $words = array_keys($wordLevels);

        if (!empty($words)) {
            $word = $words[array_rand($words)];
            $level = $wordLevels[$word];
        } else {
            // Palabra final de emergencia si el JSON no existe o está vacío
            $word = 'resilience';
            $level = 'B2';
        }

        return [
            'word' => $word,
            'pronunciation' => '/' . $word . '/',
            'meanings' => [
                [
                    'type' => 'word',
                    'definition' => 'Definition unavailable at the moment. (Offline mode)'
                ]
            ],
            'level' => strtoupper($level),
        ];
    }
}