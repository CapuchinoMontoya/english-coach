<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Http\JsonResponse;

class PhoneticController extends Controller
{
    /**
     * Envía el texto al microservicio de Python y retorna la fonética.
     */
    public function translate(Request $request): JsonResponse
    {
        // 1. Validamos que el usuario envíe un texto válido
        $request->validate([
            'text' => 'required|string|max:1000',
        ]);

        $textToTranslate = $request->input('text');

        try {
            // 2. Hacemos la petición POST al microservicio de FastAPI
            // En producción, reemplaza 'http://127.0.0.1:8000' por una variable en tu archivo .env
            $response = Http::timeout(3) // Si tarda más de 3 segundos, aborta para no bloquear al usuario
                            ->post('http://127.0.0.1:8002/translate', [
                                'text' => $textToTranslate,
                            ]);

            // 3. Si el microservicio responde correctamente (Status 200)
            if ($response->successful()) {
                return response()->json([
                    'status' => 'success',
                    'data' => $response->json() // Contiene original e ipa
                ]);
            }

            // Si el microservicio responde con un error HTTP
            return response()->json([
                'status' => 'error',
                'message' => 'El traductor fonético experimentó un problema.'
            ], $response->status());

        } catch (\Exception $e) {
            // 4. Si el microservicio está apagado o no responde
            return response()->json([
                'status' => 'error',
                'message' => 'No se pudo conectar con el servidor fonético. Inténtalo más tarde.'
            ], 503);
        }
    }
}