# What If... a genie gave you only ONE wish?

18 still images, 16:9 (1920x1080), in `output/whatif-genie/01.png` ... `18.png`. One image per beat; cut to
the next image when its line starts. Suggested durations add up to about 33 seconds.

Clyde is cut straight out of his character sheets (`cast/clyde/`, cut-outs in `assets/`). The genie is
drawn to match, since he isn't on the sheets.

| Image | Who | Line | Clyde art | Time |
|---|---|---|---|---|
| 01 | Narrator | "What if a genie suddenly appeared in front of you... and gave you only ONE wish?" | shrug | 3.5s |
| 02 | SFX | *POP!* | shocked | 1.0s |
| 03 | Genie | "You get ONE wish!" | excited | 1.5s |
| 04 | — | *(Clyde turns to the camera, scheming)* | scheming | 1.2s |
| 05 | Genie | "The rules are—" | smirking | 1.0s |
| 06 | Clyde (fast) | "TIME STOP." | Mogger | 0.9s |
| 07 | Genie | "WHAT?! I haven't finished the rules yet!" | — | 2.2s |
| 08 | Clyde (slow, dramatic) | "TA... IME... STOP." | Mogger, closer | 1.8s |
| 09 | Genie | "NO!" | — | 0.9s |
| 10 | Clyde | "MIND CONTROL." | grinning | 1.2s |
| 11 | Genie | "I cannot give you that. You can wish for anything else." | skeptical | 3.0s |
| 12 | Clyde (innocent) | "Okay... then I wish that you give me a random ability." | giggling | 3.0s |
| 13 | Genie | "Your wish is my..." | smirk-wink | 1.4s |
| 14 | Clyde (cutting in) | "TIME STOP!" | excited shout | 0.9s |
| 15 | Genie | "...command." | smug | 1.0s |
| 16 | Genie | "Wait... NOOO!" | smirking | 1.8s |
| 17 | SFX | *(time freezes: the clock stops ticking)* | sneaking | 1.5s |
| 18 | Clyde | *(evil laugh)* "Heh heh heh... MWAHAHAHA!" | scheming | 2.5s |

The rules scroll (images 05, 07, 11) reads: 1. No extra wishes, 2. No mind control, 3. No time travel,
4. **NO TIME STOP**, 5. No wishing for a better genie.

## Rebuild

```sh
node tools/panels.js projects/whatif-genie/index.html output/whatif-genie
```
