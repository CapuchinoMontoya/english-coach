<?php

namespace App\Http\Controllers;

use App\Models\ListeningActivity;
use App\Models\LearningSession;
use App\Services\Listening\ClipActivityService;
use App\Services\Listening\ListeningActivityService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ListeningController extends Controller
{
    public function __construct(
        private ListeningActivityService $listening,
        private ClipActivityService      $clips,
    ) {}

    // Apartado de práctica libre — lista plana con historial del usuario
    public function index(Request $request): Response
    {
        $user = $request->user();

        $songs = ListeningActivity::active()
            ->orderBy('artist')
            ->orderBy('title')
            ->get(['id', 'title', 'artist', 'level', 'type']);

        $history = DB::table('listening_activity_user')
            ->where('user_id', $user->id)
            ->selectRaw('listening_activity_id, MAX(score) as best_score, COUNT(*) as times_played')
            ->groupBy('listening_activity_id')
            ->get()
            ->keyBy('listening_activity_id');

        $list = $songs->map(function ($s) use ($history) {
            $h = $history->get($s->id);
            return [
                'id'           => $s->id,
                'title'        => $s->title,
                'artist'       => $s->artist,
                'level'        => $s->level,
                'type'         => $s->type,
                'best_score'   => $h ? (int) $h->best_score : null,
                'times_played' => (int) ($h->times_played ?? 0),
            ];
        })->values();

        return Inertia::render('listening/index', ['songs' => $list]);
    }

    // Jugar una actividad — el contenido se sirve según el nivel del usuario
    public function show(Request $request, int $id): Response
    {
        $user     = $request->user();
        $activity = ListeningActivity::active()->findOrFail($id);
        $level    = $user->learningProfile->real_level ?? 'B1';
        // 'lesson' si viene de la tarjeta de lección, 'free' si es práctica libre
        $source   = $request->query('from') === 'lesson' ? 'lesson' : 'free';

        // Clip de video: ver la escena y responder preguntas de comprensión
        if ($activity->type === 'clip') {
            $this->clips->ensureQuestionsForLevel($activity, $level);
            $activity->refresh();

            return Inertia::render('listening/clip', [
                'activityId' => $activity->id,
                'clip'       => $activity->buildClipForLevel($level),
                'level'      => $level,
                'source'     => $source,
            ]);
        }

        // Canción: completar la letra mientras suena
        $this->listening->ensureBlanksForLevel($activity, $level);
        $activity->refresh();

        return Inertia::render('listening/play', [
            'activityId' => $activity->id,
            'song'       => $activity->buildSongForLevel($level),
            'level'      => $level,
            'source'     => $source,
        ]);
    }

    // Guardar el resultado al terminar
    public function complete(Request $request): JsonResponse
    {
        $data = $request->validate([
            'activity_id' => 'required|integer',
            'correct'     => 'required|integer',
            'total'       => 'required|integer',
            'score'       => 'required|integer',
            'source'      => 'nullable|in:lesson,free',
        ]);

        $user     = $request->user();
        $activity = ListeningActivity::query()->find($data['activity_id']);

        if ($activity) {
            $this->listening->recordPlay($user, $activity, $data['score'], $data['source'] ?? 'free');
        }

        LearningSession::create([
            'user_id'             => $user->id,
            'learning_profile_id' => $user->learningProfile->id,
            'mode'                => 'activity',
            'score'               => $data['score'],
            'counts_for_plan'     => false,
        ]);

        return response()->json(['ok' => true]);
    }
}