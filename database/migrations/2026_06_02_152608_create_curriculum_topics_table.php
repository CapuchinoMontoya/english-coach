<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('curriculum_topics', function (Blueprint $table) {
            $table->id();
            $table->enum('level_from', ['A1', 'A2', 'B1', 'B2', 'C1']);
            $table->enum('level_to',   ['A2', 'B1', 'B2', 'C1', 'C2']);
            $table->unsignedTinyInteger('order');
            $table->string('title');
            $table->text('description');
            $table->json('grammar_points');
            $table->json('vocabulary_themes');
            $table->unsignedTinyInteger('estimated_sessions')->default(3);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['level_from', 'level_to', 'order']);
            $table->index(['level_from', 'level_to']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('curriculum_topics');
    }
};