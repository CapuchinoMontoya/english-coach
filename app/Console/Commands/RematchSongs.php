<?php

namespace App\Console\Commands;

use App\Models\ListeningActivity;
use App\Services\Listening\LrcLibService;
use App\Services\Listening\YouTubeFinderService;
use Illuminate\Console\Command;
use Throwable;

/**
 * Re-empareja SOLO las canciones (type='song') con su audio correcto para que la
 * letra sincronice. Los clips (type='clip') no se tocan.
 *
 * La letra y su duración YA están en la BD; el problema es el video (muchos apuntan
 * al video musical con intro en vez del audio de estudio). Por eso el objetivo de
 * duración es la 'duration' guardada — no depende de LRCLIB (que puede estar caído).
 *
 * Cuota YouTube: inspeccionar el video actual cuesta 1 unidad; re-buscar cuesta 100.
 * Solo se re-busca lo que está mal. Usa --max-research para acotar por corrida.
 */
class RematchSongs extends Command
{
    protected $signature = 'listening:rematch-songs
        {--id= : Procesar solo esta actividad}
        {--limit=0 : Máximo de canciones a procesar (0 = todas)}
        {--sleep=150 : Pausa en ms entre llamadas a la API}
        {--max-research=0 : Tope de re-búsquedas caras por corrida (0 = sin tope)}
        {--force-research : Re-buscar aunque el video actual parezca bueno}
        {--refresh-lyrics : Además, volver a bajar la letra desde LRCLIB (requiere acceso a lrclib.net)}
        {--dry-run : No guardar ni gastar cuota en re-búsquedas; solo diagnosticar}';

    protected $description = 'Limpia y re-empareja las canciones con su audio bien sincronizado';

    public function handle(LrcLibService $lrc, YouTubeFinderService $yt): int
    {
        $query = ListeningActivity::where('type', 'song')->orderBy('id');
        if ($id = $this->option('id')) $query->where('id', $id);

        $songs = $query->get();
        if ($limit = (int) $this->option('limit')) $songs = $songs->take($limit);

        $sleepUs     = (int) $this->option('sleep') * 1000;
        $maxResearch = (int) $this->option('max-research');
        $force       = (bool) $this->option('force-research');
        $refresh     = (bool) $this->option('refresh-lyrics');
        $dry         = (bool) $this->option('dry-run');

        $kept = $rematched = $deactivated = $skipped = $researches = 0;

        $this->info("Canciones a revisar: {$songs->count()}" . ($dry ? '  (DRY RUN)' : ''));

        foreach ($songs as $s) {
            $this->line("#{$s->id}  {$s->artist} — {$s->title}");

            try {
                // Objetivo de duración: la guardada; si falta, intenta LRCLIB una vez
                $targetDur = (int) $s->duration;
                $lyrics    = null;

                if ($targetDur <= 0 || $refresh) {
                    $lyrics = $this->safeLyrics($lrc, $s->artist, $s->title);
                    if ($lyrics && ($lyrics['duration'] ?? 0) > 0) {
                        $targetDur = (int) $lyrics['duration'];
                    }
                }

                if ($targetDur <= 0) {
                    $this->warn('   ✗ sin duración de referencia (LRCLIB no disponible) → se omite');
                    $skipped++;
                    continue;
                }

                // 1. ¿El video actual ya sirve? (barato: 1 unidad)
                if (! $force && $s->youtube_video_id) {
                    usleep($sleepUs);
                    $info = $yt->inspect($s->youtube_video_id);
                    if ($info
                        && $info['embeddable']
                        && abs($info['duration'] - $targetDur) <= 2
                        && ! $yt->hasBadKeyword($info['title'])
                    ) {
                        $this->info("   ✓ video actual OK ({$s->youtube_video_id}, {$info['duration']}s)");
                        if (! $dry) $this->apply($s, $s->youtube_video_id, 0, $refresh ? $lyrics : null);
                        $kept++;
                        continue;
                    }
                }

                // En dry-run no gastamos cuota cara: solo señalamos que habría que re-buscar
                if ($dry) {
                    $this->warn('   → necesitaría re-búsqueda');
                    $researches++;
                    continue;
                }

                if ($maxResearch && $researches >= $maxResearch) {
                    $this->warn('   … tope de re-búsquedas alcanzado, se deja para otra corrida');
                    $skipped++;
                    continue;
                }

                // 2. Re-buscar el mejor audio (caro: 100 unidades)
                usleep($sleepUs);
                $researches++;
                $match = $yt->findBestMatch($s->artist, $s->title, $targetDur);

                if ($match) {
                    $this->info("   ↻ nuevo audio {$match['video_id']} (≈{$targetDur}s) → re-emparejada");
                    $this->apply($s, $match['video_id'], $match['offset'] ?? 0, $refresh ? $lyrics : null);
                    $rematched++;
                } else {
                    $this->warn('   ✗ sin audio original adecuado → desactivada');
                    $s->update(['is_active' => false]);
                    $deactivated++;
                }
            } catch (Throwable $e) {
                $this->error('   ! error: ' . $e->getMessage() . ' → se omite');
                $skipped++;
            }
        }

        $this->newLine();
        $this->info('── Resumen ──');
        $this->line("  Video actual conservado : {$kept}");
        $this->line("  Re-emparejadas          : {$rematched}");
        $this->line("  Desactivadas            : {$deactivated}");
        $this->line("  Omitidas                : {$skipped}");
        $this->line("  Re-búsquedas            : {$researches}  (~" . ($researches * 100) . ' unidades de cuota)');

        return self::SUCCESS;
    }

    /** LRCLIB con manejo de error/timeout (puede estar caído). */
    private function safeLyrics(LrcLibService $lrc, string $artist, string $title): ?array
    {
        try {
            return $lrc->fetch($artist, $title) ?? $lrc->search($artist, $title);
        } catch (Throwable) {
            return null;
        }
    }

    /**
     * Actualiza video + offset. Si se pasó letra nueva y cambió, la reemplaza y
     * limpia los blanks (se regeneran) para que no queden desalineados.
     */
    private function apply(ListeningActivity $s, string $videoId, float $offset, ?array $lyrics): void
    {
        $data = [
            'youtube_video_id' => $videoId,
            'offset_seconds'   => $offset,
            'is_active'        => true,
        ];

        if ($lyrics && ! empty($lyrics['synced_lyrics'])) {
            $old = $s->synced_lyrics ?? [];
            $new = $lyrics['synced_lyrics'];
            $changed = count($old) !== count($new)
                || (($old[0]['text'] ?? null) !== ($new[0]['text'] ?? null));

            $data['synced_lyrics'] = $new;
            $data['duration']      = $lyrics['duration'] ?: $s->duration;
            $data['lrclib_id']     = $lyrics['lrclib_id'] ?? $s->lrclib_id;
            if ($changed) $data['blanks_by_level'] = null;
        }

        $s->update($data);
    }
}
