<?php

use App\Models\CurriculumTopic;
use App\Models\LearningSession;
use App\Models\StudentTopicProgress;
use App\Models\User;
use Illuminate\Support\Facades\Http;

// Las páginas del alumno deben renderizar con un alumno que YA tiene historial, no solo
// recién registrado: un tema completado, otro en curso y sesiones con calificación. Es
// el estado en el que vive un usuario real y el que más campos toca en las vistas.

beforeEach(function () {
    Http::fake();   // la palabra del día y el descubrimiento de audio salen a internet
});

function alumnoConHistorial(): User
{
    $user = User::factory()->ready('A1')->create();

    // El catálogo no se siembra en la base de tests, así que el test trae los suyos.
    $temas = collect([1, 2, 3])->map(fn ($n) => CurriculumTopic::create([
        'level_from'         => 'A1',
        'level_to'           => 'A2',
        'order'              => $n,
        'title'              => "Tema de prueba $n",
        'description'        => 'Tema sembrado por el test.',
        'grammar_points'     => ["punto $n.1", "punto $n.2", "punto $n.3", "punto $n.4"],
        'vocabulary_themes'  => ['saludos', 'números'],
        'estimated_sessions' => 3,
        'is_active'          => true,
    ]));

    foreach ($temas as $i => $tema) {
        StudentTopicProgress::create([
            'user_id'             => $user->id,
            'curriculum_topic_id' => $tema->id,
            'status'              => $i === 0 ? 'completed' : ($i === 1 ? 'in_progress' : 'pending'),
            'cumulative_score'    => $i === 0 ? 85 : ($i === 1 ? 72 : 0),
            'sessions_count'      => $i === 0 ? 3 : ($i === 1 ? 1 : 0),
            'attempts'            => $i === 0 ? 3 : ($i === 1 ? 1 : 0),
            'completed_at'        => $i === 0 ? now()->subDays(3) : null,
            'session_data'        => [
                'sessions' => $i === 0 ? [
                    ['number' => 1, 'aspect' => 'Pronouns', 'score' => 84, 'errors' => ['articles'], 'date' => now()->subDays(5)->toDateString(), 'grammar_points_covered' => []],
                    ['number' => 2, 'aspect' => 'To be',    'score' => 86, 'errors' => ['articles'], 'date' => now()->subDays(4)->toDateString(), 'grammar_points_covered' => []],
                ] : [],
                'aspects_covered'   => [],
                'aspects_remaining' => $tema->grammar_points ?? [],
                'recurring_errors'  => $i === 0 ? ['articles'] : [],
            ],
        ]);
    }

    $perfil = $user->learningProfile;
    $perfil->update(['current_plan' => array_merge($perfil->current_plan ?? [], [
        'active_transition' => 'A1_to_A2',
        'current_topic_id'  => $temas[1]->id,
    ])]);

    LearningSession::create([
        'user_id'             => $user->id,
        'learning_profile_id' => $perfil->id,
        'mode'                => 'lesson',
        'curriculum_topic_id' => $temas[0]->id,
        'session_number'      => 1,
        'topic_aspect'        => 'Pronouns',
        'score'               => 84,
        'counts_for_plan'     => true,
        'generated_content'   => ['aspect' => 'Pronouns'],
    ]);

    return $user;
}

test('the student pages all render for a student with history', function () {
    $user   = alumnoConHistorial();
    $activo = $user->learningProfile->current_plan['current_topic_id'];

    foreach (['/dashboard', '/lessons', '/progress', '/grammar', '/flashcards',
              '/vocabulary', '/verbs', '/listening', '/settings/profile'] as $ruta) {
        $res = $this->actingAs($user)->get($ruta);

        expect($res->status())->toBeLessThan(400, "$ruta devolvió {$res->status()}");
    }

    $this->actingAs($user)->get("/lessons/{$activo}")->assertSuccessful();
});

test('a topic that is still locked does not open', function () {
    $user      = alumnoConHistorial();
    $bloqueado = CurriculumTopic::where('order', 3)->firstOrFail();

    // El tema 3 está "pending" y el 2 sin completar, así que no debe abrirse
    $this->actingAs($user)->get("/lessons/{$bloqueado->id}")->assertRedirect();
});
