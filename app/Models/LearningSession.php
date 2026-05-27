<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LearningSession extends Model
{
    protected $fillable = [
        'user_id',
        'learning_profile_id',
        'mode',
        'topic',
        'score',
        'counts_for_plan'
    ];

    protected $casts = [
        'counts_for_plan' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function learningProfile()
    {
        return $this->belongsTo(LearningProfile::class);
    }

    public function messages()
    {
        return $this->hasMany(SessionMessage::class);
    }

    public function homeworkSubmission()
    {
        return $this->hasOne(HomeworkSubmission::class);
    }
}
