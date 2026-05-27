<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Material extends Model
{
    protected $fillable = [
        'user_id',
        'title',
        'type',
        'content',
        'file_path',
        'topic'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
