<?php

namespace App\Services\Listening;

use Illuminate\Support\Facades\Http;

class YouTubeFinderService
{
    private const SEARCH = 'https://www.googleapis.com/youtube/v3/search';
    private const VIDEOS = 'https://www.googleapis.com/youtube/v3/videos';

    public function __construct(private ?string $apiKey = null)
    {
        $this->apiKey = $apiKey ?? config('services.youtube.key');
    }

    /**
     * Encuentra el mejor video para una canción:
     * - Duración ≈ targetDuration (±3s) para que la letra sincronice
     * - Embeddable
     * - Prioriza canales "- Topic" (audio oficial, sin subtítulos, empieza en 0)
     * - Evita videos "lyrics" (mostrarían la respuesta)
     *
     * Devuelve ['video_id' => ..., 'offset' => 0] o null.
     */
    // Palabras que rompen la sincronía o no son la versión original de estudio:
    // lyrics/covers/versiones alteradas Y reuploads de fans con letra/subtítulos/traducción.
    public const BAD_KEYWORDS = [
        'lyric', 'cover', 'live', 'remix', 'sped up', 'sped-up', 'spedup', '8d',
        'nightcore', 'instrumental', 'karaoke', 'slowed', 'reverb', 'mashup',
        'tribute', 'parody', 'reaction', 'acoustic', 'remaster live', 'concert',
        // subtítulos / traducciones / letra (fan reuploads)
        'subtitul', 'subtítul', 'sub esp', 'subtitle', 'letra', 'letras',
        'traducid', 'traduc', 'traducci', 'español', 'espanol', 'legendado',
        'vietsub', 'subs', 'sub español', 'en español',
    ];

    public function findBestMatch(string $artist, string $track, int $targetDuration): ?array
    {
        if (! $this->apiKey) return null;

        // Pass 1: búsqueda directa
        $scored = $this->scoreSearch("{$artist} {$track}", $artist, $track, $targetDuration);

        // Si no apareció un candidato "fuerte" (Topic o audio oficial), busca enfocado al audio
        $hasStrong = false;
        foreach ($scored as $c) if ($c['strong']) { $hasStrong = true; break; }
        if (! $hasStrong) {
            $more   = $this->scoreSearch("{$artist} {$track} official audio", $artist, $track, $targetDuration);
            $scored = array_merge($scored, $more);
        }

        if (empty($scored)) return null;

        usort($scored, fn ($a, $b) => $b['score'] <=> $a['score']);
        return ['video_id' => $scored[0]['video_id'], 'offset' => 0];
    }

    /** Busca y puntúa candidatos de audio para una consulta. */
    private function scoreSearch(string $query, string $artist, string $track, int $targetDuration): array
    {
        $candidates = $this->searchVideos($query, 15);
        if (empty($candidates)) return [];

        $details   = $this->videoDetails(array_column($candidates, 'video_id'));
        $artistKey = $this->key($artist);
        $trackKey  = $this->key($track);

        $out = [];
        foreach ($candidates as $c) {
            $d = $details[$c['video_id']] ?? null;
            if (! $d || ! $d['embeddable']) continue;

            // Sincronía estricta: la letra es relativa al audio de estudio
            $durDiff = abs($d['duration'] - $targetDuration);
            if ($durDiff > 2) continue;

            $title = mb_strtolower($c['title']);
            $chan  = mb_strtolower($c['channel']);

            if ($this->hasBadKeyword($title) || $this->hasBadKeyword($chan)) continue;

            $titleKey = $this->key($c['title']);
            $trackOk  = $trackKey !== '' && str_contains($titleKey, $trackKey);
            $artistOk = $artistKey !== '' &&
                (str_contains($titleKey, $artistKey) || str_contains($this->key($c['channel']), $artistKey));
            if (! $trackOk && ! $artistOk) continue;

            $isTopic         = str_contains($chan, '- topic');
            $isOfficialAudio = str_contains($title, 'official audio');

            // Audio oficial ("- Topic") es el ideal: empieza en 0, sin intro
            $score = 100 - $durDiff * 25;
            if ($isTopic)                        $score += 120;
            if ($isOfficialAudio)                $score += 80;
            if (str_contains($title, 'audio'))   $score += 20;
            if (str_contains($title, 'official')) $score += 10;
            if ($trackOk)                        $score += 15;
            if (! $artistOk)                     $score -= 30;

            $out[] = [
                'video_id' => $c['video_id'],
                'score'    => $score,
                'strong'   => $isTopic || $isOfficialAudio,
            ];
        }

        return $out;
    }

    /** Info de un solo video (barato: 1 unidad de cuota). null si no existe/privado. */
    public function inspect(string $videoId): ?array
    {
        if (! $this->apiKey || $videoId === '') return null;

        $res = Http::timeout(10)->get(self::VIDEOS, [
            'key'  => $this->apiKey,
            'id'   => $videoId,
            'part' => 'snippet,contentDetails,status',
        ]);
        if (! $res->ok()) return null;

        $item = $res->json('items.0');
        if (! $item) return null; // eliminado, privado o id inválido

        return [
            'duration'   => $this->iso8601ToSeconds($item['contentDetails']['duration'] ?? 'PT0S'),
            'embeddable' => $item['status']['embeddable'] ?? false,
            'title'      => $item['snippet']['title'] ?? '',
            'channel'    => $item['snippet']['channelTitle'] ?? '',
        ];
    }

    public function hasBadKeyword(string $title): bool
    {
        $t = mb_strtolower($title);
        foreach (self::BAD_KEYWORDS as $bad) {
            if (str_contains($t, $bad)) return true;
        }
        return false;
    }

    /** Clave normalizada (solo alfanuméricos, sin paréntesis) para comparar títulos. */
    private function key(string $s): string
    {
        $s = mb_strtolower($s);
        $s = preg_replace('/\(.*?\)|\[.*?\]/u', '', $s);   // quita (feat. …), [Official] …
        return preg_replace('/[^a-z0-9]+/', '', $s) ?? '';
    }

    /**
     * Encuentra candidatos de CLIP (escena de película/serie/entrevista):
     * - Duración entre $minDuration y $maxDuration
     * - Embeddable
     * - Prioriza canales oficiales conocidos (Movieclips, sitcoms, late night...)
     * - Evita tráilers, reacciones y compilaciones largas
     *
     * Devuelve lista ordenada por score: [['video_id','title','channel','duration'], ...]
     */
    public function findClipCandidates(
        string $query,
        array $preferChannels = [],
        int $minDuration = 60,
        int $maxDuration = 420,
    ): array {
        if (! $this->apiKey) return [];

        $candidates = $this->searchVideos($query);
        if (empty($candidates)) return [];

        $details = $this->videoDetails(array_column($candidates, 'video_id'));
        $scored  = [];

        foreach ($candidates as $c) {
            $d = $details[$c['video_id']] ?? null;
            if (! $d || ! $d['embeddable']) continue;
            if ($d['duration'] < $minDuration || $d['duration'] > $maxDuration) continue;

            $title   = mb_strtolower($c['title']);
            $channel = mb_strtolower($c['channel']);

            $score = 50;
            foreach ($preferChannels as $pref) {
                if (str_contains($channel, mb_strtolower($pref))) { $score += 80; break; }
            }
            if (str_contains($title, 'scene') || str_contains($title, 'clip'))      $score += 15;
            if (str_contains($title, 'cold open'))                                  $score += 15;
            if (str_contains($title, 'trailer') || str_contains($title, 'teaser'))  $score -= 200;
            if (str_contains($title, 'reaction') || str_contains($title, 'react'))  $score -= 150;
            if (str_contains($title, 'explained') || str_contains($title, 'recap')) $score -= 80;
            if (str_contains($title, 'full movie'))                                 $score -= 200;

            $scored[] = [
                'video_id' => $c['video_id'],
                'title'    => $c['title'],
                'channel'  => $c['channel'],
                'duration' => $d['duration'],
                'score'    => $score,
            ];
        }

        usort($scored, fn ($a, $b) => $b['score'] <=> $a['score']);

        return $scored;
    }

    private function searchVideos(string $query, int $maxResults = 10): array
    {
        $res = Http::timeout(10)->get(self::SEARCH, [
            'key'        => $this->apiKey,
            'q'          => $query,
            'part'       => 'snippet',
            'type'       => 'video',
            'maxResults' => $maxResults,
            'videoEmbeddable' => 'true',
        ]);

        if (! $res->ok()) return [];

        return collect($res->json('items', []))->map(fn ($i) => [
            'video_id' => $i['id']['videoId'],
            'title'    => $i['snippet']['title'],
            'channel'  => $i['snippet']['channelTitle'],
        ])->all();
    }

    private function videoDetails(array $videoIds): array
    {
        if (empty($videoIds)) return [];

        $res = Http::timeout(10)->get(self::VIDEOS, [
            'key'  => $this->apiKey,
            'id'   => implode(',', $videoIds),
            'part' => 'contentDetails,status',
        ]);

        if (! $res->ok()) return [];

        $out = [];
        foreach ($res->json('items', []) as $item) {
            $out[$item['id']] = [
                'duration'   => $this->iso8601ToSeconds($item['contentDetails']['duration']),
                'embeddable' => $item['status']['embeddable'] ?? false,
            ];
        }
        return $out;
    }

    private function iso8601ToSeconds(string $iso): int
    {
        preg_match('/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/', $iso, $m);
        return ((int) ($m[1] ?? 0)) * 3600 + ((int) ($m[2] ?? 0)) * 60 + ((int) ($m[3] ?? 0));
    }
}