<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureOnboardingDone
{
    public function handle(Request $request, Closure $next): Response
    {
        $profile = $request->user()?->learningProfile;

        if (! $profile || ! $profile->onboarding_done) {
            return redirect()->route('onboarding');
        }

        return $next($request);
    }
}
