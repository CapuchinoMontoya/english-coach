<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('listening_activities', function (Blueprint $table) {
            // Preguntas de comprensión por nivel (para type='clip'):
            // {"A2": [{"question":"...","options":["..."],"correct":0,"explanation":"..."}], "B1": [...]}
            $table->json('questions_by_level')->nullable()->after('blanks_by_level');
        });
    }

    public function down(): void
    {
        Schema::table('listening_activities', fn (Blueprint $t) => $t->dropColumn('questions_by_level'));
    }
};
