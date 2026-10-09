<?php

namespace App\Services\Listening;

use App\Models\CurriculumTopic;
use App\Models\LearningSession;
use App\Models\ListeningActivity;
use App\Models\User;
use App\Services\AI\AIProviderService;
use Illuminate\Support\Facades\DB;

class ListeningActivityService
{
    // Cada cuántas lecciones se ofrece una actividad de listening.
    private const CADENCE = 2;

    public function __construct(
        private AIProviderService    $ai,
        private LrcLibService        $lrclib,
        private YouTubeFinderService $youtube,
    ) {}

    // ── ¿Toca una actividad de listening ahora? ───────────────────────────────
    public function shouldSuggest(User $user): bool
    {
        // La actividad de canciones es rellenar huecos eligiendo entre palabras casi
        // homófonas: discriminar pares mínimos en habla rápida es una destreza de B1.
        // En A1 eso no es práctica, es ruido (y el catálogo no tiene canciones A1).
        // Siguen disponibles en la biblioteca libre, sin calificación ni presión.
        $level = strtoupper($user->learningProfile->real_level ?? 'B1');
        if (in_array($level, ['A0', 'A1'], true)) return false;

        $completed = LearningSession::query()->where('user_id', $user->id)
            ->where('mode', 'lesson')
            ->whereNotNull('score')
            ->count();

        return $completed > 0 && $completed % self::CADENCE === 0;
    }

    // ── Lookup instantáneo en caché (sin discovery, para no frenar el submit) ──
    public function getCached(User $user): ?ListeningActivity
    {
        $level     = $user->learningProfile->real_level ?? 'B1';
        $interests = $user->learningProfile->learning_style['interests'] ?? [];

        return $this->findCached($user, $level, $interests);
    }

    // ── Buscar en YouTube + LRCLIB y crear la actividad (canciones ilimitadas) ─
    /**
     * El usuario busca una canción por texto. Buscamos la letra sincronizada en
     * LRCLIB y el audio oficial en YouTube que cuadre en duración; si ambos
     * empatan, creamos la actividad y la agregamos al catálogo.
     *
     * Devuelve ['status' => 'created'|'exists'|'no_lyrics'|'no_video', 'activity' => ?]
     */
    public function createFromSearch(User $user, string $query): array
    {
        $level = $user->learningProfile->real_level ?? 'B1';

        // 1. Letra sincronizada + metadatos canónicos (tolerante a caídas de LRCLIB)
        try {
            $lyrics = $this->lrclib->searchQuery($query);
        } catch (\Throwable) {
            $lyrics = null;
        }
        if (! $lyrics || empty($lyrics['synced_lyrics']) || $lyrics['artist'] === '' || $lyrics['title'] === '') {
            return ['status' => 'no_lyrics'];
        }

        $artist = $lyrics['artist'];
        $title  = $lyrics['title'];

        // 2. ¿Ya existe en el catálogo? → reutiliza (reactiva si estaba oculta)
        $existing = ListeningActivity::query()
            ->where('type', 'song')
            ->whereRaw('LOWER(artist) = ?', [mb_strtolower($artist)])
            ->whereRaw('LOWER(title) = ?', [mb_strtolower($title)])
            ->first();

        if ($existing) {
            if (! $existing->is_active) $existing->update(['is_active' => true]);
            return ['status' => 'exists', 'activity' => $existing];
        }

        // 3. Audio oficial en YouTube que sincronice con la letra (tolerante a red)
        try {
            $video = $this->youtube->findBestMatch($artist, $title, (int) $lyrics['duration']);
        } catch (\Throwable) {
            $video = null;
        }
        if (! $video) {
            return ['status' => 'no_video'];
        }

        // 4. Crear la actividad
        $activity = ListeningActivity::create([
            'type'             => 'song',
            'title'            => $title,
            'artist'           => $artist,
            'youtube_video_id' => $video['video_id'],
            'lrclib_id'        => $lyrics['lrclib_id'],
            'duration'         => $lyrics['duration'],
            'offset_seconds'   => $video['offset'] ?? 0,
            'synced_lyrics'    => $lyrics['synced_lyrics'],
            'level'            => $level,
            'tags'             => [$artist],
            'source'           => 'lrclib',
            'is_active'        => true,
        ]);

        return ['status' => 'created', 'activity' => $activity];
    }

    // ── Obtener una actividad: caché primero, discovery si hace falta ──────────
    public function getActivityFor(User $user, ?CurriculumTopic $topic = null): ?ListeningActivity
    {
        $level     = $user->learningProfile->real_level ?? 'B1';
        $interests = $user->learningProfile->learning_style['interests'] ?? [];

        // 1. Intentar desde caché (canción que matchee intereses + nivel, no jugada)
        if ($cached = $this->findCached($user, $level, $interests)) {
            $this->ensureBlanksForLevel($cached, $level, $topic);
            return $cached;
        }

        // 2. Discovery (consume API + algo de IA, pero se cachea para siempre)
        return $this->discover($user, $level, $interests, $topic);
    }

    // ── Buscar en la BD una canción adecuada ya lista ─────────────────────────
    private function findCached(User $user, string $level, array $interests): ?ListeningActivity
    {
        if (empty($interests)) return null;

        $playedIds = DB::table('listening_activity_user')
            ->where('user_id', $user->id)
            ->where('source', 'lesson')   // solo las jugadas DESDE lecciones bloquean
            ->pluck('listening_activity_id')
            ->all();

        // Busca por solapamiento de tags con los intereses, no jugada. Primero el nivel
        // exacto; si el catálogo no tiene ese nivel (p. ej. A1), cae a niveles vecinos.
        foreach (self::levelLadder($level) as $lvl) {
            $match = ListeningActivity::active()
                ->where('type', 'song')
                ->where('level', $lvl)
                ->whereNotIn('id', $playedIds)
                ->get()
                ->first(fn ($a) => count(array_intersect(
                    array_map('mb_strtolower', $a->tags ?? []),
                    array_map('mb_strtolower', $interests)
                )) > 0);
            if ($match) return $match;
        }

        return null;
    }

    /** Nivel pedido primero, luego los vecinos más cercanos (A1 → A2 → B1 …). */
    public static function levelLadder(string $level): array
    {
        $order = ['A1', 'A2', 'B1', 'B2', 'C1'];
        $i     = array_search(strtoupper($level), $order, true);
        if ($i === false) return [$level, 'A2', 'B1'];

        $ladder = [$order[$i]];
        for ($d = 1; $d < count($order); $d++) {
            if (isset($order[$i + $d])) $ladder[] = $order[$i + $d];
            if (isset($order[$i - $d])) $ladder[] = $order[$i - $d];
        }
        return $ladder;
    }

    // ── Discovery: IA sugiere → LRCLIB → YouTube → guardar ────────────────────
    private function discover(User $user, string $level, array $interests, ?CurriculumTopic $topic): ?ListeningActivity
    {
        $grammarFocus = $topic?->title;

        $prompt = view('ai.prompts.song_suggestion', [
            'level'        => $level,
            'interests'    => $interests,
            'grammarFocus' => $grammarFocus,
            'count'        => 6,
        ])->render();

        $raw  = $this->ai->complete('activity', $prompt,
            [['role' => 'user', 'content' => 'Suggest the songs now.']], 800);
        $json = $this->extractJson($raw);

        foreach ($json['songs'] ?? [] as $song) {
            $artist = $song['artist'] ?? null;
            $track  = $song['track']  ?? null;
            if (! $artist || ! $track) continue;

            // ¿Ya existe en la BD? (otro usuario pudo haberla traído)
            $existing = ListeningActivity::query()->where('artist', $artist)
                ->where('title', $track)
                ->first();
            if ($existing) {
                $this->ensureBlanksForLevel($existing, $level, $topic);
                return $existing;
            }

            // LRCLIB
            $lyrics = $this->lrclib->fetch($artist, $track) ?? $this->lrclib->search($artist, $track);
            if (! $lyrics) continue;

            // YouTube con duración matcheada
            $video = $this->youtube->findBestMatch($artist, $track, $lyrics['duration']);
            if (! $video) continue;

            // Guardar el activo permanente
            $activity = ListeningActivity::create([
                'title'            => $track,
                'artist'           => $artist,
                'youtube_video_id' => $video['video_id'],
                'lrclib_id'        => $lyrics['lrclib_id'],
                'duration'         => $lyrics['duration'],
                'offset_seconds'   => $video['offset'] ?? 0,
                'synced_lyrics'    => $lyrics['synced_lyrics'],
                'level'            => $level,
                'tags'             => $song['tags'] ?? [$artist],
                'source'           => 'lrclib',
                'is_active'        => true,
            ]);

            $this->ensureBlanksForLevel($activity, $level, $topic);
            return $activity;
        }

        return null; // ningún candidato cuajó
    }

    // ── Generar blanks para un nivel solo si no existen (lazy, ahorra tokens) ──
    public function ensureBlanksForLevel(ListeningActivity $activity, string $level, ?CurriculumTopic $topic = null): void
    {
        $byLevel = $activity->blanks_by_level ?? [];
        if (isset($byLevel[$level])) return; // ya está cacheado

        $lines = collect($activity->synced_lyrics)
            ->map(fn ($l) => ['text' => $l['text']])->values()->all();

        $prompt = view('ai.prompts.listening_blanks', [
            'level'        => $level,
            'lines'        => $lines,
            'grammarFocus' => $topic?->title,   // sesgo suave hacia la gramática actual
        ])->render();

        $raw  = $this->ai->complete('activity', $prompt,
            [['role' => 'user', 'content' => 'Select the blanks now.']], 1200);
        $decoded = $this->extractJson($raw);

        $valid = collect($decoded['blanks'] ?? [])
            ->filter(function ($b) use ($activity) {
                $line = $activity->synced_lyrics[$b['line']] ?? null;
                return $line && stripos($line['text'], $b['word']) !== false;
            })
            ->map(fn ($b) => [
                'line'        => (int) $b['line'],
                'word'        => $b['word'],
                'distractors' => array_slice($b['distractors'] ?? [], 0, 3),
            ])->values()->all();

        $byLevel[$level] = $valid;
        $activity->update(['blanks_by_level' => $byLevel]);
    }

    // ── Registrar que el usuario jugó esta canción ────────────────────────────
    public function recordPlay(User $user, ListeningActivity $activity, int $score, string $source = 'free'): void
    {
        DB::table('listening_activity_user')->insert([
            'user_id'               => $user->id,
            'listening_activity_id' => $activity->id,
            'score'                 => $score,
            'source'                => $source,
            'played_at'             => now(),
        ]);
        $activity->increment('times_played');
    }

    private function extractJson(string $raw): array
    {
        $json = preg_replace('/```(?:json)?\s*|\s*```/', '', trim($raw));
        if (! json_decode($json)) {
            preg_match('/\{.*\}/s', $json, $m);
            $json = $m[0] ?? $json;
        }
        return json_decode($json, true) ?: [];
    }
}