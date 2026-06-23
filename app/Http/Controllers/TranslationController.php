<?php

// app/Http/Controllers/TranslationController.php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\TranslationService;
use Exception;

class TranslationController extends Controller
{
    // Inyectamos el servicio directamente en el método
    public function translate(Request $request, TranslationService $translationService)
    {
        // 1. Validar
        $request->validate([
            'texto' => 'required|string',
            'idioma_destino' => 'required|string|max:2', 
        ]);

        // 2. Procesar a través del Servicio
        try {
            $translatedHtml = $translationService->translateHtml(
                $request->texto, 
                $request->idioma_destino
            );

            // 3. Responder
            return response()->json([
                'traducido' => $translatedHtml
            ]);

        } catch (Exception $e) {
            // Manejo de errores limpio
            return response()->json(['error' => 'No se pudo traducir el contenido.'], 500);
        }
    }
}