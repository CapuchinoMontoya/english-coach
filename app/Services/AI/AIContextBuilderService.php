<?php

namespace App\Services\AI;

use App\Models\CurriculumTopic;
use App\Models\TeachingTechnique;
use App\Models\User;

class AIContextBuilderService
{
    /**
     * Construye el system prompt completo para una sesión.
     * Este es el "LLM personal" del usuario — su perfil comprimido + técnica recomendada.
     */
    public function buildSystemPrompt(
        User            $user,
        string          $mode,
        ?CurriculumTopic $topic = null
    ): string {
        $profile   = $user->learningProfile;
        $aiContext = $user->aiContext?->context ?? [];
        $firstName = explode(' ', trim($user->name))[0];

        // Busca técnica exitosa del shared pool para este perfil + tema
        $technique = null;
        if ($topic) {
            $technique = TeachingTechnique::query()
                ->where('is_active', true)
                ->where('level', $profile->real_level)
                ->where('learning_style', data_get($aiContext, 'learning_style.preferred', 'conversational'))
                ->where('success_rate', '>=', 85)
                ->orderByDesc('success_rate')
                ->first();
        }

        return view("ai.prompts.{$mode}", compact(
            'user', 'profile', 'aiContext', 'topic', 'technique', 'firstName'
        ))->render();
    }
}