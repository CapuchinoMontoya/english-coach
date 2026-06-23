<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Verb extends Model
{
    protected $fillable = [
        'verb', 'infinitive', 'past', 'participle',
        'translation', 'example', 'type',
    ];

    public function scopeRegular($query)   { return $query->where('type', 'regular'); }
    public function scopeIrregular($query) { return $query->where('type', 'irregular'); }
}
