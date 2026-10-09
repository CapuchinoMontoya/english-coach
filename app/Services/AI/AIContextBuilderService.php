<?php

namespace App\Services\AI;

use App\Models\CurriculumTopic;
use App\Models\TeachingTechnique;
use App\Models\User;

class AIContextBuilderService
{
    /**
     * Construye el system prompt completo para una sesión.
     *
     * @param array $extra  Datos adicionales para el prompt (ej: ['sessionState' => [...]])
     */
    public function buildSystemPrompt(
        User             $user,
        string           $mode,
        ?CurriculumTopic $topic = null,
        array            $extra = []
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

        $prompt = view("ai.prompts.{$mode}", array_merge(
            compact('user', 'profile', 'aiContext', 'topic', 'technique', 'firstName'),
            $extra
        ))->render();

        // Blade escapa para HTML, pero esto es texto plano para un modelo: sin decodificar,
        // el prompt le llega con "I&#039;m" y "Verb To Be &amp; Pronouns", y el modelo
        // reproduce esas entidades dentro de las lecciones.
        return html_entity_decode($prompt, ENT_QUOTES | ENT_HTML5, 'UTF-8');
    }
}