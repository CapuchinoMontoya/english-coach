<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SessionMessage extends Model
{
    protected $fillable = [
        'learning_session_id',
        'material_id',
        'role',
        'content',
        'ai_metadata'
    ];

    protected $casts = [
        'ai_metadata' => 'array',
    ];

    public function learningSession()
    {
        return $this->belongsTo(LearningSession::class);
    }

    public function material()
    {
        return $this->belongsTo(Material::class);
    }
}
