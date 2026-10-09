<?php

namespace App\Services\Listening;

use Illuminate\Support\Facades\Http;

class LrcLibService
{
    private const BASE = 'https://lrclib.net/api';

    /**
     * Obtiene una canción con letra sincronizada.
     * Devuelve null si no existe o no tiene synced lyrics.
     */
    public function fetch(string $artist, string $track, ?int $duration = null): ?array
    {
        $params = array_filter([
            'artist_name' => $artist,
            'track_name'  => $track,
            'duration'    => $duration,
        ]);

        $res = Http::timeout(10)
            ->withHeaders(['User-Agent' => 'Capuchino/1.0 (English learning app)'])
            ->get(self::BASE . '/get', $params);

        if (! $res->ok()) return null;

        return $this->shape($res->json());
    }

    /**
     * Búsqueda flexible (cuando /get exacto falla).
     * Devuelve el primer resultado con synced lyrics.
     */
    public function search(string $artist, string $track): ?array
    {
        return $this->searchQuery("{$artist} {$track}");
    }

    /**
     * Búsqueda libre por texto (ej. "Closed On Sunday" o "Kanye Closed On Sunday").
     * Devuelve el primer resultado con letra sincronizada, con sus metadatos.
     */
    // Versiones que NO son la grabación de estudio original
    private const NON_STUDIO = [
        'live', 'cover', 'remix', 'instrumental', 'karaoke', 'acoustic',
        'sped up', 'sped-up', '8d', 'nightcore', 'slowed', 'a cappella',
        'acapella', 'reprise', 'demo', 'remaster', 'tribute',
    ];

    public function searchQuery(string $query): ?array
    {
        $res = Http::timeout(12)
            ->withHeaders(['User-Agent' => 'Capuchino/1.0 (English learning app)'])
            ->get(self::BASE . '/search', ['q' => $query]);

        if (! $res->ok()) return null;

        $synced = collect($res->json())
            ->filter(fn ($i) => ! empty($i['syncedLyrics']))
            ->values();

        if ($synced->isEmpty()) return null;

        // Cuenta versiones ~iguales: la que más se repite suele ser la canónica/popular
        $countByKey = [];
        foreach ($synced as $i) {
            $k = $this->versionKey($i);
            $countByKey[$k] = ($countByKey[$k] ?? 0) + 1;
        }

        // Puntúa respetando el orden de relevancia de LRCLIB y castigando no-estudio
        $best = null;
        $bestScore = -INF;
        foreach ($synced as $idx => $i) {
            $track = mb_strtolower($i['trackName'] ?? '');
            $score = 100 - $idx * 3;
            foreach (self::NON_STUDIO as $bad) {
                if (str_contains($track, $bad)) { $score -= 200; break; }
            }
            $score += (($countByKey[$this->versionKey($i)] ?? 1) - 1) * 12;

            if ($score > $bestScore) {
                $bestScore = $score;
                $best = $i;
            }
        }

        return $this->shape($best);
    }

    private function versionKey(array $item): string
    {
        return mb_strtolower(($item['trackName'] ?? '')) . '|' . round(($item['duration'] ?? 0) / 3);
    }

    /**
     * Normaliza la respuesta de LRCLIB a nuestra estructura.
     */
    private function shape(?array $data): ?array
    {
        if (empty($data) || empty($data['syncedLyrics'])) return null;

        $artist = trim($data['artistName'] ?? '');

        return [
            'lrclib_id'     => $data['id'] ?? null,
            'artist'        => $artist,
            'title'         => $this->cleanTitle($data['trackName'] ?? '', $artist),
            'duration'      => (int) round($data['duration'] ?? 0),
            'synced_lyrics' => $this->parseLrc($data['syncedLyrics']),
        ];
    }

    /** Limpia "Kanye West - Closed On Sunday (Official Video)" → "Closed On Sunday". */
    private function cleanTitle(string $raw, string $artist): string
    {
        $t = trim($raw);

        // Quita el prefijo "Artista - "
        if ($artist !== '' && stripos($t, $artist . ' -') === 0) {
            $t = trim(substr($t, strlen($artist) + 2));
        }

        // Quita sufijos entre paréntesis/corchetes tipo (Official Video), [Audio], (HD)…
        $t = preg_replace(
            '/\s*[\(\[](?:official|lyric|lyrics|audio|video|music video|hd|4k|mv|explicit|visualizer)[^\)\]]*[\)\]]/iu',
            '',
            $t
        );

        $t = trim($t);
        return $t !== '' ? $t : trim($raw);
    }

    /**
     * Parsea LRC ([mm:ss.xx]texto) a [{time, end, text}].
     * Calcula 'end' como el inicio de la siguiente línea.
     */
    private function parseLrc(string $lrc): array
    {
        // Normaliza saltos: si vienen como "\n" literal (escapado), conviértelos a salto real
        $lrc = str_replace(['\r\n', '\n'], "\n", $lrc);

        $lines = [];

        foreach (explode("\n", $lrc) as $raw) {
            if (! preg_match('/^\[(\d+):(\d+)(?:[.:](\d+))?\](.*)/', $raw, $m)) continue;

            $time = (int) $m[1] * 60 + (int) $m[2] + ($m[3] !== '' ? (float) ('0.' . $m[3]) : 0);
            $text = trim(preg_replace('/<\d+:\d+(?:[.:]\d+)?>/', '', $m[4])); // limpia tags word-level

            if ($text === '') continue;

            $lines[] = ['time' => round($time, 2), 'text' => $text];
        }

        $count = count($lines);
        foreach ($lines as $i => &$line) {
            $line['end'] = $i + 1 < $count ? $lines[$i + 1]['time'] : $line['time'] + 4;
        }

        return $lines;
    }
}