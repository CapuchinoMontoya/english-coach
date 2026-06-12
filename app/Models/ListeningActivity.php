<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Collection;

class ListeningActivity extends Model
{
    protected $fillable = [
        'type', 'title', 'artist', 'youtube_video_id',
        'lrclib_id', 'duration', 'offset_seconds',
        'synced_lyrics', 'blanks_by_level', 'questions_by_level',
        'level', 'vocabulary_themes', 'tags', 'source', 'times_played', 'is_active',
    ];

    protected $casts = [
        'synced_lyrics'       => 'array',
        'blanks_by_level'     => 'array',
        'questions_by_level'  => 'array',
        'vocabulary_themes'   => 'array',
        'tags'                => 'array',
        'offset_seconds'      => 'decimal:2',
        'is_active'           => 'boolean',
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
        $offset = (float) ($this->offset_seconds ?? 0);

        $lines = collect($this->synced_lyrics)->values()->map(function ($line, $i) use ($blankByLine, $offset) {
            $out = [
                'time'  => round($line['time'] + $offset, 2),
                'end'   => round($line['end'] + $offset, 2),
                'text'  => $line['text'],
                'blank' => null,
            ];

            if ($blankByLine->has($i)) {
                $b = $blankByLine->get($i);
                // deadline = timing de palabra si existe, si no el fin de la línea
                $deadline = ($line['word_deadlines'][$b['word']] ?? $line['end']) + $offset;

                // Opciones = la correcta + distractores, mezcladas
                $options = collect([$b['word'], ...($b['distractors'] ?? [])])
                    ->shuffle()
                    ->values()
                    ->all();

                $out['blank'] = [
                    'word'     => $b['word'],
                    'deadline' => round($deadline, 2),
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

    /**
     * Construye el JSON de un CLIP (video + quiz de comprensión) para el nivel
     * indicado. Mezcla las opciones de cada pregunta y recalcula el índice
     * correcto para que la respuesta no quede siempre en la misma posición.
     */
    public function buildClipForLevel(string $level): array
    {
        $byLevel = $this->questions_by_level ?? [];
        // Si no hay preguntas para ese nivel exacto, cae al más cercano disponible
        $questions = $byLevel[$level]
            ?? $byLevel['B1']
            ?? (count($byLevel) ? reset($byLevel) : []);

        $shuffled = collect($questions)->map(function ($q) {
            $correctText = $q['options'][$q['correct']] ?? $q['options'][0];
            $options     = collect($q['options'])->shuffle()->values()->all();

            return [
                'question'    => $q['question'],
                'options'     => $options,
                'correct'     => array_search($correctText, $options, true),
                'explanation' => $q['explanation'] ?? '',
            ];
        })->values()->all();

        return [
            'title'            => $this->title,
            'show'             => $this->artist,
            'youtube_video_id' => $this->youtube_video_id,
            'duration'         => $this->duration,
            'questions'        => $shuffled,
        ];
    }
}