# Character animation system (implements docs/ANIMATION-DIRECTIVE.md)

## 1. Rig inspection (lowpoly/Rig.tsx, before this work)
| Area | What existed | Limitation |
|---|---|---|
| Face | one head box; 10 pre-painted 64-px face textures, swapped instantly | no gaze, lids, independent brows, asymmetry, blending or lip sync |
| Body | hips (leg swing X), torso lean/twist/side, arms X+Z, head X/Y/Z | no shrug, arm roll, stance width, squash/stretch; no elbows/hands (R6) |
| Motion | `sample()` keys on twos + `breathe`/`life` idle | every joint starts/stops together; one cadence; same idle for everyone |

## 2. Solution
- **Live face** (`src/lowpoly/LiveFace.tsx`, opt-in via `pose.fc`): separate layered geometry on a blank
  face texture, keeping the approved design: cream eyes + tan rim, square pupils with highlight
  (gaze `gx/gy`, `pupil` size), upper + lower lids with tilt (blink, squint, smile cheeks, angry/sad
  lids), slab brows with per-side raise + tilt (asymmetry), mouth = 17 shapes (visemes + expressions,
  32x16 px) with jaw open, tilt and sideways shift (smirks), 3D glasses frames. Old videos unchanged.
- **Body controls** (`Extra` in Rig): `sq` squash/stretch (volume-preserving), `shrug`/`shrugL`/`shrugR`,
  `armLY/armRY` roll, `legLZ/legRZ` stance, `headOnly` for face QC.
- **Acting module** (`src/acting/`):
  - `face.ts`: 21 expressions (asymmetric where the emotion is), `faceAt` blended transitions
    (`in` frames, 0 = hit), `blinkAt` irregular natural blinks + doubles + forced blinks on gaze shifts,
    `gazeAt` saccades + profile-driven micro-darts, `lipAt` grapheme→viseme lip sync from word timings
    with co-articulated jaw and closed/relaxed mouths in pauses.
  - `body.ts`: `perform` runs every joint through its own damped spring → overlapping action and
    follow-through (head/arms lag and overshoot); `cadence` ones/twos/threes per section;
    `squash` impulses; `arc` travel; `layer`.
  - `performer.ts`: `act(profile, direction, f)` = keys → springs → posture → idle → eyes-lead-head
    gaze → speech beats (nods, brow lifts, hand beats on stressed words) → listening nods → mannerism
    → expression + blinks + lip sync.
  - `profiles.ts`: one profile per recurring character (below). `accents.tsx`: `Impact` frames,
    `SpeedLines` (use only on story beats).
- **QC tools:** `FaceSheet` still (every expression / viseme per character), `ActingTest` composition.

## 3. Character profiles (Escobar)
| Character | Posture | Idle / speed | Eyes | Speaking | Mannerism |
|---|---|---|---|---|---|
| Pablo (adult) | chest out, chin up, arms loose | slow sway, twos | steady contact, slow blinks (130 f) | small deliberate gestures | smooths mustache with a knuckle |
| Teen Pablo | cocky head tilt | bouncy, loose (1.3) | quick look-arounds | big gestures, brows | weight bounce |
| Roberto | hunched, head forward, shoulders up | quick small shifts | darting, fast blinks (55 f) | nods, anxious brows | pushes glasses up |
| Father | stooped | slow, heavy, threes | calm | minimal | wipes brow |
| Mother | upright | warm sway | engaged | expressive brows + hands | — |
| Police | alert, still | minimal | scanning | clipped | — |
| Fisherman | relaxed slouch | very slow, threes | drowsy | minimal | — |

## 4. Test: ActingTest (7.6 s, scratch two-voice Piper track, word-timed)
Roberto reports a $2,000/month rubber-band bill, Pablo shrugs ("So? Buy more rubber bands."),
Roberto explodes ("That is not the problem!") and slams the ledger; Pablo flinches, then smirks.
Cameras: OTS past Pablo → Pablo waist-up → Roberto push-in (on ones + impact frame + shake at the
slam) → Pablo reaction close-up.
Iterations (stills inspected each time): brow/lid tilt sign inverted (fixed); mouths too small and
hidden by 3D mustache/stubble (bigger, lower, in front); pupils too small; close-ups too tight to show
the shrug (now waist-up); black void past the set (room closed with library walls/ceiling); slam hid
Roberto's face (now body down, eyes up glaring). Full render repaired with fix_frames (103 tiled frames).

## 5. Known limitations
- R6 arms are single blocks with no hands: no pointing/palms; gestures rely on arm angles + shrugs.
- Small faces in wide shots lose lid/brow detail; key acting needs medium or closer framing.
- Halftone treatment not implemented yet; smears only via whip transitions.
- Escobar shots have not been re-animated with the system yet (next).
