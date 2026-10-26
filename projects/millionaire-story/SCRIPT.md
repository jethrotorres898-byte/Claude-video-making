# "How I Got This Car": stickman millionaire story

Format: vertical 9:16 (1080x1920), 30 fps, about 70 seconds, first-person voiceover.
The stickman tells the story himself: he's on screen talking (lip-synced) in the car
and when he thanks TJR; everything else is narration over the flashback.
Captions highlight each word as it's spoken.

TJR is drawn as a stickman with his look: wavy swept-back blond hair, mustache,
goatee/stubble and silver chains.

| # | Scene | Line | On screen |
|---|---|---|---|
| 1 | Night drive | "Let me tell you how I got this luxury car." | Stickman in sunglasses and a gold chain cruising a convertible through the city at night; camera pushes in. |
| 2 | | "One year ago, I was completely broke." | He lowers his shades. VHS rewind → "◀◀ 1 YEAR AGO". |
| 3 | Losing | "I was trading every single day..." | Hammering BUY / SELL on a choppy chart. |
| 4 | | "and losing every single day." | Balance drops -$650 per word. |
| 5 | | "I bought the tops. I sold the bottoms." | BUY tag lands on the top, SELL tag on the bottom. |
| 6 | | "Until one day, I blew my entire account." | Crash candle, screen shake, balance $0, ACCOUNT BLOWN stamp. |
| 7 | The break | "So I stepped away. No charts. No trades." | Laptop closes, he walks off; no-chart / no-trade icons. |
| 8 | Couch | "Just me, my couch, and my phone." | Couch and phone pop as they're named; scrolling scam posts. |
| 9 | | "And that's when I found TJR." | Feed stops on TJR's post, "!" over his head, FOLLOW. |
| 10 | | "A day trader who actually teaches people how to trade." | Camera dives into the phone: TJR's video, marking TARGET / ENTRY / STOP. |
| 11 | Studying | "So I studied everything. His guides. His videos. His rules." | Desk + laptop with TJR teaching; GUIDES / VIDEOS / RULES cards. |
| 12 | | "Risk management. Patience. No FOMO." | TJR'S RULES checklist ticks in on each word. |
| 13 | | "Day after day, for thirty days straight." | Calendar flips 1 → 30, window flicks day/night. |
| 14 | The win | "Then, I waited for my setup..." | Calm, hand on chin; SETUP ✓ box on the chart. |
| 15 | | "pressed buy..." | Presses BUY, entry line. |
| 16 | | "and caught my first big win!" | Green candles rip, +$4,820, he jumps up, confetti. |
| 17 | Meeting | "Months later, I finally met TJR in person." | Traders meetup; he walks up to TJR, handshake. |
| 18 | | "Thank you, man. Your videos changed my life." | Spoken on screen (lip sync); TJR smiles, nods, thumbs up. |
| 19 | The million | "That one win became a system." | One green candle multiplies into a rising staircase. |
| 20 | | "And that system made my first million." | Balance rolls to $1,000,000, gold glow, money rain. |
| 21 | Night drive | "And that's how I got this car." | Back in the car, pats the door. |
| 22 | | "So if you're losing right now, don't quit." | Close-up, shades down, points at the viewer. |
| 23 | | "Learn. Stay disciplined. Your win is coming." | Shades back on, he floors it and leaves the frame. "Fictional story · Not financial advice". |

## Voice

Kokoro-82M text-to-speech, voice `am_michael`, speed 1.05. `voice.py` renders each
line, checks it with Whisper speech recognition and stores word timings plus a mouth
envelope in `voice.js`; the animation and the music are both timed from that file,
so editing a line and re-running everything keeps the sync.
