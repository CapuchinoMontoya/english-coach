<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // De dónde se jugó: 'lesson' (bloquea sugerencias futuras) o 'free' (solo historial)
        Schema::table('listening_activity_user', function (Blueprint $table) {
            $table->string('source')->default('free')->after('score');
        });

        // Tipo de actividad — por ahora todo es 'song', pero deja la puerta abierta
        // a 'podcast', 'dialogue', 'interview', etc.
        Schema::table('listening_activities', function (Blueprint $table) {
            $table->string('type')->default('song')->after('id');
        });
    }

    public function down(): void
    {
        Schema::table('listening_activity_user', fn (Blueprint $t) => $t->dropColumn('source'));
        Schema::table('listening_activities', fn (Blueprint $t) => $t->dropColumn('type'));
    }
};