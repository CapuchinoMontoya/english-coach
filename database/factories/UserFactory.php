<?php

namespace Database\Factories;

use App\Models\LearningProfile;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\User>
 */
class UserFactory extends Factory
{
    protected static ?string $password;

    public function definition(): array
    {
        return [
            'name'              => fake()->name(),
            'email'             => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            'password'          => static::$password ??= Hash::make('password'),
            'remember_token'    => Str::random(10),
            'role'              => 'student',
        ];
    }

    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => ['email_verified_at' => null]);
    }

    /** Alumno con onboarding y placement completos (listo para el dashboard). */
    public function ready(string $level = 'A2'): static
    {
        return $this->afterCreating(function ($user) use ($level) {
            LearningProfile::create([
                'user_id'         => $user->id,
                'real_level'      => $level,
                'onboarding_done' => true,
                'placement_done'  => true,
                'learning_style'  => ['goal' => 'general', 'preferred' => 'conversational', 'interests' => ['Music']],
            ]);
        });
    }
}
