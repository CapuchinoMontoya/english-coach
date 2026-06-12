<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;

class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'google_id',
        'role',
        'homework_enabled',
        'avatar', 
        'email_notifications',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected $casts = [
        'homework_enabled' => 'boolean',
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'email_notifications' => 'boolean',
    ];

    public function learningProfile()
    {
        return $this->hasOne(LearningProfile::class);
    }

    public function materials()
    {
        return $this->hasMany(Material::class);
    }

    public function learningSessions()
    {
        return $this->hasMany(LearningSession::class);
    }

    public function homeworkSubmissions()
    {
        return $this->hasMany(HomeworkSubmission::class);
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function aiContext(): HasOne
    {
        return $this->hasOne(UserAiContext::class);
    }

    public function topicProgress(): HasMany
    {
        return $this->hasMany(StudentTopicProgress::class);
    }

    protected function getAvatarUrlAttribute(): ?string
    {
        if (! $this->avatar) return null;
        return Storage::disk('public')->url($this->avatar);
    }
}
