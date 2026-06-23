<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('verb_progress', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('verb_id')->constrained()->cascadeOnDelete();

            $table->unsignedTinyInteger('box')->default(1);   // caja Leitner
            $table->string('status')->default('learning');    // learning | mastered
            $table->timestamp('due_at')->nullable();

            $table->unsignedInteger('times_seen')->default(0);
            $table->unsignedInteger('times_correct')->default(0);
            $table->timestamp('last_reviewed_at')->nullable();

            $table->timestamps();

            $table->unique(['user_id', 'verb_id']);
            $table->index(['user_id', 'due_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('verb_progress');
    }
};
