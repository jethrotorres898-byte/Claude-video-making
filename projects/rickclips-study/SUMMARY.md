# RickClips study: tutorial workflow summary

Study notes on "How to Make Viral Animated Shorts Using Claude (Full Workflow)" by Mr omi
(https://youtu.be/OtbLL6OBNE4), plus transcripts of the 24 newest Shorts from
https://www.youtube.com/@RicksClips3000/shorts as of 2026-11-03.

This summary comes from the tutorial's narration and description only. Every number below is the
tutorial's own claim and has not been measured here. The on-screen visuals were not reviewed.

The videos are kept locally in `./yt` and are not committed. Transcripts are in `transcripts/`.

## The style

2D flat characters in a real 3D world, built with code rather than an AI video generator.

## Workflow

1. **Collect references.** Download the channel's last 20 shorts, in the original English audio.
   The first attempt returned a German dub.
2. **Study every frame.** Asked to "analyze" a video, Claude only samples a few frames, and the
   micro animations that make the style work are missed. So require a full 30 fps pass: 20 shorts,
   about 18 minutes, over 32,000 frames. The output is a rule book.
3. **Measure instead of giving opinions.** Claude wrote its own tooling:
   - contact sheets of 60 frames for every 2 seconds of video (549 sheets)
   - camera tracking with phase correlation
   - hard cut detection
   - brightness, contrast and saturation per short
4. **Pick an original story.** Drop any topic the channel already covered. The first topic was
   dropped for that reason. The replacement was the 1831 bridge that collapsed under 74 marching
   soldiers.
5. **Check facts before writing.** Date, head count and river depth were all verified. The two-foot
   river became the best joke in the short.
6. **Write the script to the formula** (below).
7. **Build in three.js and render with Remotion.** Blender was tried first, then dropped when
   three.js proved able to place flat characters in a 3D world. The build used 37 free 3D models,
   textures painted in code, 14 character faces, a custom ink line effect, and 15 shots totalling
   2,025 frames.
8. **Check stills before rendering video.** This caught a camera stuck inside a house in three
   shots, teal trees, and a chain in front of faces.
9. **Compare side by side with the reference and rebuild.** The first version looked cheap, so a
   team of 12 agents ran a gap analysis:
   - 7 measured the gap: color, ink lines, light and shadow, textures, characters, depth and
     framing, motion
   - 1 worked on sound
   - 4 rebuilt: camera, world, characters, final look
   - each rebuild agent had its own project copy and owned its own files, and Claude merged the
     results file by file
10. **Package it as a skill.** Rules and fixes were saved as a Claude skill, published at
    https://github.com/mromidev/claude-animated-shorts (not reviewed or installed here).

## Script formula

- A paradox in the first sentence, with no intro or setup
- Escalation, then a pivot where the real reason comes out
- A payoff: one last line where the twist lands
- "You see" flips into the explanation (14 of the tutorial's 20 shorts)
- Almost 4 words per second with basically no dead air

Cross-check against these 24 transcripts: a text search finds "you see" in 16 of them. It counts
matches anywhere in the script, not only at the pivot.

## Visual rules

| Area | Reference | First attempt |
| --- | --- | --- |
| Ink lines | Black lines on almost 3 of 4 edges of the 3D world | Zero: the blur ran in the same step and wiped them out |
| Background blur | Blurry, so the eye goes to the character | Too weak to see |
| Camera moves | Glide over about 23 frames, slow in and slow out | Snapped in 3 frames |
| Color | Saturated, warm highlights, cool blue shadows, no pure black | Pastel and flat, almost black darks |
| Sunset shadows | Purple | Brown |
| Textures | Hand-painted look, visible grain, dark gaps between planks | Plain |
| Character proportions | 3.5 heads tall, thin limbs | Under 3 heads, limbs 5 times too thick |

Also:

- Characters are flat but lit by the scene: they catch the key light and cast real shadows.
- Lighting follows the story: warm and bright for setup, deep night blue as the explanation begins.
- Cuts are rare. 12 of the 20 have one hard cut or none, and the camera travels into the next moment.

## Corrections the tutorial made to itself

Early notes were wrong, and only later side-by-side measurement caught them:

- **Camera:** the first tool said it was almost still in 80% of frames. It actually moves in 65%,
  in pushes too slow for the tool to detect.
- **Heads:** "egg-shaped" was wrong. Across 38 measured heads, the reference's were rounder than
  the first attempt's.

Treat any single tool's numbers as provisional.

## Takeaways

- Don't ask Claude what it thinks of a video, make it measure. A number can be recreated.
- With many agents, split the files as well as the jobs.
- Check stills before spending time on a render.

## Transcript notes

- Transcribed with Whisper `small` on CPU, with the language auto-detected as English for all 25.
- Transcripts are raw and uncorrected, so expect mishearings. For example, the tutorial's "3JS" is
  three.js, and short 01 opens "He saw gaps" where the likely wording is "He sawed gaps".
- Timestamps are `mm:ss` per Whisper segment.
- Files are numbered newest first: `short_01` is the newest Short.
