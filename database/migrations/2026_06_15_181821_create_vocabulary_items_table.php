<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vocabulary_items', function (Blueprint $table) {
            $table->id();

            $table->foreignId('curriculum_topic_id')->constrained()->cascadeOnDelete();
            $table->string('theme');               // el vocabulary_theme al que pertenece
            $table->string('level');               // nivel CEFR (denormalizado para filtrar el desbloqueo)

            $table->string('word');                // palabra o frase en inglés
            $table->string('translation');         // traducción al español
            $table->string('part_of_speech')->nullable();   // noun, verb, adjective, phrase...
            $table->text('example')->nullable();             // oración de ejemplo (inglés)
            $table->string('example_translation', 500)->nullable(); // ejemplo traducido
            $table->string('phonetic')->nullable();          // /fəˈnɛtɪk/ (IPA), opcional

            $table->unsignedInteger('sort')->default(0);
            $table->timestamps();

            $table->index('level');
            $table->index(['curriculum_topic_id', 'theme']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vocabulary_items');
    }
};