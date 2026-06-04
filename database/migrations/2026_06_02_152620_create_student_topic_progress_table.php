<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('student_topic_progress', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')
                  ->constrained()
                  ->cascadeOnDelete();
            $table->foreignId('curriculum_topic_id')
                  ->constrained('curriculum_topics')
                  ->cascadeOnDelete();
            $table->enum('status', ['pending', 'in_progress', 'completed', 'needs_review'])
                  ->default('pending');
            $table->unsignedTinyInteger('score')->nullable();
            $table->unsignedTinyInteger('sessions_count')->default(0);
            $table->unsignedTinyInteger('attempts')->default(0);
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'curriculum_topic_id']);
            $table->index(['user_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_topic_progress');
    }
};