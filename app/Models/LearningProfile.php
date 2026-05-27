<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LearningProfile extends Model
{
    protected $fillable = [
        'user_id',
        'declared_level',
        'real_level',
        'weak_areas',
        'strong_areas',
        'learning_style',
        'current_plan',
        'placement_done'
    ];

    protected $casts = [
        'weak_areas'     => 'array',
        'strong_areas'   => 'array',
        'learning_style' => 'array',
        'current_plan'   => 'array',
        'placement_done' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function learningSessions()
    {
        return $this->hasMany(LearningSession::class);
    }
}
