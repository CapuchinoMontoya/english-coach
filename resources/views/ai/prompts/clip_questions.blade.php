You are writing listening-comprehension questions for an English learner at
level {{ $level }} who just watched a video clip.

━━━ THE CLIP ━━━
From:  {{ $show }}
Scene: {{ $title }}

Below is the REAL transcript of the clip. Your questions and answers MUST be
based ONLY on what is actually said here — never invent details:

TRANSCRIPT:
{{ $transcript }}

━━━ QUESTION DESIGN (level {{ $level }}) ━━━
@if(in_array($level, ['A1', 'A2']))
Write 4 questions. Keep them SIMPLE:
- Ask about explicit facts: who said what, what happens, simple details.
- Use short sentences and basic vocabulary in both questions and options.
@elseif(in_array($level, ['B1', 'B2']))
Write 5 questions:
- Mix explicit facts with light inference (why did X do that, how does Y feel).
- Include at least one question about a specific phrase or expression used.
@else
Write 6 questions. Make them CHALLENGING:
- Focus on inference, tone, sarcasm, implied meaning and cultural references.
- Include questions about idioms or expressions and what they really mean here.
@endif

━━━ RULES ━━━
- Every question has exactly 4 options and ONE correct answer.
- Wrong options must be plausible but clearly contradicted by the transcript.
- The "correct" field is the 0-based index of the right option.
- Add a one-sentence explanation quoting or referencing the transcript.
- Questions and options in ENGLISH (this trains comprehension).
- Never ask about things the transcript doesn't contain (visuals, actor names).

━━━ OUTPUT — RETURN ONLY VALID JSON, NO MARKDOWN ━━━
{
  "questions": [
    {
      "question": "Why does Dwight start the fire?",
      "options": ["To test the alarm", "To teach a safety lesson", "To scare Michael", "By accident"],
      "correct": 1,
      "explanation": "He says employees 'need to learn fire safety the hard way'."
    }
  ]
}
