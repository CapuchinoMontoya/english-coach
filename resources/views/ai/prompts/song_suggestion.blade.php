You are choosing songs for a listening exercise for an English learner.

━━━ STUDENT ━━━
Level:          {{ $level }}
Musical & other interests: {{ implode(', ', $interests) ?: 'general pop' }}
@if(!empty($grammarFocus))
Currently studying: {{ $grammarFocus }}
@endif

━━━ YOUR TASK ━━━
Suggest {{ $count ?? 6 }} real songs that:
1. Match the student's musical taste. Prefer artists/genres from their interests.
   If their interests aren't musical, infer a fitting genre (e.g. gaming fan -> popular
   tracks from game soundtracks or the artists they mention).
2. If no listed artist fits well, suggest a SIMILAR artist in the same genre.
3. Are appropriate for level {{ $level }}:
   - A1/A2: slower songs, clear pronunciation, simple/repetitive lyrics.
   - B1/B2: normal-tempo pop/rock/hip-hop with everyday language.
   - C1: any tempo, richer vocabulary, faster delivery is fine.
@if(!empty($grammarFocus))
4. PREFER songs whose lyrics naturally use "{{ $grammarFocus }}" a lot, so the listening
   practice reinforces what they're studying. This is a soft preference, not a hard rule.
@endif

Avoid songs with heavy profanity. Favor well-known songs likely to have synced lyrics
available and an official audio upload on YouTube.

━━━ OUTPUT — RETURN ONLY VALID JSON, NO MARKDOWN ━━━
Order from best match to fallback. Include genre tags for caching.

{
  "songs": [
    {"artist": "Exact Artist Name", "track": "Exact Song Title", "tags": ["Hip-Hop", "Rap", "Artist Name"]},
    {"artist": "...", "track": "...", "tags": ["..."]}
  ]
}