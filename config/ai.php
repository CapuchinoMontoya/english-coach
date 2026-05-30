<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Routing de modelos por tarea
    |--------------------------------------------------------------------------
    | claude → calidad pedagógica (placement, lecciones, evaluaciones)
    | gemini → volumen y velocidad (actividades, jobs, word of the day)
    */
    'providers' => [
        'placement'       => 'claude',
        'lesson'          => 'claude',
        'exam_evaluation' => 'claude',
        'activity'        => 'gemini',
        'emergency'       => 'gemini',
        'profile_update'  => 'gemini',
        'word_of_the_day' => 'gemini',
    ],

    'claude' => [
        'api_key' => env('ANTHROPIC_API_KEY'),
        'model'   => env('CLAUDE_MODEL', 'claude-haiku-4-5-20251001'),
    ],

    'gemini' => [
        'api_key' => env('GEMINI_API_KEY'),
        'model'   => env('GEMINI_MODEL', 'gemini-2.0-flash'),
    ],

];