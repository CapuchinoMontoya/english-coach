<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('student_topic_progress', function (Blueprint $table) {
            $table->decimal('cumulative_score', 5, 2)
                  ->nullable()
                  ->after('score');

            $table->timestamp('last_session_at')
                  ->nullable()
                  ->after('completed_at');

            $table->json('session_data')
                  ->nullable()
                  ->after('last_session_at');
        });
    }

    public function down(): void
    {
        Schema::table('student_topic_progress', function (Blueprint $table) {
            $table->dropColumn(['cumulative_score', 'last_session_at', 'session_data']);
        });
    }
};