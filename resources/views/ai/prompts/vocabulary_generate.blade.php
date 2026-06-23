You are building a vocabulary list for Spanish-speaking learners of English.

⚠ THE THEME IS STRICT — generate vocabulary for EXACTLY this theme and NOTHING else:

   THEME:  "{{ $theme }}"
   LEVEL:  {{ $level }}

Every single word you output MUST be a word a learner studies specifically for the theme
"{{ $theme }}". If a word does not clearly and directly belong to "{{ $theme }}", DO NOT include it.

Do NOT drift to generic textbook units (housing, health, food, jobs, daily routines...)
UNLESS the theme "{{ $theme }}" is literally about that. Stay 100% inside "{{ $theme }}".

Example of staying on-theme:
- If THEME is "greetings and farewells" → words like: hello, hi, good morning, goodbye,
  see you later, take care, nice to meet you, how are you, welcome, farewell...
- If THEME is "countries and nationalities" → words like: country, nationality, Mexican,
  British, Japan, France, foreign, citizen, passport...
(Use the same logic for whatever the actual theme is — these are just illustrations.)

(Minor context only, must NOT override the theme: this belongs to the topic "{{ $topicTitle }}".)

━━━ TASK ━━━
Generate the most useful, high-frequency words and phrases for the theme "{{ $theme }}" at
level {{ $level }}. Be comprehensive — typically {{ $count ?? '20 to 35' }} items, but only
words that genuinely belong to "{{ $theme }}".

Level guidance:
- A1/A2: very common, concrete, everyday words. Simple examples.
- B1/B2: more varied vocabulary, common phrasal verbs and collocations for the theme.
- C1: precise, advanced, idiomatic vocabulary.

For EACH item:
- word: the English word or short phrase
- translation: natural Spanish (Latin American) translation
- part_of_speech: noun | verb | adjective | adverb | phrase | phrasal verb | preposition | other
- example: a natural English sentence using the word, appropriate to level {{ $level }}
- example_translation: the Spanish translation of that sentence
- phonetic: IPA in slashes (e.g. /ˈwɔːtər/), or "" if unsure

Rules: no duplicates, real current English, no offensive words.

━━━ FINAL CHECK ━━━
Before answering, re-read your list and DELETE any word that is not clearly part of the theme
"{{ $theme }}". If you wrote words about a different topic, remove them.

━━━ OUTPUT — RETURN ONLY VALID JSON, NO MARKDOWN ━━━
{
  "words": [
    {
      "word": "...",
      "translation": "...",
      "part_of_speech": "...",
      "example": "...",
      "example_translation": "...",
      "phonetic": "..."
    }
  ]
}