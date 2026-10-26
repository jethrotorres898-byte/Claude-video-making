# "They Laughed In Class": energetic Inkman story

Format: vertical 9:16 (1080x1920), 30 fps, about 48 seconds.

## The style ("Inkman")

My own stickman design, built in `lib/inkman.js`:
- Front-facing characters with bendy rubber-hose arms and legs, white cartoon gloves,
  big expressive eyes (stars when amazed, flames when fired up), blush, tears, sweat.
- The hero wears an orange cap with a lightning-bolt badge and orange sneakers.
- Classmates are told apart by hair and accessories: spiky hair + headphones (Jay, the one
  who mocks him), ponytail + pink bow, curly hair + glasses, buns, a blue beanie.
- TJR in the same style: golden swept-back hair, mustache, goatee and chains.
- Loud flat-colour worlds: sunburst backgrounds, halftone dots, anime speed lines, slam
  text, slash wipes between scenes, punch-ins on the beat.
- Captions pop in word by word; the active word is coloured by who is speaking.

## Script

| # | Speaker | Line | On screen |
|---|---|---|---|
| 1 | Hero (narration) | "Everyone in my class laughed at me." | Classroom; classmates turn and burst out laughing, HA HA sprites. |
| 2 | Jay | "Bro lost money again!" | Jay leans in and points, lip-synced; camera pushes in. |
| 3 | Class | *(laughter)* | Everyone howls; the hero shrinks behind his laptop (-$420 card). |
| 4 | Hero | "Because I was trading in the back of class, and losing." | Close-up: phone under the desk, balance falling. |
| 5 | Hero | "Every. Single. Time." | A ✗ slams down on each word. |
| 6 | Hero | "Minus fifty. Minus a hundred. Minus everything." | -$50, -$100, -$EVERYTHING slam in; balance $0, tears. |
| 7 | Hero | "I almost quit." | Grey room, head on the desk, rain cloud. |
| 8 | Hero | "Then, at 2 AM, I found a TJR motivational video." | Bed at 2:00 AM; the phone flies up full-screen: TJR pumping his fists, KEEP GOING. |
| 9 | Hero | "And it hit different." | White impact flash, sunburst, fire in his eyes. |
| 10 | Hero | "So I kept going." | **Beat drop**: he lands in frame, fist pump. |
| 11 | Hero | "I studied his guides. Practiced every day. Kept my losses small." | Fast cuts: books + TJR video, BUY/SELL drills with a day counter, STOP -1% ✓. |
| 12 | Hero | "Week one, red. Week two, closer. Week four..." | WEEK 1 / WEEK 2 / WEEK 4 cards, drum roll. |
| 13 | Hero | "Green!" | Green flash, he jumps, confetti. |
| 14 | Hero | "Then green again. And again. And again." | Green candles stack on each "again", profit climbs, he dances. |
| 15 | Hero | "Now, the same class that laughed at me..." | Back in class: star eyes everywhere; hero in shades + gold chain, hands behind head. |
| 16 | Mia | "Yo, how do I start trading?" | She leans in begging. |
| 17 | Leo | "Teach me, bro!" | |
| 18 | Zoe | "Please help me!" | The whole class crowds in; even Jay is begging. |
| 19 | Hero (on screen) | "Funny how that works." | Shrugs, lowers his shades, winks. |
| 20 | Hero (on screen) | "Keep going. Your turn is coming." | Points at the viewer, thumbs up. "Fictional story · Not financial advice". |

## Voices

Kokoro-82M: hero `am_michael` (speed 1.12), Jay `am_echo`, Mia `af_nicole`, Leo `am_liam`,
Zoe `af_sarah`. The laugh is synthesized (formant "ha-ha" voices layered in `tools/synth.py`),
since the voice model can't laugh convincingly. Every spoken line is checked with Whisper,
on its own and again over the final music mix.

## Music

128 BPM, I-V-vi-IV: bouncy groove in class, tense minor pulse while losing, rain and piano
for "almost quit", an ambient build at 2 AM, impact + riser, then the drop on "So I kept
going" carries the montage and the ending. Music ducks under every voice.
