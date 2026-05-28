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

            $maxAttempts = 3; // Intentamos 3 veces por si la API nos da una palabra rara que no está en el diccionario

            for ($i = 0; $i < $maxAttempts; $i++) {
                $wordResponse = Http::timeout(3)->get('https://random-word-api.herokuapp.com/word');

                if ($wordResponse->successful()) {
                    $word = $wordResponse->json()[0];

                    $dictResponse = Http::timeout(3)->get("https://api.dictionaryapi.dev/api/v2/entries/en/{$word}");

                    if ($dictResponse->successful()) {
                        $data = $dictResponse->json()[0];
                        $meaning = $data['meanings'][0];
                        $phonetic = '';
                        if (!empty($data['phonetics'])) {
                            foreach ($data['phonetics'] as $p) {
                                if (!empty($p['text'])) {
                                    $phonetic = $p['text'];
                                    break; // ¡Lo encontramos! Detenemos la búsqueda
                                }
                            }
                        }
                        $phonetic = $phonetic ?: '/' . $word . '/';
                        $type = $meaning['partOfSpeech'] ?? 'word';
                        $definition = $meaning['definitions'][0]['definition'] ?? 'No definition available.';
                        $levels = ['A2', 'B1', 'B2', 'C1'];
                        $level = $levels[array_rand($levels)];

                        return [
                            'word' => $word,
                            'pronunciation' => $phonetic,
                            'type' => $type,
                            'definition' => $definition,
                            'level' => $level,
                        ];
                    }
                }
            }

            // 4. Palabra "salvavidas" (Fallback). 
            // Si las dos APIs se caen a nivel mundial, tu página no va a explotar, mostrará esta.
            return [
                'word' => 'resilience',
                'pronunciation' => '/rɪˈzɪl.jəns/',
                'type' => 'noun',
                'definition' => 'The capacity to recover quickly from difficulties; toughness.',
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
