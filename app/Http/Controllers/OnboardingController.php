<?php

namespace App\Http\Controllers;

use App\Services\AI\AIContextBuilderService;
use App\Services\AI\AIProviderService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Inertia\Inertia;
use Inertia\Response;

class OnboardingController extends Controller
{

    public function __construct(
        private AIProviderService       $ai,
        private AIContextBuilderService $context,
    ) {}

    public function index(Request $request): Response
    {
        return Inertia::render('Onboarding/Index', [
            'user' => $request->user()->only('id', 'name'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        // 1. Validamos TODOS los pasos que vienen de React
        $validated = $request->validate([
            'goal'           => 'required|string|in:work,travel,school,general',
            'learning_style' => 'required|string|in:visual,conversational,reading_writing,exercises',
            'personality'    => 'required|string|in:extrovert,ambivert,introvert',
            'interests'      => 'required|array|min:1', // Es un arreglo por las burbujas
            'interests.*'    => 'string', // Cada interés debe ser texto
            'time_per_day'   => 'required|string|in:10_15,20_30,30_60,60_plus',
            'age_group'      => 'required|string|in:under_18,18_25,26_35,36_plus',
            'current_level'  => 'required|string|in:beginner,elementary,intermediate,advanced',
        ]);

        $profile = $request->user()->learningProfile;

        // 2. Guardamos la data estructurada en la columna JSON
        $profile->update([
            'learning_style' => array_merge($profile->learning_style ?? [], [
                'goal'           => $validated['goal'],
                'preferred'      => $validated['learning_style'],
                'personality'    => $validated['personality'],
                'interests'      => $validated['interests'], // Guardamos el arreglo de gustos
                'time_per_day'   => $validated['time_per_day'],
                'age_group'      => $validated['age_group'],
                'self_assessed_level' => $validated['current_level'],
            ]),
            'onboarding_done' => true,
        ]);

        return redirect()->route('placement');
    }

    public function getInterests(Request $request)
    {
        $topic = $request->input('topic');
        $category = $request->input('category'); // 'Music', 'Movies', 'Video Games'

        // NIVEL 1: Categorías iniciales fijas
        if (empty($topic)) {
            return response()->json([
                'topics' => ['Music', 'Movies & TV', 'Video Games', 'Sports & Fitness', 'Food & Cooking']
            ]);
        }

        // Usamos caché de 24 horas para no saturar las APIs externas con las mismas búsquedas
        return Cache::remember("interests_" . md5($topic . $category), 86400, function () use ($topic, $category) {
            try {
                switch ($category) {
                    case 'Music':
                        return response()->json(['topics' => $this->fetchMusicData($topic)]);

                    case 'Movies & TV':
                        return response()->json(['topics' => $this->fetchTMDBData($topic)]);

                    case 'Video Games':
                        return response()->json(['topics' => $this->fetchRAWGData($topic)]);

                    case 'Sports & Fitness':
                        return response()->json(['topics' => $this->fetchSportsData($topic)]);

                    case 'Food & Cooking':
                        return response()->json(['topics' => $this->fetchFoodData($topic)]);

                    default:
                        return response()->json(['topics' => $this->getStaticFallback($topic)]);
                }
            } catch (\Exception $e) {
                return response()->json(['topics' => []]);
            }
        });
    }

    private function fetchMusicData($query)
    {
        $musicGenres = ['Rock', 'Pop', 'Rap & Hip-Hop', 'Electronic', 'Jazz', 'Classical', 'Latin'];
        $ua          = 'CapuchinoEnglishApp/1.0 (alejocapuchinom@gmail.com)';

        // Nivel 1: Raíz
        if ($query === 'Music') {
            return $musicGenres;
        }

        // Nivel 2: Género → artistas populares con ese tag
        if (in_array($query, $musicGenres)) {
            $tagMap = ['Rap & Hip-Hop' => 'hip-hop', 'Electronic' => 'electronic'];
            $tag    = $tagMap[$query] ?? strtolower($query);

            $response = Http::withUserAgent($ua)
                ->get('https://musicbrainz.org/ws/2/artist/', [
                    'query' => "tag:{$tag}",
                    'fmt'   => 'json',
                    'limit' => 6,
                ]);

            return collect($response->json()['artists'] ?? [])->pluck('name')->toArray();
        }

        // Nivel 3: Artista → buscar, obtener sus tags → artistas similares
        $searchResp = Http::withUserAgent($ua)
            ->get('https://musicbrainz.org/ws/2/artist/', [
                'query' => "artist:{$query}",
                'fmt'   => 'json',
                'limit' => 1,
            ]);

        $artist = ($searchResp->json()['artists'] ?? [])[0] ?? null;
        if (!$artist) return [];

        $tags = collect($artist['tags'] ?? [])
            ->sortByDesc('count')
            ->take(2)
            ->pluck('name');

        if ($tags->isEmpty()) return [];

        $tagQuery = 'tag:' . $tags->implode(' OR tag:');

        $similarResp = Http::withUserAgent($ua)
            ->get('https://musicbrainz.org/ws/2/artist/', [
                'query' => $tagQuery,
                'fmt'   => 'json',
                'limit' => 8,
            ]);

        return collect($similarResp->json()['artists'] ?? [])
            ->pluck('name')
            ->filter(fn($name) => $name !== $query)
            ->take(6)
            ->values()
            ->toArray();
    }

    private function fetchTMDBData($query)
    {
        // 1. Raíz de la categoría
        if ($query === 'Movies & TV') {
            return ['Action', 'Sci-Fi', 'Horror', 'Comedy', 'Drama', 'Documentaries'];
        }

        $tmdbGenres = [
            'Action' => 28,
            'Sci-Fi' => 878,
            'Horror' => 27,
            'Comedy' => 35,
            'Drama' => 18,
            'Documentaries' => 99
        ];

        // 2. BUSCAR POR GÉNERO (Nivel 2)
        if (array_key_exists($query, $tmdbGenres)) {
            $response = Http::withToken(env('TMDB_BEARER_TOKEN'))
                ->get('https://api.themoviedb.org/3/discover/movie', [
                    'with_genres' => $tmdbGenres[$query],
                    'sort_by' => 'popularity.desc',
                    'page' => 1
                ]);
            return collect($response->json()['results'])->take(6)->pluck('title')->toArray();
        }

        // 3. BUSCAR RECOMENDACIONES (Nivel 3)
        // Primero, buscamos el ID de la película que seleccionó el usuario
        $search = Http::withToken(env('TMDB_BEARER_TOKEN'))
            ->get('https://api.themoviedb.org/3/search/movie', ['query' => $query]);

        $movieId = $search->json()['results'][0]['id'] ?? null;

        if ($movieId) {
            // Obtenemos recomendaciones basadas en esa película específica
            $response = Http::withToken(env('TMDB_BEARER_TOKEN'))
                ->get("https://api.themoviedb.org/3/movie/{$movieId}/recommendations");

            $results = $response->json()['results'] ?? [];

            // Filtramos para que no salga la misma película que seleccionó
            return collect($results)
                ->where('title', '!=', $query)
                ->take(6)
                ->pluck('title')
                ->toArray();
        }

        return [];
    }

    private function fetchRAWGData($query)
    {
        $gameGenres = [
            'RPG'       => 'role-playing-games-rpg',
            'Shooter'   => 'shooter',
            'Adventure' => 'adventure',
            'Strategy'  => 'strategy',
            'Puzzle'    => 'puzzle',
            'Sports'    => 'sports',
        ];
        $apiKey = env('RAWG_API_KEY');
        $base   = 'https://api.rawg.io/api';

        // Nivel 1: Raíz
        if ($query === 'Video Games') {
            return array_keys($gameGenres);
        }

        // Nivel 2: Género → juegos populares
        if (array_key_exists($query, $gameGenres)) {
            $response = Http::get("{$base}/games", [
                'key'       => $apiKey,
                'genres'    => $gameGenres[$query],
                'ordering'  => '-rating',
                'page_size' => 6,
            ]);

            return collect($response->json()['results'] ?? [])->pluck('name')->toArray();
        }

        // Nivel 3: Juego → buscar → juegos del mismo género
        $searchResp = Http::get("{$base}/games", [
            'key'       => $apiKey,
            'search'    => $query,
            'page_size' => 1,
        ]);

        $game = ($searchResp->json()['results'] ?? [])[0] ?? null;
        if (!$game) return [];

        $genreSlugs = collect($game['genres'] ?? [])->pluck('slug')->implode(',');

        $similarResp = Http::get("{$base}/games", [
            'key'       => $apiKey,
            'genres'    => $genreSlugs,
            'ordering'  => '-rating',
            'page_size' => 8,
        ]);

        return collect($similarResp->json()['results'] ?? [])
            ->pluck('name')
            ->filter(fn($name) => $name !== $query)
            ->take(6)
            ->values()
            ->toArray();
    }

    private function fetchSportsData(string $query): array
    {
        $sportTypes = ['Football', 'Basketball', 'Tennis', 'Baseball', 'Cycling', 'Running'];
        $sportMap   = [
            'Football'   => 'Soccer',
            'Basketball' => 'Basketball',
            'Tennis'     => 'Tennis',
            'Baseball'   => 'Baseball',
            'Cycling'    => 'Cycling',
            'Running'    => 'Athletics',
        ];
        $base = 'https://www.thesportsdb.com/api/v1/json/3';

        // Nivel 1: Raíz
        if ($query === 'Sports & Fitness') {
            return $sportTypes;
        }

        // Nivel 2: Deporte → ligas/competiciones populares
        if (in_array($query, $sportTypes)) {
            $apiSport = $sportMap[$query] ?? $query;
            $response = Http::get("{$base}/search_all_leagues.php", ['s' => $apiSport]);

            return collect($response->json()['countrys'] ?? [])
                ->filter(fn($l) => !empty($l['strLeague']))
                ->take(6)
                ->pluck('strLeague')
                ->values()
                ->toArray();
        }

        // Nivel 3: Liga → equipos de esa liga
        $response = Http::get("{$base}/search_all_teams.php", ['l' => $query]);

        return collect($response->json()['teams'] ?? [])
            ->take(6)
            ->pluck('strTeam')
            ->toArray();
    }

    private function fetchFoodData(string $query): array
    {
        $foodCategories = ['Chicken', 'Seafood', 'Beef', 'Pasta', 'Vegetarian', 'Dessert', 'Breakfast', 'Vegan'];
        $base = 'https://www.themealdb.com/api/json/v1/1';

        // Nivel 1: Raíz
        if ($query === 'Food & Cooking') {
            return $foodCategories;
        }

        // Nivel 2: Categoría → platos populares
        if (in_array($query, $foodCategories)) {
            $response = Http::get("{$base}/filter.php", ['c' => $query]);

            return collect($response->json()['meals'] ?? [])
                ->take(6)
                ->pluck('strMeal')
                ->toArray();
        }

        // Nivel 3: Plato → buscar, obtener su categoría → más platos similares
        $searchResp = Http::get("{$base}/search.php", ['s' => $query]);
        $meal = ($searchResp->json()['meals'] ?? [])[0] ?? null;

        if (!$meal) return [];

        $moreResp = Http::get("{$base}/filter.php", ['c' => $meal['strCategory']]);

        return collect($moreResp->json()['meals'] ?? [])
            ->pluck('strMeal')
            ->filter(fn($name) => $name !== $query)
            ->shuffle()
            ->take(6)
            ->values()
            ->toArray();
    }

    private function getStaticFallback(string $topic): array
    {
        $map = [
            'Sports & Fitness' => ['Football', 'Basketball', 'Tennis', 'Swimming', 'Cycling', 'Running'],
            'Food & Cooking'   => ['Italian cuisine', 'Asian food', 'Baking', 'Vegetarian', 'BBQ & Grilling', 'Sushi'],
            'Football'         => ['Premier League', 'Champions League', 'World Cup', 'La Liga', 'MLS'],
            'Basketball'       => ['NBA', 'FIBA', 'Street basketball', 'Fantasy basketball', 'EuroLeague'],
            'Tennis'           => ['Grand Slams', 'ATP Tour', 'WTA Tour', 'Wimbledon', 'US Open'],
        ];

        return $map[$topic] ?? [];
    }
}
