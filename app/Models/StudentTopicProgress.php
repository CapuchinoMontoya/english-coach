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
        'cumulative_score',
        'sessions_count',
        'attempts',
        'started_at',
        'completed_at',
        'last_session_at',
        'session_data',
    ];

    protected $casts = [
        'started_at'       => 'datetime',
        'completed_at'     => 'datetime',
        'last_session_at'  => 'datetime',
        'session_data'     => 'array',
        'cumulative_score' => 'decimal:2',
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

    public function scopeCompleted($query)   { return $query->where('status', 'completed'); }
    public function scopeInProgress($query)   { return $query->where('status', 'in_progress'); }
    public function scopePending($query)      { return $query->where('status', 'pending'); }
    public function scopeNeedsReview($query)  { return $query->where('status', 'needs_review'); }

    // ── Helpers ───────────────────────────────────────────────────────────────

    public function markAsStarted(): void
    {
        if ($this->status === 'pending') {
            $this->update(['status' => 'in_progress', 'started_at' => now()]);
        }
    }

    public function isCompleted(): bool
    {
        return $this->status === 'completed';
    }

    /**
     * Inicializa la memoria del tema si no existe.
     * Los aspectos pendientes empiezan como todos los grammar_points del tema.
     */
    public function initSessionData(): array
    {
        return [
            'sessions'          => [],
            'recurring_errors'  => [],
            'aspects_covered'   => [],
            'aspects_remaining' => $this->topic->grammar_points ?? [],
        ];
    }

    public function getSessionDataOrInit(): array
    {
        return $this->session_data ?? $this->initSessionData();
    }
}