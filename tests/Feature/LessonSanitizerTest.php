<?php

use App\Http\Controllers\SessionController;

// Los dos guardas deterministas de la generación de lecciones. Existen porque la IA
// los incumplía de forma intermitente por más explícito que fuera el prompt:
//  - fill_blank con dos huecos y una sola respuesta: imposible de contestar (un campo).
//  - grammar_points_covered parafraseado: el orquestador compara estas cadenas contra
//    el catálogo del tema por igualdad, así que una paráfrasis dejaba el tema sin cerrar.

function invokePrivate(string $method, array $args)
{
    $controller = app(SessionController::class);
    $ref        = new ReflectionMethod($controller, $method);
    $ref->setAccessible(true);

    return $ref->invokeArgs($controller, $args);
}

// ── fill_blank: un solo hueco ────────────────────────────────────────────────

test('a fill_blank with one gap survives', function () {
    $out = invokePrivate('sanitizeExercise', [[
        'type' => 'fill_blank', 'question' => 'I _____ not Mexican.', 'answer' => 'am',
    ]]);

    expect($out)->not->toBeNull();
    expect($out['question'])->toBe('I _____ not Mexican.');
    expect($out['answer'])->toBe('am');
});

test('a fill_blank with two gaps is discarded', function () {
    $out = invokePrivate('sanitizeExercise', [[
        'type'     => 'fill_blank',
        'question' => 'In the _____ (3) game... the _____ (4) game too.',
        'answer'   => 'third',
    ]]);

    expect($out)->toBeNull();
});

test('a fill_blank with no gap gets one carved out of the visible answer', function () {
    $out = invokePrivate('sanitizeExercise', [[
        'type' => 'fill_blank', 'question' => 'Eminem is from Detroit.', 'answer' => 'is',
    ]]);

    expect($out)->not->toBeNull();
    expect($out['question'])->toContain('_____');
    expect($out['question'])->not->toContain(' is ');
});

// ── grammar_points_covered: siempre la cadena exacta del catálogo ────────────

dataset('catalog', [[[
    'subject pronouns: I, you, he, she, it, we, they',
    'verb to be: am, is, are (positive, negative, question)',
    'yes/no short answers: Yes, I am. / No, she isn\'t.',
]]]);

test('an exact grammar point passes through unchanged', function (array $catalog) {
    $out = invokePrivate('matchGrammarPoints', [[$catalog[1]], $catalog]);

    expect($out)->toBe([$catalog[1]]);
})->with('catalog');

test('a paraphrased grammar point is mapped back to the catalog string', function (array $catalog) {
    // La IA acota el punto para reflejar que solo enseñó la negación. Es honesto,
    // pero debe guardarse con la cadena del catálogo o el tema nunca avanza.
    $out = invokePrivate('matchGrammarPoints', [['verb to be: am, is, are (negative)'], $catalog]);

    expect($out)->toBe([$catalog[1]]);
})->with('catalog');

test('case and punctuation differences still match', function (array $catalog) {
    $out = invokePrivate('matchGrammarPoints', [['SUBJECT PRONOUNS - I, YOU, HE, SHE, IT, WE, THEY'], $catalog]);

    expect($out)->toBe([$catalog[0]]);
})->with('catalog');

test('two paraphrases of the same point collapse into one', function (array $catalog) {
    $out = invokePrivate('matchGrammarPoints', [[
        'verb to be: am, is, are (negative)',
        'verb to be: am, is, are (question)',
    ], $catalog]);

    expect($out)->toBe([$catalog[1]]);
})->with('catalog');

test('a point that is not in the topic is dropped', function (array $catalog) {
    $out = invokePrivate('matchGrammarPoints', [['present perfect continuous with since and for'], $catalog]);

    expect($out)->toBe([]);
})->with('catalog');

test('an empty catalog yields no covered points', function () {
    expect(invokePrivate('matchGrammarPoints', [['anything at all'], []]))->toBe([]);
});
