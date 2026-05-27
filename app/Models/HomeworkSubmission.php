<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HomeworkSubmission extends Model
{
    protected $fillable = [
        'user_id',
        'learning_session_id',
        'submission',
        'ai_feedback',
        'status',
        'score',
        'submitted_at'
    ];

    protected $casts = [
        'submitted_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function learningSession()
    {
        return $this->belongsTo(LearningSession::class);
    }
}
