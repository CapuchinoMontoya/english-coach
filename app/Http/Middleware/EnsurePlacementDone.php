<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsurePlacementDone
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $profile = $request->user()?->learningProfile;

        if (! $profile || ! $profile->onboarding_done) {
            return redirect()->route('onboarding');
        }

        if (! $profile->placement_done) {
            return redirect()->route('placement');
        }

        return $next($request);
    }
}
