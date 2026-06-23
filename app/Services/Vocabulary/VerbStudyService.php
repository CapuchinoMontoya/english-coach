<?php

namespace App\Services\Vocabulary;

use App\Models\User;
use App\Models\Verb;
use App\Models\VerbProgress;
use Illuminate\Support\Collection;

/**
 * Estudio de verbos orientado a APRENDER, no memorizar:
 * el alumno conoce el verbo en contexto y progresa de reconocer las formas
 * a producirlas dentro de una oración real (SRS Leitner).
 */
class VerbStudyService
{
    // ════════════════════════════════════════════════════════════════════════
    //  RESUMEN
    // ════════════════════════════════════════════════════════════════════════

    public function summary(User $user): array
    {
        $total    = Verb::count();
        $progress = VerbProgress::where('user_id', $user->id)->get();

        return [
            'total'     => $total,
            'mastered'  => $progress->where('status', 'mastered')->count(),
            'learning'  => $progress->where('status', 'learning')->count(),
            'due'       => $progress->filter(fn ($p) => $p->due_at && $p->due_at->lte(now()))->count(),
            'regular'   => Verb::regular()->count(),
            'irregular' => Verb::irregular()->count(),
        ];
    }

    // ════════════════════════════════════════════════════════════════════════
    //  ARMAR SESIÓN DE ESTUDIO
    // ════════════════════════════════════════════════════════════════════════

    /**
     * Sesión mixta: verbos nuevos + repasos vencidos.
     * $type (regular|irregular|null) acota el set.
     */
    public function buildSession(User $user, ?string $type = null, int $size = 12): array
    {
        $known = VerbProgress::where('user_id', $user->id)->pluck('box', 'verb_id'); // [verb_id => box]

        // Repasos vencidos primero
        $dueIds = VerbProgress::where('user_id', $user->id)->due()
            ->orderBy('due_at')->limit($size)->pluck('verb_id');

        $dueVerbs = Verb::whereIn('id', $dueIds)
            ->when($type, fn ($q) => $q->where('type', $type))->get();

        // Completa con verbos nuevos (no vistos), los más comunes primero (orden de inserción)
        $remaining = max(0, $size - $dueVerbs->count());
        $newVerbs  = $remaining > 0
            ? Verb::when($type, fn ($q) => $q->where('type', $type))
                ->whereNotIn('id', $known->keys())
                ->orderBy('id')->limit($remaining)->get()
            : collect();

        $cards = collect();
        foreach ($newVerbs as $v)  $cards->push($this->buildCard($v, box: 0));         // nuevo → intro
        foreach ($dueVerbs as $v)  $cards->push($this->buildCard($v, box: $known[$v->id] ?? 1));

        return $cards->values()->all();
    }

    /**
     * Construye una "card" de práctica. El alumno APRENDE escribiendo el verbo:
     *   - nuevo → primero ve la intro (formas + ejemplo + audio).
     *   - práctica: juego de conjugación donde escribe las 3 formas y la traducción.
     * La dirección alterna según la caja para que practique en ambos sentidos:
     *   - 'es_to_en' : ve el español → escribe base, pasado y participio en inglés.
     *   - 'en_to_es' : ve la base en inglés → escribe la traducción, el pasado y el participio.
     */
    private function buildCard(Verb $v, int $box): array
    {
        $isNew     = $box === 0;
        $direction = ($box % 2 === 0) ? 'es_to_en' : 'en_to_es';

        return [
            'id'          => $v->id,
            'verb'        => $v->verb,
            'infinitive'  => $v->infinitive,
            'past'        => $v->past,
            'participle'  => $v->participle,
            'translation' => $v->translation,
            'example'     => $v->example,
            'type'        => $v->type,
            'is_new'      => $isNew,
            'mode'        => 'conjugate',
            'direction'   => $direction,
        ];
    }

    // ════════════════════════════════════════════════════════════════════════
    //  REGISTRAR RESPUESTA
    // ════════════════════════════════════════════════════════════════════════

    public function recordAnswer(User $user, int $verbId, bool $correct): VerbProgress
    {
        $progress = VerbProgress::firstOrCreate(
            ['user_id' => $user->id, 'verb_id' => $verbId],
            ['box' => 1, 'status' => 'learning', 'due_at' => now()]
        );

        $correct ? $progress->markCorrect() : $progress->markWrong();

        return $progress;
    }

    // ════════════════════════════════════════════════════════════════════════
    //  INTEGRACIÓN CON LECCIONES (desde A1)
    // ════════════════════════════════════════════════════════════════════════

    /**
     * Verbos foco para tejer en una lección: prioriza los que el alumno ya está
     * aprendiendo (en repaso) y completa con verbos comunes que aún no ha visto.
     */
    public function focusVerbsForLesson(User $user, int $count = 4): array
    {
        $learningIds = VerbProgress::where('user_id', $user->id)
            ->where('status', 'learning')
            ->orderBy('due_at')
            ->limit($count)
            ->pluck('verb_id');

        $verbs = Verb::whereIn('id', $learningIds)->get();

        if ($verbs->count() < $count) {
            $knownIds = VerbProgress::where('user_id', $user->id)->pluck('verb_id');
            $fill = Verb::whereNotIn('id', $knownIds->merge($verbs->pluck('id')))
                ->orderBy('id')                         // los más comunes primero
                ->limit($count - $verbs->count())
                ->get();
            $verbs = $verbs->concat($fill);
        }

        return $verbs->map(fn ($v) => [
            'verb'        => $v->verb,
            'past'        => $v->past,
            'participle'  => $v->participle,
            'translation' => $v->translation,
            'type'        => $v->type,
        ])->values()->all();
    }

    /** Mete los verbos foco al SRS como introducidos (entran al ciclo de repaso). */
    public function introduceFocusVerbs(User $user, array $verbWords): void
    {
        $ids = Verb::whereIn('verb', $verbWords)->pluck('id');
        foreach ($ids as $id) {
            VerbProgress::firstOrCreate(
                ['user_id' => $user->id, 'verb_id' => $id],
                ['box' => 1, 'status' => 'learning', 'due_at' => now()]
            );
        }
    }

    // ════════════════════════════════════════════════════════════════════════
    //  CATÁLOGO (navegar/buscar/filtrar)
    // ════════════════════════════════════════════════════════════════════════

    public function browse(?string $search, ?string $type): Collection
    {
        return Verb::query()
            ->when($type, fn ($q) => $q->where('type', $type))
            ->when($search, function ($q) use ($search) {
                $q->where(function ($qq) use ($search) {
                    $qq->where('verb', 'like', "%{$search}%")
                       ->orWhere('past', 'like', "%{$search}%")
                       ->orWhere('participle', 'like', "%{$search}%")
                       ->orWhere('translation', 'like', "%{$search}%");
                });
            })
            ->orderBy('verb')
            ->get(['id', 'verb', 'infinitive', 'past', 'participle', 'translation', 'example', 'type']);
    }
}
