<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('verbs', function (Blueprint $table) {
            $table->id();

            $table->string('verb')->unique();      // forma base / lema: go, work, eat
            $table->string('infinitive');          // to go, to work, to eat
            $table->string('past');                // pasado simple: went, worked, ate
            $table->string('participle');          // participio pasado: gone, worked, eaten
            $table->string('translation');         // traducción al español
            $table->string('example', 500);        // oración de ejemplo en inglés
            $table->string('type', 10);            // 'regular' | 'irregular'

            $table->timestamps();

            $table->index('type');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('verbs');
    }
};
