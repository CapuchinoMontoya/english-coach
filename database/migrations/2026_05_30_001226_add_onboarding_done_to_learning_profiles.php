<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('learning_profiles', function (Blueprint $table) {
            $table->boolean('onboarding_done')->default(false)->after('placement_done');
        });
    }

    public function down(): void
    {
        Schema::table('learning_profiles', function (Blueprint $table) {
            $table->dropColumn('onboarding_done');
        });
    }
};
