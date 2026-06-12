<?php

namespace App\Services\Listening;

use App\Models\ListeningActivity;
use App\Models\User;
use App\Services\AI\AIProviderService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Actividad de comprensión con clips de video (escenas de películas, series,
 * sketches, entrevistas). El flujo:
 *
 *   1. La IA sugiere escenas según los gustos del usuario (series/películas).
 *   2. Se buscan en YouTube priorizando canales oficiales (Movieclips, sitcoms,
 *      late night) para que el video sea embebible y con diálogo claro.
 *   3. Se descargan los subtítulos REALES del video — las preguntas se generan
 *      desde el transcript, así siempre coinciden con lo que se dice.
 *   4. Todo se guarda en la BD: el catálogo crece y deja de depender de la API.
 */
class ClipActivityService
{
    // Canales oficiales con clips de 2-7 min, diálogo claro y subtítulos confiables
    private const OFFICIAL_CHANNELS = [
        'Movieclips',
        'The Office',
        'Friends',
        'Brooklyn Nine-Nine',
        'Parks and Recreation',
        'Saturday Night Live',
        'The Tonight Show Starring Jimmy Fallon',
        'Jimmy Kimmel Live',
        'Netflix',
        'Max',
        'Prime Video',
        'Peacock',
        'TBS',
        'BBC',
        'BBC Comedy Greats',
        'Still Watching Netflix',
    ];

    public function __construct(
        private AIProviderService     $ai,
        private YouTubeFinderService  $youtube,
        private YouTubeCaptionService $captions,
    ) {}

    // ── Lookup instantáneo en caché (para sugerir sin frenar el submit) ────────
    public function getCached(User $user): ?ListeningActivity
    {
        $level     = $user->learningProfile->real_level ?? 'B1';
        $interests = $user->learningProfile->learning_style['interests'] ?? [];

        return $this->findCached($user, $level, $interests);
    }

    // ── Obtener un clip: caché primero, discovery si hace falta ────────────────
    public function getActivityFor(User $user): ?ListeningActivity
    {
        $level     = $user->learningProfile->real_level ?? 'B1';
        $interests = $user->learningProfile->learning_style['interests'] ?? [];

        if ($cached = $this->findCached($user, $level, $interests)) {
            $this->ensureQuestionsForLevel($cached, $level);
            return $cached;
        }

        return $this->discover($user, $level, $interests);
    }

    // ── Buscar en la BD un clip adecuado ya listo ──────────────────────────────
    private function findCached(User $user, string $level, array $interests): ?ListeningActivity
    {
        $playedIds = DB::table('listening_activity_user')
            ->where('user_id', $user->id)
            ->where('source', 'lesson')
            ->pluck('listening_activity_id')
            ->all();

        $query = ListeningActivity::active()
            ->where('type', 'clip')
            ->where('level', $level)
            ->whereNotIn('id', $playedIds);

        // Con intereses: matchear tags. Sin intereses: cualquier clip del nivel sirve.
        if (empty($interests)) {
            return $query->first();
        }

        return $query->get()
            ->first(fn ($a) => count(array_intersect(
                array_map('mb_strtolower', $a->tags ?? []),
                array_map('mb_strtolower', $interests)
            )) > 0);
    }

    // ── Discovery: IA sugiere escenas → YouTube → captions → preguntas ─────────
    public function discover(User $user, string $level, array $interests): ?ListeningActivity
    {
        $prompt = view('ai.prompts.clip_suggestion', [
            'level'     => $level,
            'interests' => $interests,
            'channels'  => self::OFFICIAL_CHANNELS,
            'count'     => 6,
        ])->render();

        $raw  = $this->ai->complete('activity', $prompt,
            [['role' => 'user', 'content' => 'Suggest the clips now.']], 900);
        $json = $this->extractJson($raw);

        foreach ($json['clips'] ?? [] as $clip) {
            $query = $clip['search_query'] ?? null;
            $show  = $clip['show']         ?? null;
            if (! $query || ! $show) continue;

            $candidates = $this->youtube->findClipCandidates(
                $query,
                self::OFFICIAL_CHANNELS,
                60,
                420,
            );

            foreach (array_slice($candidates, 0, 3) as $video) {
                // ¿Ya está en el catálogo? (otro usuario pudo haberlo traído)
                $existing = ListeningActivity::query()
                    ->where('youtube_video_id', $video['video_id'])
                    ->first();
                if ($existing) {
                    $this->ensureQuestionsForLevel($existing, $level);
                    return $existing;
                }

                // Subtítulos reales — sin transcript no hay preguntas confiables
                $transcript = $this->captions->fetch($video['video_id']);
                if (! $transcript) continue;

                $activity = ListeningActivity::create([
                    'type'             => 'clip',
                    'title'            => $clip['scene_title'] ?? $video['title'],
                    'artist'           => $show,                  // para clips, artist = serie/película
                    'youtube_video_id' => $video['video_id'],
                    'duration'         => $video['duration'],
                    'synced_lyrics'    => $transcript,            // para clips, esto es el transcript
                    'level'            => $level,
                    'tags'             => $clip['tags'] ?? [$show],
                    'source'           => 'youtube',
                    'is_active'        => true,
                ]);

                $this->ensureQuestionsForLevel($activity, $level);

                // Sin preguntas válidas el clip no sirve: se desactiva y se sigue buscando
                $activity->refresh();
                if (empty($activity->questions_by_level[$level])) {
                    $activity->update(['is_active' => false]);
                    Log::warning("Clip {$video['video_id']}: la IA no generó preguntas válidas, descartado.");
                    continue;
                }

                return $activity;
            }
        }

        return null;
    }

    // ── Generar preguntas para un nivel solo si no existen (lazy) ──────────────
    public function ensureQuestionsForLevel(ListeningActivity $activity, string $level): void
    {
        $byLevel = $activity->questions_by_level ?? [];
        if (isset($byLevel[$level])) return;

        $transcript = collect($activity->synced_lyrics)
            ->pluck('text')
            ->implode("\n");

        if (trim($transcript) === '') return;

        $prompt = view('ai.prompts.clip_questions', [
            'level'      => $level,
            'show'       => $activity->artist,
            'title'      => $activity->title,
            'transcript' => $transcript,
        ])->render();

        $raw     = $this->ai->complete('activity', $prompt,
            [['role' => 'user', 'content' => 'Write the questions now.']], 1500);
        $decoded = $this->extractJson($raw);

        $valid = collect($decoded['questions'] ?? [])
            ->filter(fn ($q) =>
                ! empty($q['question'])
                && is_array($q['options'] ?? null)
                && count($q['options']) === 4
                && isset($q['correct'])
                && (int) $q['correct'] >= 0
                && (int) $q['correct'] <= 3
            )
            ->map(fn ($q) => [
                'question'    => $q['question'],
                'options'     => array_values($q['options']),
                'correct'     => (int) $q['correct'],
                'explanation' => $q['explanation'] ?? '',
            ])
            ->values()
            ->all();

        if (count($valid) < 3) return;   // menos de 3 preguntas no es un quiz serio

        $byLevel[$level] = $valid;
        $activity->update(['questions_by_level' => $byLevel]);
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
