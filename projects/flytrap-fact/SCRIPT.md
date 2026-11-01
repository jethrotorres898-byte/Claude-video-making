# A Venus flytrap can count (45 s, 16:9)

Plant-facts channel. Watercolor paper-cut style from the creator's own reference: soft painted
washes, thin warm ink outlines, every object cut out of paper with a white border and a soft
shadow, out-of-focus background hills. Narration: the creator's own ElevenLabs voice (`voice.mp3`).

## Narration

> Did you know a Venus flytrap can actually count? And no, this isn't a joke. This plant really keeps score.
>
> Inside its trap are tiny trigger hairs. If something touches just one... nothing happens. It could only be a raindrop.
>
> But if a second hair gets touched within about twenty seconds... SNAP! The trap slams shut in a fraction of a second.
>
> And it doesn't stop counting. Every time the bug struggles, the plant counts it... and makes even more digestive juice.
>
> It counts so it never wastes energy on a false alarm. A plant... that can count. Follow for more plant facts!

Fact check: Böhm et al. 2016, *Current Biology* 26:286 (two trigger-hair signals within
roughly 15-20 s close the trap; further signals drive digestive enzymes and nutrient uptake).
The trap shuts in about a tenth of a second.

## Shots (times from the current recording)

Every beat is tied to a word of the narration (`cues.js`), so a new recording only needs
`tools/align.py` to re-time everything.

| Time | Shot | What happens |
|---|---|---|
| 0.0-9.2 | Wide garden, slow push-in | Stickman beside the potted flytrap on a stump; "PLANT FACT" tag. *Venus*: a garden sign "Venus flytrap" pops up. *count?*: a "?" over his head, hand on chin. *And no*: he turns to camera, palm up, serious; shakes his head on *joke*. *keeps score*: he points at the sign as tally marks appear. |
| 9.2-23.6 | Close-up of an open trap | *trigger hairs*: the three hairs glow, labelled. *something... one*: a raindrop hits one hair, counter "1". *nothing happens*: crickets. *raindrop*: the count fades. *But*: a fly buzzes in and lands. *second*: it bumps a hair, counter "1". *within*: a 20 s stopwatch starts ticking. The fly walks to another hair, counter "2". *SNAP!*: the trap slams shut, shake, "SNAP!" tag. |
| 23.6-26.7 | Medium wide | The stickman jumps in fright, the closed trap wobbles. *fraction of a second*: stopwatch "0.1 s". |
| 26.7-35.4 | Close-up of the closed trap | The stickman peeks in, counting on his fingers. *struggles*: the trap wiggles five times, counter 3 to 7. *digestive juice*: drops ooze along the seam, labelled. |
| 35.4-39.1 | Medium on the plant | *never wastes energy*: a raindrop lands on another trap, a hair glows, nothing closes; a full battery pops up. *false alarm*: green check, "energy saved". |
| 39.1-45.0 | Wide pull-back | *A plant... that can count*: the stickman faces camera, amazed, and hops. *Follow for more plant facts!*: a signpost pops up ("FOLLOW FOR MORE / PLANT FACTS!"), thumbs up and a wink. |

Sound (`sound.py`): soft plucky score (C Am F G, 100 bpm) ducked under the voice, drops to a
held chord and a ticking clock for "within about twenty seconds...", stops for the SNAP, and
comes back brighter for the outro; birds, pops, chimes for the hairs, a drip, crickets, the fly's
buzz, the snap, a slide whistle for the jump, squishes and muffled buzzes for the struggles,
bloops for the juice.
