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
    public function findBestMatch(string $artist, string $track, int $targetDuration): ?array
    {
        if (! $this->apiKey) return null;

        // 1. Buscar candidatos. El query con "topic" tiende a traer el audio oficial.
        $candidates = $this->searchVideos("{$artist} {$track}");
        if (empty($candidates)) return null;

        // 2. Traer detalles (duración, embeddable) en una sola llamada
        $details = $this->videoDetails(array_column($candidates, 'video_id'));

        // 3. Puntuar y elegir
        $best = null;
        $bestScore = -INF;

        foreach ($candidates as $c) {
            $d = $details[$c['video_id']] ?? null;
            if (! $d || ! $d['embeddable']) continue;

            $durationDiff = abs($d['duration'] - $targetDuration);
            if ($durationDiff > 3) continue; // la letra no sincronizaría

            $title   = mb_strtolower($c['title']);
            $channel = mb_strtolower($c['channel']);

            // Penaliza videos de "lyrics" (muestran la respuesta) y prioriza Topic/oficial
            $score = 100 - $durationDiff * 5;
            if (str_contains($channel, '- topic')) $score += 50;        // audio oficial
            if (str_contains($title, 'official audio')) $score += 30;
            if (str_contains($title, 'lyric')) $score -= 200;            // descarta lyrics videos
            if (str_contains($title, 'live') || str_contains($title, 'remix')) $score -= 40;
            if (str_contains($title, 'cover')) $score -= 60;

            if ($score > $bestScore) {
                $bestScore = $score;
                $best = $c['video_id'];
            }
        }

        return $best ? ['video_id' => $best, 'offset' => 0] : null;
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

    private function searchVideos(string $query): array
    {
        $res = Http::timeout(10)->get(self::SEARCH, [
            'key'        => $this->apiKey,
            'q'          => $query,
            'part'       => 'snippet',
            'type'       => 'video',
            'maxResults' => 10,
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