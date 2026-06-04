<?php
// ─── app/Models/CurriculumTopic.php ──────────────────────────────────────────

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CurriculumTopic extends Model
{
    protected $fillable = [
        'level_from',
        'level_to',
        'order',
        'title',
        'description',
        'grammar_points',
        'vocabulary_themes',
        'estimated_sessions',
        'is_active',
    ];

    protected $casts = [
        'grammar_points'    => 'array',
        'vocabulary_themes' => 'array',
        'is_active'         => 'boolean',
    ];

    // ── Relationships ─────────────────────────────────────────────────────────

    public function studentProgress(): HasMany
    {
        return $this->hasMany(StudentTopicProgress::class);
    }

    // ── Scopes ────────────────────────────────────────────────────────────────

    public function scopeForTransition($query, string $from, string $to)
    {
        return $query->where('level_from', $from)
                     ->where('level_to', $to)
                     ->where('is_active', true)
                     ->orderBy('order');
    }

    public function scopeForLevel($query, string $realLevel)
    {
        // Dado el nivel real, encuentra la transición correcta
        $transitions = [
            'A1' => ['from' => 'A1', 'to' => 'A2'],
            'A2' => ['from' => 'A2', 'to' => 'B1'],
            'B1' => ['from' => 'B1', 'to' => 'B2'],
            'B2' => ['from' => 'B2', 'to' => 'C1'],
            'C1' => ['from' => 'C1', 'to' => 'C2'],
        ];

        $transition = $transitions[$realLevel] ?? ['from' => 'A2', 'to' => 'B1'];

        return $query->forTransition($transition['from'], $transition['to']);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    public function transitionKey(): string
    {
        return "{$this->level_from}_to_{$this->level_to}";
    }
}