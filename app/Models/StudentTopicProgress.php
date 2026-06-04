<?php
// ─── app/Models/StudentTopicProgress.php ─────────────────────────────────────

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudentTopicProgress extends Model
{
    protected $table = 'student_topic_progress';

    protected $fillable = [
        'user_id',
        'curriculum_topic_id',
        'status',
        'score',
        'sessions_count',
        'attempts',
        'started_at',
        'completed_at',
    ];

    protected $casts = [
        'started_at'   => 'datetime',
        'completed_at' => 'datetime',
    ];

    // ── Relationships ─────────────────────────────────────────────────────────

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function topic(): BelongsTo
    {
        return $this->belongsTo(CurriculumTopic::class, 'curriculum_topic_id');
    }

    // ── Scopes ────────────────────────────────────────────────────────────────

    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    public function scopeInProgress($query)
    {
        return $query->where('status', 'in_progress');
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    public function markAsStarted(): void
    {
        $this->update([
            'status'     => 'in_progress',
            'started_at' => now(),
        ]);
    }

    public function markAsCompleted(int $score): void
    {
        $this->update([
            'status'       => 'completed',
            'score'        => $score,
            'completed_at' => now(),
        ]);
    }

    public function isCompleted(): bool
    {
        return $this->status === 'completed';
    }
}