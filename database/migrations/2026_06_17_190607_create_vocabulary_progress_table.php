<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vocabulary_progress', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();

            // Clave de dedupe: se rastrea por PALABRA, no por fila de vocabulary_items,
            // así "house" (que aparece en varios temas) se aprende/repasa una sola vez.
            $table->string('word');
            $table->string('level')->nullable();   // nivel más bajo donde aparece (para UI/orden)

            $table->unsignedTinyInteger('box')->default(1);   // caja Leitner (1-5)
            $table->string('status')->default('learning');    // learning | mastered
            $table->timestamp('due_at')->nullable();          // próximo repaso
            $table->unsignedInteger('times_seen')->default(0);
            $table->unsignedInteger('times_correct')->default(0);
            $table->timestamp('last_reviewed_at')->nullable();

            $table->timestamps();

            $table->unique(['user_id', 'word']);
            $table->index(['user_id', 'due_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vocabulary_progress');
    }
};