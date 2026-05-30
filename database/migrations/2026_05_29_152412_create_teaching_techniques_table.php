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
        Schema::create('teaching_techniques', function (Blueprint $table) {
            $table->id();
            $table->string('topic');
            $table->enum('level', ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']);
            $table->string('learning_style');
            $table->string('age_group');
            $table->text('technique_summary');
            $table->integer('score');
            $table->decimal('success_rate', 5, 2);
            $table->unsignedInteger('usage_count')->default(1);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('teaching_techniques');
    }
};
