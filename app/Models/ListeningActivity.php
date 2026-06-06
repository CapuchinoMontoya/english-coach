<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Collection;

class ListeningActivity extends Model
{
    protected $fillable = [
        'title', 'artist', 'youtube_video_id',
        'synced_lyrics', 'blanks_by_level',
        'level', 'vocabulary_themes', 'is_active',
    ];

    protected $casts = [
        'synced_lyrics'     => 'array',
        'blanks_by_level'   => 'array',
        'vocabulary_themes' => 'array',
        'is_active'         => 'boolean',
    ];

    public function scopeActive($query) { return $query->where('is_active', true); }

    /**
     * Construye el JSON de canción para ListeningGame, aplicando los blanks
     * del nivel indicado y calculando el deadline desde los timestamps.
     */
    public function buildSongForLevel(string $level): array
    {
        $byLevel = $this->blanks_by_level ?? [];
        // Si no hay blanks para ese nivel exacto, cae al más cercano disponible
        $blanks  = $byLevel[$level]
            ?? $byLevel['B1']
            ?? (count($byLevel) ? reset($byLevel) : []);

        $blankByLine = collect($blanks)->keyBy('line');

        $lines = collect($this->synced_lyrics)->values()->map(function ($line, $i) use ($blankByLine) {
            $out = [
                'time'  => $line['time'],
                'end'   => $line['end'],
                'text'  => $line['text'],
                'blank' => null,
            ];

            if ($blankByLine->has($i)) {
                $b = $blankByLine->get($i);
                // deadline = timing de palabra si existe, si no el fin de la línea
                $deadline = $line['word_deadlines'][$b['word']] ?? $line['end'];

                // Opciones = la correcta + distractores, mezcladas
                $options = collect([$b['word'], ...($b['distractors'] ?? [])])
                    ->shuffle()
                    ->values()
                    ->all();

                $out['blank'] = [
                    'word'     => $b['word'],
                    'deadline' => $deadline,
                    'options'  => $options,
                ];
            }

            return $out;
        })->all();

        return [
            'title'            => $this->title,
            'artist'           => $this->artist,
            'youtube_video_id' => $this->youtube_video_id,
            'lines'            => $lines,
        ];
    }
}