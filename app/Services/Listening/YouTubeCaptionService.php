<?php

namespace App\Services\Listening;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Obtiene los subtítulos (captions) reales de un video de YouTube usando la
 * API interna (InnerTube) con cliente ANDROID — sus URLs de transcript funcionan
 * sin po token, a diferencia de las de la página web. Esto garantiza que las
 * preguntas de comprensión se generen sobre lo que el video DICE realmente.
 */
class YouTubeCaptionService
{
    private const PLAYER_API     = 'https://www.youtube.com/youtubei/v1/player';
    private const ANDROID_UA     = 'com.google.android.youtube/20.10.38 (Linux; U; Android 11) gzip';
    private const CLIENT_VERSION = '20.10.38';

    /**
     * Devuelve el transcript como [['time' => s, 'end' => s, 'text' => '...'], ...]
     * o null si el video no tiene subtítulos en inglés.
     */
    public function fetch(string $videoId): ?array
    {
        $tracks = $this->captionTracks($videoId);
        if (empty($tracks)) return null;

        $track = $this->pickEnglishTrack($tracks);
        if (! $track || empty($track['baseUrl'])) return null;

        return $this->downloadTranscript($track['baseUrl']);
    }

    private function captionTracks(string $videoId): array
    {
        try {
            $res = Http::timeout(15)
                ->withHeaders(['User-Agent' => self::ANDROID_UA])
                ->post(self::PLAYER_API, [
                    'context' => [
                        'client' => [
                            'clientName'        => 'ANDROID',
                            'clientVersion'     => self::CLIENT_VERSION,
                            'androidSdkVersion' => 30,
                            'hl'                => 'en',
                        ],
                    ],
                    'videoId' => $videoId,
                ]);
        } catch (\Throwable $e) {
            Log::warning("Captions: fallo InnerTube para {$videoId}: {$e->getMessage()}");
            return [];
        }

        if (! $res->ok() || $res->json('playabilityStatus.status') !== 'OK') return [];

        return $res->json('captions.playerCaptionsTracklistRenderer.captionTracks', []);
    }

    /** Prefiere subtítulos manuales en inglés; cae a los automáticos (asr). */
    private function pickEnglishTrack(array $tracks): ?array
    {
        $english = array_filter($tracks, fn ($t) => str_starts_with($t['languageCode'] ?? '', 'en'));
        if (empty($english)) return null;

        foreach ($english as $t) {
            if (($t['kind'] ?? '') !== 'asr') return $t;   // manual > automático
        }

        return array_values($english)[0];
    }

    /** Descarga y parsea el XML timedtext: <p t="ms" d="ms">texto</p> */
    private function downloadTranscript(string $baseUrl): ?array
    {
        try {
            $res = Http::timeout(15)
                ->withHeaders(['User-Agent' => self::ANDROID_UA])
                ->get(html_entity_decode($baseUrl));
        } catch (\Throwable) {
            return null;
        }

        if (! $res->ok() || trim($res->body()) === '') return null;

        $xml = @simplexml_load_string($res->body());
        if ($xml === false) return null;

        $lines = [];

        foreach ($xml->xpath('//p') as $p) {
            // Algunos tracks traen segmentos <s> dentro del <p>
            $text = trim(html_entity_decode(strip_tags($p->asXML()), ENT_QUOTES | ENT_HTML5));
            $text = preg_replace('/\s+/', ' ', $text);

            // Saltar marcadores sin diálogo: [Music], [Applause], [♪♪♪], ♪ sueltos...
            if ($text === '' || preg_match('/^[\[\(♪\s]*(music|applause|laughter|♪+)?[\]\)♪\s]*$/i', $text)) {
                continue;
            }

            $start = ((float) ($p['t'] ?? 0)) / 1000;
            $dur   = ((float) ($p['d'] ?? 2000)) / 1000;

            $lines[] = [
                'time' => round($start, 2),
                'end'  => round($start + $dur, 2),
                'text' => $text,
            ];
        }

        return count($lines) >= 5 ? $lines : null;   // muy pocas líneas = transcript inútil
    }
}
