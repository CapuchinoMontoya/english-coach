<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class CurriculumTopicSeeder extends Seeder
{
    public function run(): void
    {
        Schema::disableForeignKeyConstraints();
        DB::table('curriculum_topics')->truncate();
        Schema::enableForeignKeyConstraints();
        $now    = now()->toDateTimeString();
        $topics = [];

        // ─────────────────────────────────────────────────────────────────────
        // A1 → A2  |  18 temas  |  8-10 semanas
        // Objetivo: gramática fundamental + comunicación básica cotidiana
        // ─────────────────────────────────────────────────────────────────────

        $a1a2 = [
            [
                'order' => 1,
                'title' => 'Personal Pronouns & Verb To Be',
                'description' => 'The absolute starting point. Students learn subject pronouns and the most important verb in English — to be — in all its forms. Contractions and short answers are introduced immediately so English sounds natural from day one.',
                'grammar_points' => ['subject pronouns: I, you, he, she, it, we, they', 'verb to be: am, is, are (positive, negative, question)', 'contractions and short forms: I\'m, he\'s, they aren\'t, is it?', 'yes/no short answers: Yes, I am. / No, she isn\'t.'],
                'vocabulary_themes' => ['greetings and farewells', 'countries and nationalities', 'personal information (name, age, city)'],
                'estimated_sessions' => 3,
            ],
            [
                'order' => 2,
                'title' => 'Articles: A, An & The',
                'description' => 'Articles are invisible to Spanish speakers but constant in English. Students learn the three article choices — a, an, the, and zero article — and the rules that govern them, including when NOT to use an article.',
                'grammar_points' => ['indefinite article a/an: introducing new nouns, jobs, singular countable nouns', 'definite article the: specific nouns, unique things, second mention', 'zero article (Ø): proper nouns, uncountable in general sense, plurals in general', 'a vs an: based on the sound of the following word'],
                'vocabulary_themes' => ['everyday objects', 'common places (a park, the cinema)', 'jobs and professions'],
                'estimated_sessions' => 2,
            ],
            [
                'order' => 3,
                'title' => 'Numbers, Dates & Time',
                'description' => 'Practical survival skills for any English speaker. Students learn to count, tell the time, and talk about dates — the building blocks of scheduling, shopping, and daily conversation.',
                'grammar_points' => ['cardinal numbers: 1–1,000,000 and beyond', 'ordinal numbers: 1st, 2nd, 3rd, 4th... for dates and sequences', 'telling the time: it\'s half past, quarter to, ten o\'clock', 'dates: month + ordinal (June 2nd / the 2nd of June)'],
                'vocabulary_themes' => ['numbers and quantities', 'days of the week and months', 'time expressions: morning, afternoon, evening, noon, midnight'],
                'estimated_sessions' => 2,
            ],
            [
                'order' => 4,
                'title' => 'Nouns: Types, Plurals & Proper Nouns',
                'description' => 'Nouns are the foundation of sentences. Students understand the difference between common and proper nouns, master regular and irregular plurals, and learn how English treats countable and uncountable nouns differently.',
                'grammar_points' => ['common nouns vs proper nouns (capitalisation rules)', 'regular plural -s and -es rules', 'irregular plurals: man/men, child/children, foot/feet, mouse/mice', 'basic introduction to countable vs uncountable distinction'],
                'vocabulary_themes' => ['classroom and school objects', 'animals and nature', 'everyday common nouns'],
                'estimated_sessions' => 2,
            ],
            [
                'order' => 5,
                'title' => 'Possessives',
                'description' => 'Expressing ownership and relationships in English. Students master possessive adjectives, possessive pronouns, and the Saxon genitive — a structure that differs significantly from Spanish.',
                'grammar_points' => ['possessive adjectives: my, your, his, her, its, our, their', 'possessive pronouns: mine, yours, his, hers, ours, theirs (no noun after)', 'possessive apostrophe: John\'s car, the children\'s room', 'whose? for asking about possession'],
                'vocabulary_themes' => ['family members and relationships', 'personal belongings', 'parts of the body (basic)'],
                'estimated_sessions' => 2,
            ],
            [
                'order' => 6,
                'title' => 'Have & Have Got',
                'description' => 'Two ways to express possession that confuse learners for years. Students learn both forms, understand when each is preferred (British vs American English), and avoid the most common errors.',
                'grammar_points' => ['have got: positive (I\'ve got), negative (I haven\'t got), question (Have you got?)', 'have: positive (I have), negative (I don\'t have), question (Do you have?)', 'have got vs have: interchangeable for possession, have only for actions', 'short answers with have got: Yes, I have. (not Yes, I have got.)'],
                'vocabulary_themes' => ['physical characteristics and descriptions', 'personal possessions', 'home and living spaces (basic)'],
                'estimated_sessions' => 2,
            ],
            [
                'order' => 7,
                'title' => 'Adjectives',
                'description' => 'Adjectives bring language to life. Students learn how English adjectives work — always before the noun, never agreeing in gender — and build a strong descriptive vocabulary for people, places, and things.',
                'grammar_points' => ['adjective placement: always before the noun (not after in most cases)', 'adjectives do not agree in number or gender (a tall man / tall women)', 'intensifiers: very, quite, really, extremely before adjectives', 'be + adjective: She is tired. / It\'s beautiful. (predicative position)'],
                'vocabulary_themes' => ['appearance adjectives (tall, short, curly, straight)', 'personality adjectives (friendly, shy, kind)', 'descriptive adjectives for objects and places'],
                'estimated_sessions' => 2,
            ],
            [
                'order' => 8,
                'title' => 'There Is / There Are & Demonstratives',
                'description' => 'Describing what exists and pointing to things. Students master there is/are for describing environments and learn demonstratives to reference nearby and distant objects in conversation.',
                'grammar_points' => ['there is (singular) / there are (plural): positive, negative, question', 'how many are there? / is there a...? / are there any...?', 'demonstrative pronouns and adjectives: this, that, these, those', 'this/these (near) vs that/those (far) in space and time'],
                'vocabulary_themes' => ['rooms and furniture', 'places in a town (basic)', 'classroom and everyday objects'],
                'estimated_sessions' => 2,
            ],
            [
                'order' => 9,
                'title' => 'Prepositions of Place',
                'description' => 'Spatial language is essential for describing where things are. Students master English prepositions of place through visual and situational practice, building the vocabulary to describe any environment.',
                'grammar_points' => ['in: inside an enclosed space (in the box, in the room)', 'on: surface contact (on the table, on the wall, on the left)', 'under, above, below, between, behind, in front of, next to, opposite', 'at for specific locations: at home, at school, at the bus stop'],
                'vocabulary_themes' => ['furniture and household objects', 'rooms in a house', 'town and city locations (basic)'],
                'estimated_sessions' => 2,
            ],
            [
                'order' => 10,
                'title' => 'Prepositions of Time',
                'description' => 'Time prepositions follow strict rules in English that differ from Spanish. Students learn the at/on/in system and extend it to cover more complex time expressions used in everyday scheduling.',
                'grammar_points' => ['at: specific times (at 3 o\'clock, at noon, at night, at the weekend)', 'on: days and dates (on Monday, on 5th June, on Christmas Day)', 'in: months, years, seasons, periods (in July, in 2025, in the morning)', 'before, after, during, by, until for sequence and duration'],
                'vocabulary_themes' => ['daily and weekly schedules', 'seasons and holidays', 'time expressions: ago, last, next, this'],
                'estimated_sessions' => 2,
            ],
            [
                'order' => 11,
                'title' => 'Prepositions of Movement & Direction',
                'description' => 'Movement prepositions give verbs their direction and complete their meaning. Students learn the most important movement prepositions and the phrasal verb structures they create.',
                'grammar_points' => ['to and from: destination and origin (go to the shops, come from Spain)', 'into and out of: entering and leaving enclosed spaces', 'along, through, across, past: movement relative to a path or obstacle', 'up, down, over, under, around: direction of movement'],
                'vocabulary_themes' => ['transport and travel verbs', 'city navigation vocabulary', 'directions and routes'],
                'estimated_sessions' => 2,
            ],
            [
                'order' => 12,
                'title' => 'Countable & Uncountable Nouns + Quantifiers',
                'description' => 'A fundamental concept that Spanish largely ignores. Students learn which nouns are countable and which are not, then master the quantifiers that go with each — one of the most common error areas for Spanish speakers.',
                'grammar_points' => ['countable nouns: have singular/plural, can use a/an, one, many, few', 'uncountable nouns: no plural form, no a/an, use much, little, some', 'some vs any: some in positives and offers, any in negatives and questions', 'much/many, a lot of, a few/a little, no, none — with correct noun type'],
                'vocabulary_themes' => ['food and drink (countable vs uncountable)', 'materials and substances', 'abstract concepts (time, money, information, advice)'],
                'estimated_sessions' => 3,
            ],
            [
                'order' => 13,
                'title' => 'Present Simple',
                'description' => 'The most used tense in English. Students master the present simple for habits, routines, general truths, and states — and learn the third-person rule that trips up learners at every level.',
                'grammar_points' => ['positive: I/you/we/they work — he/she/it works (third-person -s)', 'negative: do not/don\'t work — does not/doesn\'t work', 'question: Do you work? — Does she work?', 'adverbs of frequency: always, usually, often, sometimes, rarely, never (position)', 'time expressions: every day, on Mondays, in the morning, at weekends'],
                'vocabulary_themes' => ['daily routine verbs', 'work and study vocabulary', 'habits and hobbies vocabulary'],
                'estimated_sessions' => 3,
            ],
            [
                'order' => 14,
                'title' => 'Present Continuous',
                'description' => 'The present continuous shows actions happening right now or around now. Students learn when to use it instead of the present simple — and crucially, which verbs (stative verbs) cannot be continuous.',
                'grammar_points' => ['form: am/is/are + verb-ing (spelling rules: run→running, write→writing)', 'use 1: actions happening right now (I\'m reading)', 'use 2: temporary situations around now (She\'s staying with her parents)', 'stative verbs that don\'t use -ing: know, like, love, hate, want, need, believe, understand', 'present simple vs present continuous: habit vs current action'],
                'vocabulary_themes' => ['action verbs for current activities', 'temporary situation vocabulary', 'sport and activity verbs'],
                'estimated_sessions' => 3,
            ],
            [
                'order' => 15,
                'title' => 'Modal Verbs: Can, Must, Should',
                'description' => 'Modal verbs are the engine of polite, nuanced English. Students learn the three most important modals and the rule that makes modals unique: they are always followed by the base infinitive, never -s, -ing, or -ed.',
                'grammar_points' => ['can/can\'t: ability (I can swim), permission (Can I leave?), possibility (It can be cold)', 'must/mustn\'t: strong obligation (You must wear a seatbelt), strong prohibition', 'should/shouldn\'t: advice and recommendation (You should see a doctor)', 'modal structure: modal + base infinitive (never to, -s, -ing, -ed)', 'have to vs must: external vs internal obligation (basic distinction)'],
                'vocabulary_themes' => ['ability and skill vocabulary', 'rules and regulations', 'health and advice vocabulary'],
                'estimated_sessions' => 3,
            ],
            [
                'order' => 16,
                'title' => 'Sentence Structure & Imperatives',
                'description' => 'The architecture of English sentences. Students understand the fixed Subject-Verb-Object order that English requires, and learn imperative sentences for giving instructions, making requests, and offering suggestions.',
                'grammar_points' => ['English word order: Subject + Verb + Object (not flexible like Spanish)', 'affirmative, negative, and question sentence patterns', 'imperative: base verb (Come here! Sit down!), negative (Don\'t touch!)', 'let\'s + base verb for suggestions (Let\'s go! Let\'s not wait)', 'please for polite imperatives: Please be quiet / Open the door, please'],
                'vocabulary_themes' => ['classroom language and instructions', 'cooking and recipe instructions', 'signs and notices vocabulary'],
                'estimated_sessions' => 2,
            ],
            [
                'order' => 17,
                'title' => 'Reflexive Pronouns',
                'description' => 'Reflexive pronouns show that the subject and object are the same person. Students learn when English requires them (and when it doesn\'t — unlike Spanish where reflexive verbs are much more common).',
                'grammar_points' => ['forms: myself, yourself, himself, herself, itself, ourselves, yourselves, themselves', 'use 1: subject and object are the same (I hurt myself / She looked at herself)', 'use 2: emphasis (I did it myself / The president himself attended)', 'by + reflexive: alone, without help (She lives by herself / I cooked it by myself)', 'false reflexives from Spanish: feel, sit, get up, wake up do NOT use reflexive in English'],
                'vocabulary_themes' => ['self-care and daily actions', 'achievement and independence vocabulary', 'cooking and household tasks'],
                'estimated_sessions' => 2,
            ],
            [
                'order' => 18,
                'title' => 'A1→A2 Consolidation & Assessment',
                'description' => 'An integrated review of all A1 grammar structures and vocabulary through communicative tasks. Students demonstrate readiness to progress to A2→B1 through conversation, writing, and listening activities.',
                'grammar_points' => ['all A1 structures in integrated communicative contexts', 'self-correction strategies and error awareness', 'fluency practice with all studied tenses and structures'],
                'vocabulary_themes' => ['review of all A1 vocabulary themes', 'high-frequency everyday expressions', 'self-assessment and learning vocabulary'],
                'estimated_sessions' => 3,
            ],
        ];

        foreach ($a1a2 as $t) {
            $topics[] = array_merge($t, [
                'level_from' => 'A1', 'level_to' => 'A2',
                'grammar_points'    => json_encode($t['grammar_points']),
                'vocabulary_themes' => json_encode($t['vocabulary_themes']),
                'is_active' => true, 'created_at' => $now, 'updated_at' => $now,
            ]);
        }

        // ─────────────────────────────────────────────────────────────────────
        // A2 → B1  |  22 temas  |  10-12 semanas
        // Objetivo: comunicación independiente en situaciones cotidianas
        // ─────────────────────────────────────────────────────────────────────

        $a2b1 = [
            [
                'order' => 1,
                'title' => 'Conjunctions',
                'description' => 'The glue that holds sentences together. Students learn coordinating conjunctions that join equal elements and subordinating conjunctions that create complex sentences — moving from simple to connected discourse.',
                'grammar_points' => ['coordinating conjunctions: and, but, or, so, yet, for, nor (FANBOYS)', 'subordinating conjunctions: because, although, since, while, when, unless, until', 'position of subordinating conjunctions (can start a sentence with comma)', 'so vs because: result vs reason', 'although vs but: concession differences'],
                'vocabulary_themes' => ['cause and effect language', 'contrast vocabulary', 'everyday connecting expressions'],
                'estimated_sessions' => 2,
            ],
            [
                'order' => 2,
                'title' => 'Adverbs: Form, Function & Types',
                'description' => 'Adverbs modify verbs, adjectives, and other adverbs. Students learn how adverbs are formed, their different types, and crucially their position in sentences — which differs significantly from Spanish.',
                'grammar_points' => ['forming adverbs: adjective + -ly (quick→quickly, careful→carefully)', 'irregular adverbs: good→well, fast→fast, hard→hard, late→late', 'adverb types: manner (slowly), frequency (often), degree (very), time (now), place (here)', 'adverb position: manner/frequency mid-sentence, time/place at end or beginning', 'adverbs modifying adjectives and other adverbs (very quickly, quite well)'],
                'vocabulary_themes' => ['manner of doing things vocabulary', 'degree and intensity expressions', 'time and place adverbs'],
                'estimated_sessions' => 2,
            ],
            [
                'order' => 3,
                'title' => 'Past Simple',
                'description' => 'Unlocking the past. The past simple is the most important past tense for storytelling and recounting events. Students tackle regular verbs, the 150+ most common irregular verbs, and complete question and negative forms.',
                'grammar_points' => ['regular verbs: add -ed (work→worked, play→played), spelling rules (stop→stopped)', 'irregular verbs: go→went, see→saw, have→had, get→got, make→made (top 50)', 'negative: did not/didn\'t + base infinitive (She didn\'t go)', 'question: Did + subject + base infinitive? (Did you see her?)', 'time expressions: yesterday, last week/month/year, in 2020, ago, when I was...'],
                'vocabulary_themes' => ['narrative action verbs', 'past time expressions', 'weekend and holiday activities'],
                'estimated_sessions' => 4,
            ],
            [
                'order' => 4,
                'title' => 'Past Continuous',
                'description' => 'The past continuous creates background and interrupted actions in narratives. Students learn to combine it with past simple to tell richer, more natural stories — a key step toward fluent storytelling.',
                'grammar_points' => ['form: was/were + verb-ing (I was sleeping, they were talking)', 'use 1: action in progress at a specific past time (At 8pm I was cooking)', 'use 2: interrupted action (I was reading when he called)', 'use 3: setting the scene in narratives (It was raining and people were rushing)', 'when vs while: when + past simple, while + past continuous'],
                'vocabulary_themes' => ['storytelling and narrative verbs', 'scene-setting vocabulary', 'interruption and continuation language'],
                'estimated_sessions' => 3,
            ],
            [
                'order' => 5,
                'title' => 'Used To',
                'description' => 'Used to expresses habits and states that no longer exist — a concept Spanish handles with the imperfect that English handles very differently. Students learn to contrast the past with the present naturally.',
                'grammar_points' => ['used to + infinitive: I used to play football (but I don\'t now)', 'negative: didn\'t use to (I didn\'t use to like coffee)', 'question: Did you use to...? (Did you use to have long hair?)', 'would for past habits only (not states): We would visit them every summer', 'used to vs past simple: habit/state (used to) vs specific event (past simple)'],
                'vocabulary_themes' => ['childhood and past life vocabulary', 'habit and routine language', 'change and contrast expressions'],
                'estimated_sessions' => 2,
            ],
            [
                'order' => 6,
                'title' => 'Future: Will, Going To & Present Continuous',
                'description' => 'English has three main ways to talk about the future and each has a different meaning. Students master the distinctions between spontaneous decisions, plans, and fixed arrangements — a major source of errors.',
                'grammar_points' => ['will + infinitive: predictions, spontaneous decisions, offers, promises', 'going to + infinitive: plans and intentions, predictions with evidence', 'present continuous for future: fixed future arrangements with time/place', 'key differences: I\'ll call you (spontaneous) vs I\'m going to call you (planned)', 'future time expressions: tomorrow, next week, in two days, soon, this weekend'],
                'vocabulary_themes' => ['plans and intentions vocabulary', 'prediction and expectation language', 'future arrangements and schedules'],
                'estimated_sessions' => 3,
            ],
            [
                'order' => 7,
                'title' => 'Future Continuous',
                'description' => 'The future continuous describes ongoing actions at a future point in time. Students also learn its special use for polite questions about plans — a natural, non-intrusive way to ask what someone intends.',
                'grammar_points' => ['form: will be + verb-ing (I will be working tomorrow morning)', 'use 1: action in progress at a future time (At noon I\'ll be having lunch)', 'use 2: planned or expected future events (We\'ll be arriving on Friday)', 'use 3: polite questions about plans (Will you be using the car tonight?)', 'contrast with will + infinitive: I\'ll study vs I\'ll be studying'],
                'vocabulary_themes' => ['future plans and projections vocabulary', 'work and schedule language', 'polite inquiry expressions'],
                'estimated_sessions' => 2,
            ],
            [
                'order' => 8,
                'title' => 'Questions: Construction, Types & Tags',
                'description' => 'Correct question formation is one of the biggest challenges for Spanish speakers. This unit systematically covers all question types, with special attention to indirect questions and question tags — two areas rarely covered at A2.',
                'grammar_points' => ['yes/no questions: auxiliary + subject + verb (Does she work? Is he coming?)', 'wh-questions: wh-word + auxiliary + subject + verb (What do you do?)', 'indirect questions: Could you tell me where the station is? (no inversion)', 'question tags: You\'re Spanish, aren\'t you? / She didn\'t come, did she?', 'what vs which: open choice vs limited choice questions'],
                'vocabulary_themes' => ['question words and expressions', 'polite question language', 'information gathering vocabulary'],
                'estimated_sessions' => 3,
            ],
            [
                'order' => 9,
                'title' => 'Indefinite Pronouns',
                'description' => 'Indefinite pronouns refer to unspecified people, things, and places. Students learn the complete system (some-, any-, no-, every-) and the important grammar rules about using them with singular verbs.',
                'grammar_points' => ['somebody/someone, anybody/anyone, nobody/no one, everybody/everyone', 'something, anything, nothing, everything', 'somewhere, anywhere, nowhere, everywhere', 'grammar rules: indefinite pronouns take singular verbs (Everyone is here)', 'some- vs any- in positives vs negatives and questions'],
                'vocabulary_themes' => ['everyday conversational language', 'describing people and things in general', 'expressing uncertainty and possibility'],
                'estimated_sessions' => 2,
            ],
            [
                'order' => 10,
                'title' => 'Relative Pronouns & Defining Clauses',
                'description' => 'Relative clauses allow students to add information within a sentence, making their English much richer and more precise. This unit covers defining relative clauses that identify which person or thing is meant.',
                'grammar_points' => ['who: for people (The woman who called is my boss)', 'which: for things and animals (The book which I read was great)', 'that: for both people and things in defining clauses', 'whose: for possession (The student whose essay was best)', 'where: for places (The restaurant where we met is closed)', 'omitting the pronoun when it is the object: The book (that) I read'],
                'vocabulary_themes' => ['descriptive and identifying language', 'people and place descriptions', 'defining and specifying vocabulary'],
                'estimated_sessions' => 3,
            ],
            [
                'order' => 11,
                'title' => 'Comparative & Superlative Adjectives',
                'description' => 'Comparing people, places, and things is fundamental to everyday conversation. Students master the full comparative and superlative system including irregular forms and the as...as structure.',
                'grammar_points' => ['short adjectives: -er/-est (tall→taller→tallest, big→bigger→biggest)', 'long adjectives: more/most + adjective (more interesting, most beautiful)', 'irregular forms: good→better→best, bad→worse→worst, far→farther→farthest', 'as...as (equality): She\'s as tall as her brother', 'not as...as (inequality): This film isn\'t as good as the first one'],
                'vocabulary_themes' => ['comparison vocabulary', 'qualities and characteristics of people and things', 'preference and evaluation language'],
                'estimated_sessions' => 3,
            ],
            [
                'order' => 12,
                'title' => 'Adjectives Ending in -ed & -ing',
                'description' => 'One of the most common error areas for all learners. The -ed/-ing distinction is systematic and logical once students understand the rule: -ed describes how someone feels, -ing describes what causes that feeling.',
                'grammar_points' => ['-ed adjectives: how someone feels (I\'m bored, she\'s confused, we\'re excited)', '-ing adjectives: what causes the feeling (The film is boring, the lesson is confusing)', 'common pairs: bored/boring, tired/tiring, interested/interesting, frightened/frightening', 'confused/confusing, disappointed/disappointing, surprised/surprising, amazed/amazing', 'using both in a sentence: She was bored because the lecture was boring'],
                'vocabulary_themes' => ['emotions and feelings vocabulary', 'reactions and responses', 'entertainment and experience vocabulary'],
                'estimated_sessions' => 2,
            ],
            [
                'order' => 13,
                'title' => 'Intensifiers, Mitigators, Comparative Adverbs & Like vs As',
                'description' => 'Fine-tuning adjectives and adverbs to express degree precisely. Students learn to amplify and soften meaning, compare actions using adverbs, and master the like vs as distinction that confuses many Spanish speakers.',
                'grammar_points' => ['intensifiers: very, really, extremely, incredibly, absolutely (with strong adjectives)', 'mitigators: quite, rather, pretty, fairly, a bit, slightly (softening)', 'comparative adverbs: faster, more slowly, better, worse, harder', 'too + adjective/adverb: It\'s too hot (negative, problematic)', 'like vs as: like + noun (She sings like a professional) vs as + clause (Do as I say)'],
                'vocabulary_themes' => ['degree and intensity vocabulary', 'comparison and contrast language', 'opinion and evaluation expressions'],
                'estimated_sessions' => 2,
            ],
            [
                'order' => 14,
                'title' => 'The Gerund & Infinitive',
                'description' => 'Gerunds and infinitives follow specific verbs and prepositions. Students learn which verbs take which form — and why — reducing one of the most persistent error types in English grammar.',
                'grammar_points' => ['gerund (-ing) as a noun: Swimming is good for you / I enjoy reading', 'verbs followed by gerund: enjoy, avoid, finish, suggest, mind, consider, keep', 'verbs followed by to + infinitive: want, decide, hope, plan, promise, manage, fail, agree', 'prepositions always followed by gerund: interested in, good at, tired of, before/after + -ing', 'to + infinitive for purpose: I went to the shop to buy bread'],
                'vocabulary_themes' => ['hobbies and activities vocabulary', 'intention and decision language', 'everyday action verbs'],
                'estimated_sessions' => 3,
            ],
            [
                'order' => 15,
                'title' => 'Modal Verbs: Extended Use',
                'description' => 'Expanding modal vocabulary beyond can/must/should. Students learn to express possibility, deduction, and nuanced obligation — giving their English the sophistication needed for B1 level conversations.',
                'grammar_points' => ['could/might/may for present or future possibility (It might rain)', 'could for past ability (I could swim when I was six)', 'ought to for advice (similar to should, slightly more formal)', 'have to: external obligation (I have to wear a uniform at work)', 'must vs have to: internal obligation vs external rule', 'needn\'t / don\'t need to: absence of obligation'],
                'vocabulary_themes' => ['possibility and probability vocabulary', 'rules and obligations in different contexts', 'advice and recommendation language'],
                'estimated_sessions' => 3,
            ],
            [
                'order' => 16,
                'title' => 'First Conditional & Time Clauses',
                'description' => 'Talking about real future possibilities. Students learn the first conditional for realistic scenarios and time clauses — both require present tense for future meaning, which surprises Spanish speakers.',
                'grammar_points' => ['first conditional: if + present simple + will/can/might (If it rains, I\'ll stay home)', 'unless = if not: Unless you study, you won\'t pass', 'time clauses for future: when, as soon as, before, after, until + present simple (future meaning)', 'word order: time clause can come first or second (comma if first)', 'first conditional for warnings, promises, and real predictions'],
                'vocabulary_themes' => ['future possibility and consequence language', 'planning and contingency vocabulary', 'warning and advice expressions'],
                'estimated_sessions' => 3,
            ],
            [
                'order' => 17,
                'title' => 'Prepositions with Verbs & Adjectives',
                'description' => 'English verbs and adjectives have fixed preposition partners that cannot be translated from Spanish. Students learn the most frequent verb + preposition and adjective + preposition collocations through contextual practice.',
                'grammar_points' => ['verb + preposition: depend on, listen to, look at, wait for, apologise for, agree with', 'adjective + preposition: good at, interested in, afraid of, tired of, different from, similar to', 'verb + preposition + gerund: think about doing, look forward to doing, insist on doing', 'common errors from Spanish: marry (not marry with), enter (not enter into a room)', 'prepositional phrases: in the end, at last, by the way, on time, in time'],
                'vocabulary_themes' => ['collocational language', 'everyday communication expressions', 'emotional state vocabulary with prepositions'],
                'estimated_sessions' => 2,
            ],
            [
                'order' => 18,
                'title' => 'Linking Words for Discourse',
                'description' => 'Linking words transform a list of simple sentences into connected, flowing discourse. Students learn the most useful linkers for each discourse function — making their writing and speech dramatically more coherent.',
                'grammar_points' => ['addition: also, as well, too (end), in addition, furthermore', 'contrast: but, however, although, even though, on the other hand', 'reason: because, since, as, due to, because of + noun phrase', 'result: so, therefore, as a result, consequently', 'sequence: first, then, next, after that, finally, in the end'],
                'vocabulary_themes' => ['discourse and essay language', 'spoken linking expressions', 'writing and argument vocabulary'],
                'estimated_sessions' => 2,
            ],
            [
                'order' => 19,
                'title' => 'Expressing Opinions & Preferences',
                'description' => 'Moving from facts to perspectives. Students learn to express, justify, and respond to opinions in English — an essential conversational skill that defines the step from A2 to B1.',
                'grammar_points' => ['I think/believe/feel/reckon that + clause (most to least formal)', 'in my opinion, personally, to my mind, as far as I\'m concerned', 'prefer + noun/gerund: I prefer tea. / I prefer swimming to running.', 'would rather + base infinitive: I\'d rather stay home than go out', 'agreeing: Exactly, That\'s true, I agree / Disagreeing: I\'m not sure, Actually...'],
                'vocabulary_themes' => ['opinion and perspective vocabulary', 'agreement and disagreement expressions', 'preference and choice language'],
                'estimated_sessions' => 2,
            ],
            [
                'order' => 20,
                'title' => 'Comparing & Contrasting in Context',
                'description' => 'Extended practice with comparison in real communicative contexts. Students use comparatives, superlatives, and similarity/difference language to discuss choices, make recommendations, and express preferences.',
                'grammar_points' => ['both...and (similarity): Both Paris and London are expensive', 'neither...nor: Neither option is perfect', 'either...or: You can choose either red or blue', 'whereas and while for contrast: I like coffee whereas she prefers tea', 'the + comparative + the + comparative: The more you practice, the better you get'],
                'vocabulary_themes' => ['preference and recommendation language', 'similarity and difference vocabulary', 'evaluation and judgement expressions'],
                'estimated_sessions' => 2,
            ],
            [
                'order' => 21,
                'title' => 'Present Perfect for Experience (Introduction)',
                'description' => 'The present perfect connects past events to the present — a concept that doesn\'t exist in Spanish. Students focus on the experiential use (Have you ever...?) and learn the key contrast with the past simple.',
                'grammar_points' => ['form: have/has + past participle (I have seen, she has been)', 'use: experience in your life up to now (Have you ever tried sushi?)', 'ever and never with present perfect (Have you ever been to London? / I\'ve never tried it)', 'already, yet, just as adverbials with present perfect', 'present perfect vs past simple: I\'ve been to Paris (experience) vs I went last year (specific)'],
                'vocabulary_themes' => ['travel and experience vocabulary', 'life events and achievements', 'adventure and exploration language'],
                'estimated_sessions' => 3,
            ],
            [
                'order' => 22,
                'title' => 'A2→B1 Consolidation & Assessment',
                'description' => 'Comprehensive review of all intermediate structures through integrated tasks: extended conversations, written paragraphs, and listening activities. Confirms readiness to progress to B1→B2.',
                'grammar_points' => ['all A2-B1 structures in natural communicative contexts', 'error identification and self-correction strategies', 'fluency and accuracy practice across all studied tenses'],
                'vocabulary_themes' => ['review of all A2-B1 vocabulary', 'B1 level conversational topics', 'self-assessment and reflection language'],
                'estimated_sessions' => 3,
            ],
        ];

        foreach ($a2b1 as $t) {
            $topics[] = array_merge($t, [
                'level_from' => 'A2', 'level_to' => 'B1',
                'grammar_points'    => json_encode($t['grammar_points']),
                'vocabulary_themes' => json_encode($t['vocabulary_themes']),
                'is_active' => true, 'created_at' => $now, 'updated_at' => $now,
            ]);
        }

        // ─────────────────────────────────────────────────────────────────────
        // B1 → B2  |  22 temas  |  14-18 semanas
        // Objetivo: comunicación fluida e independiente en la mayoría de contextos
        // ─────────────────────────────────────────────────────────────────────

        $b1b2 = [
            [
                'order' => 1,
                'title' => 'Present Perfect Simple',
                'description' => 'The present perfect is the most misunderstood tense in English for Spanish speakers. Students master its core uses — recent events, life experiences, and current relevance — and the key adverbials that signal it.',
                'grammar_points' => ['form: have/has + past participle, irregular past participles', 'use 1: recent events with present relevance (I\'ve lost my keys)', 'use 2: experiences in life (She\'s been to Japan three times)', 'use 3: achievements and firsts (Scientists have discovered a new planet)', 'adverbials: already, just, yet, still, ever, never, recently, lately, so far'],
                'vocabulary_themes' => ['news and current events language', 'achievement and milestone vocabulary', 'recent activity expressions'],
                'estimated_sessions' => 3,
            ],
            [
                'order' => 2,
                'title' => 'Present Perfect Continuous',
                'description' => 'The present perfect continuous emphasises duration and ongoing activity. Students learn to contrast it with the present perfect simple and understand the subtle but important differences in meaning.',
                'grammar_points' => ['form: have/has been + verb-ing', 'use 1: activities that started in the past and are still continuing (I\'ve been learning Spanish for two years)', 'use 2: recent activities that explain a current result (She looks tired — she\'s been working all night)', 'for vs since: for + duration (for three hours), since + starting point (since Monday)', 'PP simple vs PP continuous: completed vs ongoing, result vs activity'],
                'vocabulary_themes' => ['ongoing project vocabulary', 'cause and visible result language', 'duration and continuation expressions'],
                'estimated_sessions' => 3,
            ],
            [
                'order' => 3,
                'title' => 'Present Perfect vs Past Simple',
                'description' => 'The most important tense distinction for Spanish speakers. Students learn to choose correctly between these two tenses — which depends on time reference, not just meaning — with systematic practice until the choice becomes automatic.',
                'grammar_points' => ['present perfect: no specific time, connection to now, still relevant', 'past simple: specific finished time, no connection to now (yesterday, last year, in 1990, when I was...)', 'signal words for past simple: yesterday, last, ago, when, in + year', 'signal words for present perfect: just, already, yet, ever, never, recently, so far', 'Have you ever...? vs Did you...? (when): the question pattern distinction'],
                'vocabulary_themes' => ['time reference vocabulary', 'news and personal narrative', 'experience and history language'],
                'estimated_sessions' => 3,
            ],
            [
                'order' => 4,
                'title' => 'For, Since, Ago & Already / Just / Still / Yet',
                'description' => 'These time adverbials are essential companions to the perfect tenses. Students master each one precisely — including the common confusions between for/since and still/yet that persist even at advanced levels.',
                'grammar_points' => ['for + duration: for three days, for a long time, for ages (how long?)', 'since + starting point: since Monday, since 2020, since I was a child (when did it start?)', 'ago + past simple: I arrived two hours ago (completed, looking back from now)', 'already: sooner than expected (I\'ve already finished), in questions (Have you already eaten?)', 'just: very recently (She\'s just left), still: continuation (Are you still waiting?), yet: expected but not done (Have you finished yet? / I haven\'t done it yet)'],
                'vocabulary_themes' => ['time reference and duration language', 'completion and expectation vocabulary', 'progression and process expressions'],
                'estimated_sessions' => 3,
            ],
            [
                'order' => 5,
                'title' => 'Modal Perfects',
                'description' => 'Modal perfects allow speakers to speculate about the past, express regret, and criticise past actions. Students master these structures that are entirely absent in Spanish and are a key B2 marker.',
                'grammar_points' => ['must have + pp: logical deduction about the past (She must have missed the train)', "can't/couldn't have + pp: impossible past deduction (He can't have done it — he was with me)", 'might/could have + pp: past possibility (They might have got lost)', 'should have + pp: criticism or regret about the past (You should have told me)', 'would have + pp: hypothetical past (I would have helped if I\'d known)'],
                'vocabulary_themes' => ['deduction and reasoning vocabulary', 'regret and reflection language', 'speculation and possibility expressions'],
                'estimated_sessions' => 3,
            ],
            [
                'order' => 6,
                'title' => 'Past Perfect Simple',
                'description' => 'The past perfect goes back before the past simple — the "past of the past." Students learn to use it for sequencing past events and providing background context, essential for natural narrative.',
                'grammar_points' => ['form: had + past participle (for all persons)', 'use 1: action completed before another past action (When I arrived, she had already left)', 'use 2: background information in a story (He was exhausted. He hadn\'t slept for two days)', 'time expressions: already, just, never, by the time, after, before, when, as soon as', 'past simple vs past perfect: which event happened first?'],
                'vocabulary_themes' => ['narrative and storytelling vocabulary', 'sequence and background language', 'cause and effect in the past'],
                'estimated_sessions' => 3,
            ],
            [
                'order' => 7,
                'title' => 'Past Perfect Continuous',
                'description' => 'The past perfect continuous shows how long an activity had been going on before something happened in the past. Students learn to use it for cause-and-effect narratives and explaining past situations.',
                'grammar_points' => ['form: had been + verb-ing', 'use: activity in progress before a past moment (She was exhausted because she had been running)', 'duration with for/since in past perfect continuous', 'past perfect continuous vs past perfect simple: duration vs completion emphasis', 'common use in third conditional context: If I had been paying attention...'],
                'vocabulary_themes' => ['cause and effect narrative vocabulary', 'background action language', 'past situation explanation expressions'],
                'estimated_sessions' => 2,
            ],
            [
                'order' => 8,
                'title' => 'Future Perfect & Future Perfect Continuous',
                'description' => 'Future perfect structures project completion and duration into the future. Students learn these forms for making predictions about future completion — important for professional and academic English.',
                'grammar_points' => ['future perfect: will have + past participle (By June, I will have finished the course)', 'use: completion before a future time/event (By the time you arrive, we will have eaten)', 'future perfect continuous: will have been + -ing (I will have been working here for ten years next July)', 'by, by the time, by then as key markers for future perfect', 'contrast with future simple: I will finish vs I will have finished'],
                'vocabulary_themes' => ['planning and projection vocabulary', 'milestone and deadline language', 'professional and academic future expressions'],
                'estimated_sessions' => 2,
            ],
            [
                'order' => 9,
                'title' => 'Passive Voice',
                'description' => 'The passive voice is essential for academic, professional, and news language. Students learn to form it in all tenses and understand the pragmatic reasons for choosing passive over active — including when the agent is unknown, unimportant, or obvious.',
                'grammar_points' => ['form: be + past participle in any tense (is made, was built, has been launched, will be released)', 'by + agent: The letter was written by the president (agent important)', 'omitting the agent: My car has been stolen (agent unknown/unimportant)', 'passive with modal verbs: This should be done / It must be completed', 'get passive for informal contexts: I got fired / She got promoted'],
                'vocabulary_themes' => ['news and media vocabulary', 'process and procedure language', 'academic and formal register vocabulary'],
                'estimated_sessions' => 3,
            ],
            [
                'order' => 10,
                'title' => 'Direct & Reported Speech',
                'description' => 'Reported speech is essential for telling others what was said. Students master tense backshift and the wide range of reporting verbs that go beyond say and tell — including structures for requests, suggestions, and warnings.',
                'grammar_points' => ['tense backshift: present→past, past simple→past perfect, will→would, can→could', 'say vs tell: say (no person after) vs tell (person must follow: She told me that...)', 'reporting verbs with structure: agree/refuse/offer + to infinitive; warn/remind + object + to infinitive', 'suggest + gerund or that clause: She suggested going / She suggested that we go', 'changes in pronouns, time expressions, and place references in reported speech'],
                'vocabulary_themes' => ['reporting and communication vocabulary', 'news and information language', 'conversational reporting expressions'],
                'estimated_sessions' => 3,
            ],
            [
                'order' => 11,
                'title' => 'Conditional Sentences & Wishes',
                'description' => 'The complete conditional system plus wish and if only — the language of imagination, regret, and possibility. Mastering all conditionals and their wish counterparts is one of the most important grammar milestones in English.',
                'grammar_points' => ['zero conditional: if + present + present (general truths and facts)', 'first conditional (review): if + present + will (real future possibility)', 'second conditional: if + past simple + would + infinitive (unreal present situation)', 'third conditional: if + past perfect + would have + past participle (unreal past situation)', 'wish / if only + past simple: wish for a different present (I wish I had more time)', 'wish / if only + past perfect: regret about the past (I wish I hadn\'t said that)'],
                'vocabulary_themes' => ['hypothetical language', 'regret and reflection vocabulary', 'possibility and consequence expressions', 'desire and aspiration language'],
                'estimated_sessions' => 4,
            ],
            [
                'order' => 12,
                'title' => 'Relative Clauses: Defining & Non-Defining',
                'description' => 'The distinction between defining (identifying) and non-defining (adding extra information) relative clauses is a key B2 competency. Students learn how punctuation, pronoun choice, and reducibility differ between the two types.',
                'grammar_points' => ['defining relative clauses: no commas, can use that, pronoun omissible if object', 'non-defining relative clauses: commas required, cannot use that, pronoun cannot be omitted', 'whose, where, when, why in both types of relative clause', 'reduced relative clauses: the woman sitting (= who is sitting) / the letter written (= that was written)', 'sentential relative clauses: He was late, which was unusual (which refers to the whole clause)'],
                'vocabulary_themes' => ['descriptive and identifying language', 'academic and formal prose vocabulary', 'information-adding expressions'],
                'estimated_sessions' => 3,
            ],
            [
                'order' => 13,
                'title' => 'Gerunds & Infinitives: Advanced Patterns',
                'description' => 'The advanced level of gerund vs infinitive — including the verbs where the choice changes the meaning. Students eliminate a persistent error class by mastering the complete system with all meaning distinctions.',
                'grammar_points' => ['meaning change verbs: remember to do (before action) vs remember doing (after action)', 'stop to do (pause in order to) vs stop doing (cease the activity)', 'try to do (attempt) vs try doing (experiment)', 'forget to do (failure before) vs forget doing (memory of completed action)', 'verb + object + infinitive: She expected me to come / I want you to understand', 'prefer + gerund or infinitive (both possible, gerund more common)'],
                'vocabulary_themes' => ['activity and intention vocabulary', 'memory and experience language', 'decision and attempt expressions'],
                'estimated_sessions' => 3,
            ],
            [
                'order' => 14,
                'title' => 'Phrasal & Prepositional Verbs',
                'description' => 'Phrasal verbs are the most distinctively English of all grammar structures — and one of the hardest for learners. Students learn the most common ones in thematic groups, and give special attention to get — the most versatile verb in English.',
                'grammar_points' => ['separable phrasal verbs: turn it off / turn off the light (pronoun must go in the middle)', 'inseparable phrasal verbs: look after the children (cannot separate)', 'intransitive phrasal verbs: break down, take off, set off (no object)', 'three-word phrasal verbs: look forward to, put up with, run out of', 'get: get up, get on, get off, get through, get over, get away with, get rid of'],
                'vocabulary_themes' => ['common phrasal verbs by theme (work, relationships, travel)', 'everyday informal English expressions', 'multi-meaning phrasal verb vocabulary'],
                'estimated_sessions' => 4,
            ],
            [
                'order' => 15,
                'title' => 'Adjectives & Adverbs: Advanced',
                'description' => 'Advanced adjective and adverb patterns that sharpen expression and reduce common errors. Students master so vs such, enough and too, even, else, and the -ever compounds that English uses so naturally.',
                'grammar_points' => ['so + adjective/adverb (so tired, so quickly) vs such + (adjective +) noun (such a long day)', 'enough: adjective/adverb + enough (good enough, fast enough), enough + noun (enough time)', 'too + adjective/adverb (too hot, too quickly) — negative, problematic meaning', 'even: emphasising unexpected information (Even my brother enjoyed it / She didn\'t even try)', 'else: something else, nowhere else, everyone else, what else, who else', 'whatever, wherever, whenever, whoever, however, whichever — concession and generalisation'],
                'vocabulary_themes' => ['degree and modification vocabulary', 'emphasis and concession language', 'generalisation expressions'],
                'estimated_sessions' => 3,
            ],
            [
                'order' => 16,
                'title' => 'Word Formation: Prefixes & Suffixes',
                'description' => 'Understanding how English words are built allows students to expand their vocabulary exponentially. Students learn the most common prefixes and suffixes and how they systematically change the meaning and class of words.',
                'grammar_points' => ['negative prefixes: un- (unhappy), dis- (disagree), in-/im-/ir-/il- (incorrect, impossible)', 'other prefixes: re- (redo), over- (overwork), mis- (misunderstand), pre- (preview), under- (underestimate)', 'noun suffixes: -tion/-sion (explanation), -ness (happiness), -ment (development), -er/-or (teacher, actor)', 'adjective suffixes: -ful (useful), -less (careless), -ive (creative), -al (musical)', 'verb suffixes: -ise/-ize (organise), -ify (simplify), -en (widen, strengthen)'],
                'vocabulary_themes' => ['word family vocabulary', 'academic and professional word building', 'vocabulary expansion strategies'],
                'estimated_sessions' => 3,
            ],
            [
                'order' => 17,
                'title' => 'Collocations & Delexical Verbs',
                'description' => 'Natural English is built on collocations — words that go together. Students learn the do/make distinction, the behaviour of delexical verbs (light verbs), and the most important verb-noun collocations for natural-sounding English.',
                'grammar_points' => ['do vs make: do homework/sport/business vs make a decision/mistake/effort (learn key examples)', 'delexical verbs: have (a meal, a bath, a look, a rest, a chat, a dream)', 'delexical verbs: take (a photo, a break, a risk, a taxi, an exam, a seat)', 'delexical verbs: give (a talk, a hand, advice, a call, a try)', 'strong collocations: heavy rain (not strong rain), make progress (not do progress)'],
                'vocabulary_themes' => ['high-frequency verb-noun collocations', 'professional and everyday language chunks', 'natural expression vocabulary'],
                'estimated_sessions' => 3,
            ],
            [
                'order' => 18,
                'title' => 'Pronouns & Determiners: Either, Neither, Each, Every',
                'description' => 'Fine-grained determiner distinctions that affect meaning significantly. Students learn the full either/neither/both and each/every system — including the grammatical rules about singular verbs that consistently cause errors.',
                'grammar_points' => ['either: one or the other (You can have either tea or coffee) — singular verb', 'neither: not one and not the other (Neither answer is correct) — singular verb', 'both: the two together (Both students passed) — plural verb', 'each: individually, one by one (Each student has a textbook) — singular verb', 'every: all as a group (Every student must attend) — singular verb', 'none vs no one vs nobody: none refers to things/people, no one/nobody refer to people only'],
                'vocabulary_themes' => ['distribution and choice vocabulary', 'inclusive and exclusive language', 'quantity and selection expressions'],
                'estimated_sessions' => 2,
            ],
            [
                'order' => 19,
                'title' => 'Linking Words: Advanced Discourse',
                'description' => 'The difference between B1 and B2 written and spoken English is largely the use of sophisticated linkers. Students learn the full range of discourse connectors for all functions — making their arguments clear, coherent, and persuasive.',
                'grammar_points' => ['addition: furthermore, moreover, in addition, what is more, not only... but also', 'contrast: however, nevertheless, on the other hand, despite + noun, in spite of + noun', 'concession: although + clause, even though, while, whereas (unexpected contrast)', 'result: therefore, consequently, as a result, hence, thus (formal)', 'summary and reformulation: in other words, that is to say, to sum up, in conclusion'],
                'vocabulary_themes' => ['academic discourse markers', 'formal writing connectors', 'spoken transition expressions'],
                'estimated_sessions' => 3,
            ],
            [
                'order' => 20,
                'title' => 'Pronunciation: Sounds, Stress & Rhythm',
                'description' => 'Systematic phonology work to improve both production and comprehension. Students study the English sound system, learn stress patterns that change word meaning, and develop awareness of the rhythm that makes natural English intelligible.',
                'grammar_points' => ['English vowel sounds: pure vowels and diphthongs, common spelling patterns', 'English consonant sounds: sounds absent in Spanish (/θ/, /ð/, /v/, /w/)', 'silent letters: know, write, could, half, island, debt, castle', 'syllable stress and stress shifts: PHOtograph, phoTOgrapher, photoGRAPHic', 'word stress in compounds: BLACKbird vs black BIRD', 'sentence stress: content words stressed, function words reduced (connected speech)'],
                'vocabulary_themes' => ['phonology metalanguage', 'minimal pair vocabulary', 'pronunciation-focused everyday vocabulary'],
                'estimated_sessions' => 4,
            ],
            [
                'order' => 21,
                'title' => 'Commonly Confused Words & Common Mistakes',
                'description' => 'A targeted unit addressing the most persistent errors made by Spanish speakers. Students identify, understand the logic of, and practise avoiding the most common mistakes that characterise non-native English at B1-B2.',
                'grammar_points' => ['say/tell/speak/talk: say something, tell someone something, speak a language, talk to someone', 'lend vs borrow: lend (give temporarily) vs borrow (take temporarily)', 'bring vs take: bring (towards speaker) vs take (away from speaker)', 'make vs do (extended): make a noise, do damage, make sense, do well', 'arrive at/in vs get to vs reach: arrive in a city, arrive at a station, get to the station, reach the top'],
                'vocabulary_themes' => ['commonly confused English words', 'false friends for Spanish speakers', 'precision vocabulary for clear communication'],
                'estimated_sessions' => 2,
            ],
            [
                'order' => 22,
                'title' => 'B1→B2 Consolidation & Assessment',
                'description' => 'Comprehensive review of all B1 competencies through integrated extended tasks: discussion, essay writing, listening comprehension, and reading tasks at B2 level. Final assessment confirms readiness to progress.',
                'grammar_points' => ['all B1-B2 structures in complex communicative contexts', 'accuracy and fluency balance at B2 level', 'self-monitoring and error correction strategies'],
                'vocabulary_themes' => ['review of all B1-B2 vocabulary', 'B2 academic and professional vocabulary', 'assessment and self-evaluation language'],
                'estimated_sessions' => 3,
            ],
        ];

        foreach ($b1b2 as $t) {
            $topics[] = array_merge($t, [
                'level_from' => 'B1', 'level_to' => 'B2',
                'grammar_points'    => json_encode($t['grammar_points']),
                'vocabulary_themes' => json_encode($t['vocabulary_themes']),
                'is_active' => true, 'created_at' => $now, 'updated_at' => $now,
            ]);
        }

        // ─────────────────────────────────────────────────────────────────────
        // B2 → C1  |  20 temas  |  18-24 semanas
        // Objetivo: comunicación sofisticada, fluida y matizada en cualquier contexto
        // ─────────────────────────────────────────────────────────────────────

        $b2c1 = [
            [
                'order' => 1,
                'title' => 'Advanced Conditionals & Mixed Conditionals',
                'description' => 'C1 requires mastery of the full conditional system, including mixed conditionals that combine different time frames. Students use these naturally in complex argumentation, storytelling, and academic writing.',
                'grammar_points' => ['mixed conditional type 1: if + past perfect + would (past condition, present result: If I had studied, I would be a doctor)', 'mixed conditional type 2: if + past simple + would have (present condition, past result)', 'inverted conditionals (formal): Had I known... / Were I to leave... / Should you need help...', 'wish + past perfect for regret: I wish I had taken that job', 'if only for strong regret and desire: If only I could travel more'],
                'vocabulary_themes' => ['hypothetical and counterfactual language', 'formal argumentation vocabulary', 'regret and aspiration expressions'],
                'estimated_sessions' => 4,
            ],
            [
                'order' => 2,
                'title' => 'Inversion & Emphasis Structures',
                'description' => 'Advanced structures that give writing and speech sophistication. Inversion after negative adverbials creates a formal, emphatic register used in academic writing, speeches, and high-level professional communication.',
                'grammar_points' => ['never, rarely, seldom, hardly, scarcely, barely + inversion (Never have I seen...)', 'not only... but also... (Not only did she win, but she also broke the record)', 'only when/if/after/by + inversion', 'so/such + inversion for result: So tired was he that he fell asleep immediately', 'little did I know / under no circumstances / on no account + inversion'],
                'vocabulary_themes' => ['emphatic and rhetorical language', 'formal speech and writing vocabulary', 'literary and journalistic expressions'],
                'estimated_sessions' => 3,
            ],
            [
                'order' => 3,
                'title' => 'Advanced Passive & Reporting Structures',
                'description' => 'C1 passive constructions go beyond simple tenses. Students master complex reporting structures used in journalism, academia, and formal speech that present information with objectivity and authority.',
                'grammar_points' => ['passive reporting: It is said/believed/reported/thought/known that...', 'personal passive reporting: He is said to be / She is believed to have left', 'passive infinitive constructions: The report appears to have been leaked', 'causative have/get: I had my car repaired / She got her hair cut / They had someone clean the office', 'complex passive in academic style: The experiment was designed to measure... / Data was collected by...'],
                'vocabulary_themes' => ['academic and journalistic language', 'formal reporting vocabulary', 'objective and authoritative tone expressions'],
                'estimated_sessions' => 3,
            ],
            [
                'order' => 4,
                'title' => 'Nominalisation & Academic Register',
                'description' => 'Nominalisation — turning verbs and adjectives into nouns — is the hallmark of academic English. Students learn to create the dense, formal noun phrases that characterise C1 writing and professional communication.',
                'grammar_points' => ['verb to noun: develop→development, decline→decline, analyse→analysis, achieve→achievement', 'adjective to noun: important→importance, difficult→difficulty, significant→significance', 'using nominalisations in sentences: The development of... / The increase in... / The extent to which...', 'abstract noun phrases with of: the impact of technology, the need for reform, the lack of evidence', 'reducing verb clauses to noun phrases: Because unemployment increased → The increase in unemployment'],
                'vocabulary_themes' => ['academic word families', 'abstract noun vocabulary', 'formal process and analysis language'],
                'estimated_sessions' => 3,
            ],
            [
                'order' => 5,
                'title' => 'Advanced Relative & Participle Clauses',
                'description' => 'C1 writers use reduced clauses to create concise, information-dense prose. Students master present and past participle clauses as alternatives to full relative clauses, and learn prepositional relative structures used in formal writing.',
                'grammar_points' => ['reduced defining relative clauses: the man sitting over there (= who is sitting)', 'reduced non-defining: The report, published last year, showed that... (= which was published)', 'present participle clauses: Walking home, I noticed a strange noise (simultaneous actions)', 'past participle clauses: Written in 1920, the novel describes... (= which was written)', 'prepositional relative clauses: the company for which he works / the reason why she left'],
                'vocabulary_themes' => ['academic and literary descriptive vocabulary', 'formal and concise expression language', 'analysis and evaluation vocabulary'],
                'estimated_sessions' => 3,
            ],
            [
                'order' => 6,
                'title' => 'Discourse Cohesion & Coherence',
                'description' => 'At C1, it is not just what you say but how you connect ideas across a whole text. Students learn the systems of reference, substitution, ellipsis, and lexical cohesion that make extended discourse hang together naturally.',
                'grammar_points' => ['reference: pronouns and determiners pointing back (anaphora) or forward (cataphora)', 'substitution: do so, do the same, so think, not (I think so / I hope not)', 'ellipsis: omitting repeated elements (She can sing and (she can) dance)', 'lexical chains: using synonyms, hyponyms, and related words to avoid repetition', 'thematic progression: how topics develop across sentences and paragraphs'],
                'vocabulary_themes' => ['cohesive device vocabulary', 'academic transition and reference phrases', 'text organisation meta-language'],
                'estimated_sessions' => 3,
            ],
            [
                'order' => 7,
                'title' => 'Idiomatic Language & Fixed Expressions',
                'description' => 'True C1 proficiency includes understanding and appropriately using idiomatic language. Students learn common idioms in context, strong collocations, and binomials — the fixed pairs that native speakers use automatically.',
                'grammar_points' => ['body part idioms: keep an eye on, give someone a hand, pull someone\'s leg, face the music', 'colour idioms: in the black, once in a blue moon, see red, green with envy', 'binomials: black and white, bread and butter, pros and cons, now and then, sooner or later', 'fixed idiomatic expressions: under the weather, on the fence, in hot water, make ends meet', 'collocations vs free combinations: heavy traffic (not strong), make progress (not do)'],
                'vocabulary_themes' => ['idiomatic vocabulary by theme', 'register-appropriate idiomatic use', 'fixed expression vocabulary'],
                'estimated_sessions' => 3,
            ],
            [
                'order' => 8,
                'title' => 'Advanced Academic Writing',
                'description' => 'Comprehensive academic writing at C1 level. Students produce well-structured argumentative essays, formal reports, and critical reviews with appropriate register, complexity, and coherence.',
                'grammar_points' => ['essay structure: hook, thesis, body (argument + evidence + analysis), conclusion', 'hedging language: It appears that, Evidence suggests, It is generally accepted that', 'counter-argument and concession: While it is true that..., Nevertheless..., Critics argue that...', 'integrating evidence: According to, As demonstrated by, This is supported by', 'academic style: impersonal constructions, formal vocabulary, nominalisation throughout'],
                'vocabulary_themes' => ['academic essay vocabulary', 'argument and counter-argument language', 'evidence, data, and analysis vocabulary'],
                'estimated_sessions' => 4,
            ],
            [
                'order' => 9,
                'title' => 'Debate, Negotiation & Persuasion',
                'description' => 'Advanced spoken interaction at C1 level. Students learn to hold their own in complex discussions, negotiate effectively, and persuade using sophisticated rhetorical techniques and diplomatic language.',
                'grammar_points' => ['concession before counter-argument: I take your point, but... / While I accept that..., nevertheless...', 'rhetorical questions: Isn\'t it true that...? / How can we justify...?', 'conditional structures in negotiation: If we were to agree on X, could you consider Y?', 'softening and hedging in disagreement: With all due respect... / I\'m not entirely convinced that...', 'emphasis and persuasion: What we need to remember is... / The key issue here is...'],
                'vocabulary_themes' => ['debate and discussion vocabulary', 'negotiation and compromise language', 'diplomatic and persuasive expressions'],
                'estimated_sessions' => 3,
            ],
            [
                'order' => 10,
                'title' => 'Literature & Critical Analysis',
                'description' => 'Reading and analysing literary and non-literary texts at C1 level. Students develop the vocabulary and language for interpreting, evaluating, and discussing complex texts — a key C1 and IELTS/Cambridge competency.',
                'grammar_points' => ['literary present tense for discussing texts (The author argues, The protagonist feels)', 'complex noun phrases in analysis (the protagonist\'s gradual decline, the author\'s implicit critique)', 'modal verbs for interpretation: could represent, may suggest, might be seen as, appears to', 'passive for objective analysis: The text can be interpreted as... / This theme is explored through...', 'reporting language for criticism: According to the author, the narrator implies that'],
                'vocabulary_themes' => ['literary analysis vocabulary', 'critical thinking and argumentation language', 'theme, symbolism, and narrative vocabulary'],
                'estimated_sessions' => 3,
            ],
            [
                'order' => 11,
                'title' => 'Humor, Irony, Sarcasm & Subtlety',
                'description' => 'The most distinctly native-like aspect of advanced English. Students learn to understand and produce humor, irony, and understatement — markers of true C1 proficiency that go far beyond grammar knowledge.',
                'grammar_points' => ['understatement: not exactly (= not at all), not the most (= very bad), could be better (= is bad)', 'irony: using positive language with negative intent (Oh great, another meeting)', 'double negation for emphasis: not uncommon, not impossible, not entirely wrong', 'rhetorical questions with ironic intent: And that\'s supposed to be an improvement?', 'litotes: not bad (= quite good), not unpleasant (= pleasant)'],
                'vocabulary_themes' => ['humor and wit vocabulary', 'irony and sarcasm markers', 'understatement and British humor expressions'],
                'estimated_sessions' => 2,
            ],
            [
                'order' => 12,
                'title' => 'Advanced Pronunciation & Phonology',
                'description' => 'Systematic phonology work at C1 level targeting the features that distinguish native-like from non-native speech: nuclear stress, intonation for attitude, and connected speech phenomena.',
                'grammar_points' => ['nuclear stress: placing emphasis on the most important word in a phrase', 'contrastive stress for correcting information: I said TUESDAY, not Thursday', 'intonation patterns: fall (certainty), rise (question/uncertainty), fall-rise (reservation/contrast)', 'connected speech: assimilation (Don\'t you → Dontcha?), elision, linking', 'prominence and de-emphasis: using weak forms to deprioritise grammatical words'],
                'vocabulary_themes' => ['phonology and prosody metalanguage', 'accent and variety awareness vocabulary', 'communication effectiveness vocabulary'],
                'estimated_sessions' => 3,
            ],
            [
                'order' => 13,
                'title' => 'Professional Communication & Soft Skills',
                'description' => 'Advanced professional English for high-level workplace contexts. Covers presentations, difficult professional conversations, leadership language, and complex written professional communication.',
                'grammar_points' => ['diplomatic language: I wonder if it might be possible to... / It might be worth considering...', 'softening criticism: The report could perhaps be more... / There\'s one area that might benefit from...', 'complex modal structures: This would appear to suggest that... / The data might be interpreted as...', 'formal passive in professional writing: It has been decided that... / Consideration will be given to...', 'hedging in professional advice: You may wish to consider / It would be advisable to'],
                'vocabulary_themes' => ['leadership and management vocabulary', 'professional relationship language', 'business writing and presentation vocabulary'],
                'estimated_sessions' => 3,
            ],
            [
                'order' => 14,
                'title' => 'Media Analysis & Critical Thinking',
                'description' => 'Students develop the language to critically evaluate media, identify bias, and discuss media influence on society — essential for authentic C1-level discourse and understanding of the English-speaking world.',
                'grammar_points' => ['complex passive reporting: The incident is alleged to have been caused by...', 'speculative modals in analysis: This could be interpreted as a deliberate attempt to...', 'complex contrast: Far from improving the situation, the policy has...', 'abstract noun phrases for critique: The misrepresentation of..., The tendency to oversimplify...', 'academic hedging applied to media: It is perhaps no coincidence that...'],
                'vocabulary_themes' => ['media analysis vocabulary', 'bias, perspective, and framing language', 'critical thinking and argumentation vocabulary'],
                'estimated_sessions' => 3,
            ],
            [
                'order' => 15,
                'title' => 'Sociolinguistics & Register Variation',
                'description' => 'Understanding how language varies according to social context, relationship, and purpose. Students develop metalinguistic awareness and the ability to code-switch appropriately across formal, informal, and specialist registers.',
                'grammar_points' => ['register markers: formal (request that, enquire), neutral (ask), informal (wonder, want to know)', 'dialect and colloquial grammatical features: innit?, gonna, wanna, ain\'t', 'politeness strategies: positive (solidarity) and negative (respect) politeness', 'face-threatening acts: requests, disagreement, criticism — and how to soften them', 'taboo language, euphemism, and political correctness in modern English'],
                'vocabulary_themes' => ['register vocabulary: formal/neutral/informal/slang', 'sociolinguistic and pragmatic metalanguage', 'global English and variety awareness vocabulary'],
                'estimated_sessions' => 3,
            ],
            [
                'order' => 16,
                'title' => 'Advanced Listening: Lectures, Debates & Complex Discussions',
                'description' => 'Authentic C1 listening tasks targeting the most challenging input types: academic lectures, political debates, documentaries, and radio discussions. Students develop sophisticated strategies for dense, fast, and complex spoken English.',
                'grammar_points' => ['discourse structure of academic lectures: signposting language, digression, return to topic', 'ellipsis and substitution in spontaneous speech', 'attitude markers in spoken language: apparently, obviously, frankly, to be honest', 'complex intonation for meaning: the same words with different intonation change meaning entirely', 'inferring meaning from context when vocabulary is unknown'],
                'vocabulary_themes' => ['academic lecture and seminar vocabulary', 'debate and political discourse language', 'listening strategy metalanguage'],
                'estimated_sessions' => 4,
            ],
            [
                'order' => 17,
                'title' => 'Lexical Range: Collocations, Word Families & Chunks',
                'description' => 'C1 is defined by wide and flexible vocabulary use. This unit systematically expands lexical range through word families, advanced collocations, and multi-word lexical chunks — the building blocks of natural C1 language.',
                'grammar_points' => ['word family patterns: form, formation, formal, formally, formality, formalism', 'strong collocations: deep-rooted, widespread concern, address an issue, raise awareness', 'weak collocations and common errors: a tall order (not a high order), heavy smoker (not strong smoker)', 'lexical chunks and multi-word items: as a matter of fact, at the end of the day, on the whole', 'connotation and register: slim vs thin vs skinny; home vs house; pass away vs die'],
                'vocabulary_themes' => ['academic word list extension', 'professional and formal collocations', 'idiomatic chunks and fixed expressions'],
                'estimated_sessions' => 3,
            ],
            [
                'order' => 18,
                'title' => 'Complex Grammar Integration: Accuracy & Fluency',
                'description' => 'A targeted consolidation unit for the most persistent C1 error areas. Students review complex grammar in extended authentic contexts while developing the fluency to use sophisticated structures automatically and naturally.',
                'grammar_points' => ['all C1 grammar structures integrated in extended conversational and written tasks', 'stylistic choice: when to use complex structures and when simplicity is better', 'self-correction and reformulation strategies in spoken discourse', 'sentence variety: combining short and long sentences for effect', 'accuracy under real-time communication pressure'],
                'vocabulary_themes' => ['integrated C1 vocabulary across all domains', 'academic and professional collocations', 'sophisticated expression vocabulary'],
                'estimated_sessions' => 3,
            ],
            [
                'order' => 19,
                'title' => 'Intercultural Communication & Global English',
                'description' => 'C1 communicators interact across cultures. This unit develops cultural intelligence, awareness of World Englishes, and the pragmatic skills to adapt communication style for different audiences and cultural contexts.',
                'grammar_points' => ['pragmatic competence: indirect speech acts (Can you open the window? = Please open it)', 'politeness strategies across cultures: directness vs indirectness', 'hedging in cross-cultural communication: We tend to..., In our culture it\'s common to...', 'adapting formality: recognising when to shift register based on cultural signals', 'misunderstanding and repair in intercultural conversation'],
                'vocabulary_themes' => ['intercultural communication vocabulary', 'cultural sensitivity and awareness language', 'global English and variety vocabulary'],
                'estimated_sessions' => 2,
            ],
            [
                'order' => 20,
                'title' => 'B2→C1 Final Assessment & Mastery Review',
                'description' => 'A comprehensive review of the entire C1 journey through extended, integrated tasks at the highest level: academic discussion, formal writing, complex listening, and literary analysis. A celebration of the student\'s transformation from A1 to C1.',
                'grammar_points' => ['all C1 structures in extended authentic contexts', 'stylistic flexibility and register control', 'complexity, accuracy, and naturalness in balance'],
                'vocabulary_themes' => ['complete C1 vocabulary consolidation', 'advanced idiom, collocation, and chunk review', 'C1 self-assessment and portfolio language'],
                'estimated_sessions' => 3,
            ],
        ];

        foreach ($b2c1 as $t) {
            $topics[] = array_merge($t, [
                'level_from' => 'B2', 'level_to' => 'C1',
                'grammar_points'    => json_encode($t['grammar_points']),
                'vocabulary_themes' => json_encode($t['vocabulary_themes']),
                'is_active' => true, 'created_at' => $now, 'updated_at' => $now,
            ]);
        }

        // ─────────────────────────────────────────────────────────────────────
        // Insertar en chunks para no sobrecargar el query
        // ─────────────────────────────────────────────────────────────────────

        foreach (array_chunk($topics, 20) as $chunk) {
            DB::table('curriculum_topics')->insert($chunk);
        }

        $total = count($topics);
        $this->command->info("✓ {$total} curriculum topics seeded successfully.");
        $this->command->info('  A1→A2: 18 | A2→B1: 22 | B1→B2: 22 | B2→C1: 20');
    }
}