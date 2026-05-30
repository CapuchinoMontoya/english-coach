<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    /**
     * Show the login page.
     */
    public function create(Request $request): Response
    {
        $wordOfTheDay = Cache::remember('word_of_the_day', now()->endOfDay(), function () {
            $jsonPath = storage_path('app/cefr_words.json');
            $wordLevels = [];

            if (file_exists($jsonPath)) {
                $jsonContent = json_decode(file_get_contents($jsonPath), true);

                if (is_array($jsonContent)) {
                    foreach ($jsonContent as $item) {
                        if (isset($item['value']['word']) && isset($item['value']['level'])) {
                            $wordLevels[strtolower($item['value']['word'])] = $item['value']['level'];
                        }
                    }
                }
            }

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
                            $dictResponse = Http::timeout(3)->get("https://api.dictionaryapi.dev/api/v2/entries/en/{$word}");

                            if ($dictResponse->successful()) {
                                $data = $dictResponse->json()[0];
                                $meaningsList = [];
                                if (!empty($data['meanings'])) {
                                    foreach ($data['meanings'] as $meaning) {
                                        $meaningsList[] = [
                                            'type' => $meaning['partOfSpeech'] ?? 'word',
                                            'definition' => $meaning['definitions'][0]['definition'] ?? 'No definition available.'
                                        ];
                                    }
                                }

                                $phonetic = '';
                                if (!empty($data['phonetics'])) {
                                    foreach ($data['phonetics'] as $p) {
                                        if (!empty($p['text'])) {
                                            $phonetic = $p['text'];
                                            break;
                                        }
                                    }
                                }
                                $phonetic = $phonetic ?: '/' . $word . '/';

                                $level = $wordLevels[$word] ?? 'C1';

                                return [
                                    'word' => $word,
                                    'pronunciation' => $phonetic,
                                    'meanings' => $meaningsList,
                                    'level' => $level,
                                ];
                            }
                        }
                    }
                } catch (\Exception $e) {
                    continue; 
                }
            }

            return [
                'word' => 'resilience',
                'pronunciation' => '/rɪˈzɪl.jəns/',
                'meanings' => [
                    [
                        'type' => 'noun',
                        'definition' => 'The capacity to recover quickly from difficulties; toughness.'
                    ]
                ],
                'level' => 'B2',
            ];
        });
        return Inertia::render('auth/login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => $request->session()->get('status'),
            'wordOfTheDay' => $wordOfTheDay,
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        $request->authenticate();

        $request->session()->regenerate();

        return redirect()->intended(route('dashboard', absolute: false));
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }
}
