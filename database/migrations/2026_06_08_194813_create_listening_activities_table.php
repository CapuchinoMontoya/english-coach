<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('listening_activities', function (Blueprint $table) {
            $table->id();

            $table->string('title');
            $table->string('artist');
            $table->string('youtube_video_id');

            // Referencia y metadatos de LRCLIB
            $table->unsignedBigInteger('lrclib_id')->nullable();
            $table->unsignedInteger('duration')->nullable();        // segundos (de LRCLIB)
            $table->decimal('offset_seconds', 5, 2)->default(0);    // ajuste fino de sincronía

            // Letra sincronizada SIN blanks: [{time, end, text}, ...]
            $table->json('synced_lyrics');

            // Blanks pre-seleccionados por nivel por la IA:
            // {"A2": [{"line":1,"word":"...","distractors":["...","...","..."]}], "B1": [...]}
            $table->json('blanks_by_level')->nullable();

            $table->string('level')->nullable();                    // nivel sugerido
            $table->json('vocabulary_themes')->nullable();
            $table->json('tags')->nullable();                       // géneros/artistas para matchear intereses
            $table->string('source')->default('lrclib');
            $table->unsignedInteger('times_played')->default(0);
            $table->boolean('is_active')->default(true);

            $table->timestamps();

            $table->index('duration');
            $table->index('level');
        });

        // Historial: qué canciones jugó cada usuario (evita repetir, guarda score)
        Schema::create('listening_activity_user', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('listening_activity_id')->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('score')->nullable();
            $table->timestamp('played_at')->useCurrent();

            $table->index(['user_id', 'played_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('listening_activity_user');
        Schema::dropIfExists('listening_activities');
    }
};