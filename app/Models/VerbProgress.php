<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VerbProgress extends Model
{
    protected $table = 'verb_progress';

    protected $fillable = [
        'user_id', 'verb_id', 'box', 'status',
        'due_at', 'times_seen', 'times_correct', 'last_reviewed_at',
    ];

    protected $casts = [
        'due_at'           => 'datetime',
        'last_reviewed_at' => 'datetime',
    ];

    // Cajas Leitner → días hasta el próximo repaso
    public const INTERVALS    = [1 => 1, 2 => 3, 3 => 7, 4 => 16, 5 => 45];
    public const MASTERED_BOX = 5;

    public function user(): BelongsTo { return $this->belongsTo(User::class); }
    public function verb(): BelongsTo { return $this->belongsTo(Verb::class); }

    public function scopeDue($query)
    {
        return $query->whereNotNull('due_at')->where('due_at', '<=', now());
    }

    public function markCorrect(): void
    {
        $this->box    = min($this->box + 1, self::MASTERED_BOX);
        $this->status = $this->box >= self::MASTERED_BOX ? 'mastered' : 'learning';
        $this->due_at = now()->addDays(self::INTERVALS[$this->box] ?? 1);
        $this->times_seen++;
        $this->times_correct++;
        $this->last_reviewed_at = now();
        $this->save();
    }

    public function markWrong(): void
    {
        $this->box    = 1;
        $this->status = 'learning';
        $this->due_at = now();
        $this->times_seen++;
        $this->last_reviewed_at = now();
        $this->save();
    }
}
