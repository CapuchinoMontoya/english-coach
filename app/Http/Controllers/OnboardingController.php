<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class OnboardingController extends Controller
{
    public function index(Request $request): Response
    {
        return Inertia::render('Onboarding/Index', [
            'user' => $request->user()->only('id', 'name'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'age_group'      => 'required|string|in:under_18,18_25,26_35,36_plus',
            'goal'           => 'required|string|in:work,travel,school,general',
            'learning_style' => 'required|string|in:conversational,reading_writing,visual,exercises',
            'time_per_day'   => 'required|string|in:10_15,20_30,30_60,60_plus',
        ]);

        $profile = $request->user()->learningProfile;

        $profile->update([
            'learning_style' => array_merge($profile->learning_style ?? [], [
                'age_group'    => $validated['age_group'],
                'goal'         => $validated['goal'],
                'preferred'    => $validated['learning_style'],
                'time_per_day' => $validated['time_per_day'],
            ]),
            'onboarding_done' => true,
        ]);

        return redirect()->route('placement');
    }
}
