<?php

namespace App\Http\Controllers;

use App\Services\Vocabulary\VerbStudyService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class VerbController extends Controller
{
    public function __construct(private VerbStudyService $verbs) {}

    /** Catálogo navegable de verbos + resumen de progreso. */
    public function index(Request $request)
    {
        return Inertia::render('verbs/index', [
            'verbs'   => $this->verbs->browse(null, null),
            'summary' => $this->verbs->summary($request->user()),
        ]);
    }

    /**
     * Sesión de estudio.
     *   /verbs/study               → mixta
     *   /verbs/study?type=regular  → solo regulares
     *   /verbs/study?type=irregular→ solo irregulares
     */
    public function study(Request $request)
    {
        $type = in_array($request->query('type'), ['regular', 'irregular'], true)
            ? $request->query('type')
            : null;

        return Inertia::render('verbs/study', [
            'cards' => $this->verbs->buildSession($request->user(), $type),
            'type'  => $type,
        ]);
    }

    /** Registra una respuesta y mueve el verbo en el SRS. */
    public function answer(Request $request)
    {
        $data = $request->validate([
            'verb_id' => ['required', 'integer'],
            'correct' => ['required', 'boolean'],
        ]);

        $progress = $this->verbs->recordAnswer(
            $request->user(),
            $data['verb_id'],
            $data['correct'],
        );

        return response()->json([
            'box'    => $progress->box,
            'status' => $progress->status,
        ]);
    }
}
