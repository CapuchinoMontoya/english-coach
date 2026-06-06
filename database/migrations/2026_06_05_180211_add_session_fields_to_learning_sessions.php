<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('learning_sessions', function (Blueprint $table) {
            $table->foreignId('curriculum_topic_id')
                  ->nullable()
                  ->after('mode')
                  ->constrained('curriculum_topics')
                  ->nullOnDelete();

            $table->unsignedTinyInteger('session_number')
                  ->default(1)
                  ->after('curriculum_topic_id');

            $table->string('topic_aspect')->nullable()->after('session_number');

            $table->index(['user_id', 'curriculum_topic_id']);
        });
    }

    public function down(): void
    {
        Schema::table('learning_sessions', function (Blueprint $table) {
            $table->dropConstrainedForeignId('curriculum_topic_id');
            $table->dropColumn(['session_number', 'topic_aspect']);
        });
    }
};