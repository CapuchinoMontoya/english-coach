<?php 
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;
use App\Models\LearningSession;

class StreakController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        // 1. Obtenemos las fechas crudas de la BD
        $rawDates = LearningSession::query()
            ->where('user_id', $user->id)
            ->where('mode', '!=', 'placement')
            ->whereNotNull('score') // whereNotNull es más nativo en Laravel
            ->selectRaw('DATE(created_at) as session_date')
            ->orderByDesc('session_date')
            ->pluck('session_date')
            ->toArray();

        // 2. Blindaje crítico: Eliminamos duplicados y reindexamos el arreglo
        // array_values garantiza que los índices sean [0, 1, 2...] sin saltos
        $dates = array_values(array_unique($rawDates));

        $today = now()->toDateString();
        $yesterday = now()->subDay()->toDateString();

        // 3. Construir los últimos 30 días para el Heatmap
        $last30 = [];
        for ($i = 29; $i >= 0; $i--) {
            $dateCheck = now()->subDays($i)->toDateString();
            $last30[] = in_array($dateCheck, $dates);
        }

        if (empty($dates)) {
            return Inertia::render('StreakIndex', [
                'currentStreak' => 0,
                'longestStreak' => 0,
                'last30' => $last30,
            ]);
        }

        // 4. Calcular Racha Actual (Current Streak)
        $currentStreak = 0;
        
        if ($dates[0] === $today || $dates[0] === $yesterday) {
            $currentStreak = 1;
            
            for ($i = 0; $i < count($dates) - 1; $i++) {
                // Generamos la fecha exacta que esperamos ver en la siguiente iteración
                $expectedDate = Carbon::parse($dates[$i])->subDay()->toDateString();
                
                // Comparamos strings (ej. '2026-06-14' === '2026-06-14')
                if ($dates[$i+1] === $expectedDate) {
                    $currentStreak++;
                } else {
                    break;
                }
            }
        }

        // 5. Calcular Racha Más Larga (Longest Streak)
        $longestStreak = 1;
        $tempStreak = 1;
        
        for ($i = 0; $i < count($dates) - 1; $i++) {
            $expectedDate = Carbon::parse($dates[$i])->subDay()->toDateString();
            
            if ($dates[$i+1] === $expectedDate) {
                $tempStreak++;
            } else {
                $tempStreak = 1;
            }
            $longestStreak = max($longestStreak, $tempStreak);
        }

        $longestStreak = max($currentStreak, $longestStreak);

        return Inertia::render('StreakIndex', [
            'currentStreak' => $currentStreak,
            'longestStreak' => $longestStreak,
            'last30'        => $last30,
        ]);
    }
}