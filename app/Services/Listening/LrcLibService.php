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
        $res = Http::timeout(10)
            ->withHeaders(['User-Agent' => 'Capuchino/1.0 (English learning app)'])
            ->get(self::BASE . '/search', ['q' => "{$artist} {$track}"]);

        if (! $res->ok()) return null;

        foreach ($res->json() as $item) {
            if (! empty($item['syncedLyrics'])) {
                return $this->shape($item);
            }
        }
        return null;
    }

    /**
     * Normaliza la respuesta de LRCLIB a nuestra estructura.
     */
    private function shape(?array $data): ?array
    {
        if (empty($data) || empty($data['syncedLyrics'])) return null;

        return [
            'lrclib_id'     => $data['id'] ?? null,
            'duration'      => (int) round($data['duration'] ?? 0),
            'synced_lyrics' => $this->parseLrc($data['syncedLyrics']),
        ];
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