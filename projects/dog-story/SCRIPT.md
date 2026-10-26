# "Rags to Riches: Dog Edition"

Format: vertical 9:16 (1080x1920), 30 fps, about 56 seconds. Comedy.

## The style

A painted, shaded look built entirely in code (`lib/doggo.js`): dogs with gradient
fur, texture strokes, contact shadows, four IK legs with a walk cycle, a hinged jaw that
opens on every bark, floppy ears, a wagging tail, eyelids and brows for expression, and
a front-facing head for the final wink. Scenes use soft lighting, blurred backgrounds
for depth, colour grading per scene, vignette and film grain. Not photoreal (no video
model here), but much more detailed than the stickman videos.

Cast: the stray (scruffy brown mutt), Bella (snobby white poodle with a pink bow), the
bulldog with a red convertible, and Coco (an elegant golden afghan-type with pearls, a silk
scarf and sunglasses).

## How the barks work

No words are spoken. Every bark is synthesized with a tone that fits the moment, and a
"dog translation" subtitle shows the tone in brackets plus what he means:

| Time | Bark (tone) | Translation | Scene |
|---|---|---|---|
| 1.3 | sad whimper | "Day 1,247 of being a stray." | Curled up in a cardboard box in a rainy alley, shivering. |
| 4.0 | stomach growls | "Haven't eaten since Tuesday." | He looks at his rumbling belly. |
| 7.8 | snobby yip yip (Bella) | "It's not you. It's your empty food bowl." | Park bench; he's holding a flower, tail wagging. |
| 11.0 | smug huff (bulldog) | "Need a ride, gorgeous?" | A bulldog in shades pulls up in a red convertible, honks twice. |
| 12.4 | dismissive yip (Bella) | "Bye, broke boy." | She hops into the car. Record scratch, exhaust in his face. |
| 14.4 | dramatic howling | "WHYYYYYYY" | A personal rain cloud appears over him only. |
| 19.9 | curious boof? | "...wait. People make money from THIS?" | Walking past a lit window: TJR · LIVE TRADING WORKSHOP. Ears perk (boing), he moonwalks back. |
| 25.4 | thoughtful huff | "Front row. Every night. Well... front window." | Peeking over the sill as TJR teaches: RISK MANAGEMENT, PATIENCE, WAIT FOR THE SETUP. Nights pass (rain, moon, snow); chalk tally marks pile up on the wall. |
| 29.0 | determined grumble | "Okay. I need a computer." | Head-first in a dumpster, trash flying. |
| 31.5 | excited BORK! | "JACKPOT!" | A banana peel lands on his head; he lifts a taped-up laptop to the sky, choir and sun rays. |
| 34.9 | low growl | "Stick... to... the plan." | Trading from his box ("HEADQUARTERS"); chart is red. |
| 36.9 | happy yips | "WE EATING TONIGHT!" | Chart goes green, tail-wag frenzy, dog-food cans start stacking up. Seasons fly by. |
| — | — | ONE YEAR LATER (that's 7 in dog years) | |
| 43.2 | confident WOOF | "Who's a good boy now?" | Golden hour, gold convertible, gold chains, shades; Coco beside him. |
| 45.3 | classy yip (Coco) | "Babe, the yacht is waiting." | |
| 47.6 | shocked yelp (Bella) | "Is that... HIM?!" | They pass Bella and the bulldog at a bus stop, red car broken down and smoking, rain cloud over them. The bulldog's shades fall off. |
| 52.2 | smug huff | "Stay hungry, pups." | Close drive-by: he stops, turns to camera, lowers his shades, winks (ding!). Coco blows a kiss. |
| — | — | — | He floors it; money pours off the back of the car. "Not financial advice. Definitely not from a dog." |

## Sound

All barks and effects are synthesized (`tools/synth.py`, dog section): formant barks with
pitch contours per tone (deep woof, small yips, questioning "boof?"), a nasal whimper, an
"awoo" howl that moves from /a/ to /u/, a rattling growl, huffs and a stomach gurgle.
Score: melodramatic violin in the rain, romantic swing on the bench until the record
scratch, curious pizzicato at the window, sneaky pizzicato in the dumpster and a choir for
the laptop reveal, a tense-then-funky trading groove, and a 90 BPM swagger beat with an
808 for the gold car. Music ducks under every bark.
