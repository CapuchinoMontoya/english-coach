<?php

namespace App\Http\Controllers;

use App\Services\Vocabulary\VocabularyStudyService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class VocabularyController extends Controller
{
    public function __construct(private VocabularyStudyService $study) {}

    /**
     * Índice: temas desbloqueados + progreso + cuántos repasos hay pendientes.
     */
    public function index(Request $request)
    {
        $user = $request->user();

        // 1. Capturamos los filtros de la URL (búsqueda y nivel)
        $filters = $request->only(['search', 'level']);

        // 2. Modificamos la llamada para pasar los filtros.
        // IMPORTANTE: Deberás actualizar el método themesFor() en tu clase Study 
        // para que aplique estos filtros (where / like) y devuelva un ->paginate(10) en lugar de ->get()
        $themes = $this->study->themesFor($user, $filters);

        return Inertia::render('vocabulary/index', [
            'themes'   => $themes, // Ahora esto es un objeto de paginación de Laravel
            'filters'  => $filters, // Pasamos los filtros de vuelta a React
            'dueCount' => $this->study->dueCount($user) ?? 0,
            'level'    => $user->learningProfile->real_level ?? null,
        ]);
    }

    /**
     * Sesión de estudio.
     *   /vocabulary/study              → mixta (nuevas + repasos)
     *   /vocabulary/study?theme=...    → de ese tema
     *   /vocabulary/study?mode=review  → solo repasos vencidos
     */
    public function study(Request $request)
    {
        $user  = $request->user();
        $theme = $request->query('theme');

        $cards = $request->query('mode') === 'review'
            ? $this->study->buildReviews($user)
            : $this->study->buildSession($user, $theme);

        return Inertia::render('vocabulary/study', [
            'cards' => $cards,
            'theme' => $theme,
        ]);
    }

    /**
     * Registra una respuesta y mueve la palabra en el SRS.
     */
    public function answer(Request $request)
    {
        $data = $request->validate([
            'word'    => ['required', 'string'],
            'correct' => ['required', 'boolean'],
        ]);

        $progress = $this->study->recordAnswer(
            $request->user(),
            $data['word'],
            $data['correct'],
        );

        return response()->json([
            'word'   => $progress->word,
            'box'    => $progress->box,
            'status' => $progress->status,
        ]);
    }
}
