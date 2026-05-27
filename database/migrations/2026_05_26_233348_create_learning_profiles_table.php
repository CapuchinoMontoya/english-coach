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
        Schema::create('learning_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->enum('declared_level', ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'])->nullable();
            $table->enum('real_level', ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'])->nullable();
            $table->json('weak_areas')->nullable();
            $table->json('strong_areas')->nullable();
            $table->json('learning_style')->nullable();
            $table->json('current_plan')->nullable();
            $table->boolean('placement_done')->default(false);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('learning_profiles');
    }
};
