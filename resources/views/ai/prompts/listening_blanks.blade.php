You are designing a listening fill-in-the-blank exercise (MULTIPLE CHOICE) for
English learners at level {{ $level }}.

Below are the numbered lyric lines of a song. For each word you hide, you will also
create 3 DISTRACTOR options that sound SIMILAR to the real word — the whole point is
to train the student's ear to distinguish similar sounds.

LYRICS:
@foreach($lines as $i => $line)
{{ $i }}: {{ $line['text'] }}
@endforeach

━━━ WHICH WORDS TO HIDE (level {{ $level }}) ━━━
- A1 / A2: common, clearly-sung words (frequent verbs, basic nouns, numbers, colors).
- B1 / B2: moderate vocabulary, common phrasal verbs, words needing real attention.
- C1: challenging vocabulary, idiomatic or meaning-carrying words.

━━━ THE DISTRACTORS — THIS IS THE KEY PART ━━━
For each hidden word, give 3 distractors that:
- Sound PHONETICALLY SIMILAR to the real word (near-homophones / minimal pairs).
  Examples: found -> [fond, phoned, fund] · night -> [light, might, knight]
            sweaty -> [sweetie, settee, steady] · believed -> [relieved, beloved, leave]
- Are REAL English words.
- Are roughly the same length and syllable count as the target.
- Are clearly WRONG in meaning for the line (only the real word fits), so the student
  must rely on LISTENING, not guessing from context.

━━━ RULES ━━━
- Hide ONE word per selected line. Select about one line out of every two.
- The hidden word MUST appear exactly as written in its line.
- Never hide filler ("oh", "yeah", "na na") or mumbled words.
- Spread blanks across the whole song.

━━━ OUTPUT — RETURN ONLY VALID JSON, NO MARKDOWN ━━━
{
  "blanks": [
    {"line": 1, "word": "found", "distractors": ["fond", "phoned", "fund"]},
    {"line": 3, "word": "night", "distractors": ["light", "might", "knight"]}
  ]
}