<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserAiContext extends Model
{
    protected $fillable = [
        'user_id',
        'context',
        'last_updated_at',
    ];

    protected $casts = [
        'context'         => 'array',
        'last_updated_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function get(string $key, mixed $default = null): mixed
    {
        return data_get($this->context, $key, $default);
    }

    public function set(string $key, mixed $value): void
    {
        $context = $this->context ?? [];
        data_set($context, $key, $value);
        $this->context = $context;
    }
}
