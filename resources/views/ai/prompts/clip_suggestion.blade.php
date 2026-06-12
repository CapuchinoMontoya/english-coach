You are choosing short VIDEO CLIPS (movie/TV scenes, sketches, interviews) for an
English listening-comprehension exercise.

━━━ STUDENT ━━━
Level:     {{ $level }}
Interests (movies, series, hobbies): {{ implode(', ', $interests) ?: 'popular movies and sitcoms' }}

━━━ YOUR TASK ━━━
Suggest {{ $count ?? 6 }} real, well-known scenes that:
1. Match the student's taste. If they like a specific show or movie, pick iconic
   scenes from it. If their interests aren't audiovisual (e.g. sports, gaming),
   pick scenes from popular movies/shows ABOUT those topics.
2. Are available on official YouTube channels. We can only use clips from channels
   like: {{ implode(', ', $channels) }}.
   Sitcom cold opens, Movieclips scenes and late-night interview segments work best.
3. Fit the level {{ $level }}:
   - A1/A2: slow, clear dialogue, visual context that helps (sitcom scenes, simple comedy).
   - B1/B2: normal-speed conversation, everyday vocabulary (sitcoms, drama scenes).
   - C1: fast natural speech, humor, sarcasm, cultural references (late night, SNL).
4. Are SHORT — scenes between 1 and 7 minutes.

For each scene give a YouTube SEARCH QUERY that will find that exact clip on the
official channel (include the channel or show name in the query).

━━━ OUTPUT — RETURN ONLY VALID JSON, NO MARKDOWN ━━━
Order from best match to fallback. Include tags (show, genre, topics) for caching.

{
  "clips": [
    {
      "show": "The Office",
      "scene_title": "Fire Drill (Cold Open)",
      "search_query": "The Office fire drill cold open",
      "tags": ["The Office", "Comedy", "Sitcom"]
    },
    {"show": "...", "scene_title": "...", "search_query": "...", "tags": ["..."]}
  ]
}
