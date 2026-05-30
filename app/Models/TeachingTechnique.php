<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;

class TeachingTechnique extends Model
{
    protected $fillable = [
        'topic',
        'level',
        'learning_style',
        'age_group',
        'technique_summary',
        'score',
        'success_rate',
        'usage_count',
        'is_active',
    ];

    protected $casts = [
        'success_rate' => 'decimal:2',
        'is_active'    => 'boolean',
    ];

    // Scope para el Context Builder — solo técnicas útiles
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function scopeForProfile(Builder $query, string $topic, string $level, string $style): Builder
    {
        return $query->active()
            ->where('topic', $topic)
            ->where('level', $level)
            ->where('learning_style', $style)
            ->where('success_rate', '>=', 85)
            ->orderBy('success_rate', 'desc');
    }

    public function recordResult(int $newScore): void
    {
        $this->success_rate = (($this->success_rate * $this->usage_count) + $newScore)
            / ($this->usage_count + 1);
        $this->usage_count += 1;

        if ($this->usage_count >= 5 && $this->success_rate < 60) {
            $this->is_active = false;
        }

        $this->save();
    }
}
