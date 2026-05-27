<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('learning_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('learning_profile_id')->constrained()->cascadeOnDelete();
            $table->enum('mode', [
                'placement',
                'lesson',
                'activity',
                'emergency',
                'homework_review'
            ]);
            $table->string('topic')->nullable();
            $table->integer('score')->nullable();
            $table->boolean('counts_for_plan')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('learning_sessions');
    }
};
