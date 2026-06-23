<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VocabularyItem extends Model
{
    protected $fillable = [
        'curriculum_topic_id', 'theme', 'level',
        'word', 'translation', 'part_of_speech',
        'example', 'example_translation', 'phonetic', 'sort',
    ];

    // Orden de niveles CEFR para el desbloqueo
    public const LEVEL_RANK = ['A1' => 1, 'A2' => 2, 'B1' => 3, 'B2' => 4, 'C1' => 5, 'C2' => 6];

    public function topic(): BelongsTo
    {
        return $this->belongsTo(CurriculumTopic::class, 'curriculum_topic_id');
    }

    /**
     * Todo el vocabulario desbloqueado para un usuario de cierto nivel:
     * su nivel y todos los anteriores.
     */
    public function scopeUnlockedFor($query, string $userLevel)
    {
        $rank = self::LEVEL_RANK[$userLevel] ?? 3;

        $allowed = collect(self::LEVEL_RANK)
            ->filter(fn ($r) => $r <= $rank)
            ->keys()
            ->all();

        return $query->whereIn('level', $allowed);
    }
}