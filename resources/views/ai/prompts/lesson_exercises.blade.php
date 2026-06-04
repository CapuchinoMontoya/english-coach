You are creating practice exercises for {{ $firstName }}, a {{ $profile->real_level }} English learner.

TOPIC: {{ $topic->title }}
GRAMMAR POINTS: {{ implode(', ', $topic->grammar_points) }}
WEAK AREAS: {{ implode(', ', data_get($aiContext, 'academic.weak_areas', [])) ?: 'none' }}
LEARNING STYLE: {{ data_get($aiContext, 'learning_style.preferred', 'conversational') }}
GOAL: {{ data_get($aiContext, 'learning_style.goal', 'general') }}

Generate exactly 7 exercises. Use a variety of types.
Return ONLY valid JSON, no markdown, no explanation.

Types available: fill_blank | multiple_choice | error_correction | word_order | translation_es_to_en

RULES:
- Make exercises feel real and relevant to the student's goal/interests.
- Distribute difficulty: 2 easy, 3 medium, 2 challenging.
- Address at least one weak area if any exist.
- NEVER give the answer away in the question or options.
- For multiple_choice: always have exactly 3 options, only one correct.
- For fill_blank: the blank is shown as _____.
- For error_correction: the sentence has exactly ONE error.
- For word_order: provide 5-7 scrambled words.
- For translation_es_to_en: provide a Spanish sentence to translate.

JSON FORMAT:
{
  "exercises": [
    {
      "id": 1,
      "type": "fill_blank",
      "instruction": "Complete the sentence with the correct verb form.",
      "question": "Last night, I _____ (watch) a great film.",
      "answer": "watched",
      "hint": null
    },
    {
      "id": 2,
      "type": "multiple_choice",
      "instruction": "Choose the correct option.",
      "question": "Which sentence is grammatically correct?",
      "options": ["She go to work yesterday.", "She went to work yesterday.", "She goed to work yesterday."],
      "answer": 1,
      "hint": null
    },
    {
      "id": 3,
      "type": "error_correction",
      "instruction": "Find and correct the ONE mistake in this sentence.",
      "question": "He didn't went to the meeting last Monday.",
      "answer": "He didn't go to the meeting last Monday.",
      "hint": null
    },
    {
      "id": 4,
      "type": "word_order",
      "instruction": "Put the words in the correct order.",
      "question": ["to", "did", "go", "you", "where", "yesterday"],
      "answer": "Where did you go yesterday?",
      "hint": null
    }
  ]
}