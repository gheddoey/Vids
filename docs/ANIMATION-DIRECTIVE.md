# Advanced character animation directive (user, Nov 26 2026) — STANDING RULES

Stylized feature-film acting with an ORIGINAL identity inspired by the high-level principles of
Into the Spider-Verse (never copy shots or designs). Characters must ACT, not merely move.

1. **Facial animation (top priority).** Brows, gaze, blinks, asymmetry, squint, wide eyes, narrowing,
   mouth open/close, lip sync, jaw, smirk, frown, smile, surprise, confusion, frustration, subtle
   transitions. Never one expression for a whole conversation.
   - Eyes show thought: gaze tracking, looking at/away, darts, anticipatory eye moves (eyes lead the
     head), natural blink intervals, different gaze behaviour per emotion, never robotically synced.
   - Mouth: phoneme/viseme shapes synced to dialogue/narration, natural jaw, pauses, no repetitive flapping.
2. **Body language.** Weight shifts, shoulders, head tilts, gestures, rotation, leaning, posture,
   walk/run/turn/sit/stand, reactions, character-specific idles. Every move has an intention
   (confident = relaxed + deliberate; anxious = hesitant, shifting, unstable eye contact; angry = sharp,
   tense, forceful; confused = tilt, pause, redirected gaze). No identical movement patterns.
3. **Principles.** Squash/stretch (controlled), anticipation, follow-through, overlapping action, timing
   and spacing variety, exaggeration, arcs, pose-to-pose (key poses read on their own).
4. **Visual language.** Strong silhouettes, expressive poses, exaggerated facial acting, distinct
   movement styles, stylized timing, dynamic compositions, graphic accents, selective exaggeration,
   intentional pauses. Where appropriate: variable cadence (ones/twos/threes), limited animation for
   emphasis, impact frames, graphic motion accents, controlled blur, selective smears, subtle halftone.
   Deliberate, never on every shot.
5. **Personality system.** Each recurring character has a profile: posture, walk, standing behaviour,
   gesture vocabulary, expression range, blink/gaze behaviour, reactions, speaking behaviour, speed,
   mannerisms. Recognisable by behaviour; no shared idles.
6. **Dialogue.** Gaze exchanges, head turns, reactions, gestures, posture adjustments, speaking AND
   listening animation, pauses, interruptions. Listeners act too.
7. **Blocking with the camera.** Close-ups for emotion, reaction shots, OTS, mediums for body
   language, wides for physical relations, dynamic moves for action. Vary angles.
8. **Pipeline per character.** Inspect rig → facial controls → body controls → deformation vs alternate
   meshes/textures → limits → plan → test → render previews → inspect → refine. Never pretend a rig has
   controls it lacks.
9. **QC.** Emotion? Expressions fit? Intentional eyes? Mouth matches audio? Expressive body? Weight?
   Readable poses? Mechanical? Repetitive? Distinct personalities? Static NPC / identical movement /
   standing still with moving mouths / expressions not matching context = NOT FINISHED.

Implementation + profiles: `src/acting/` and `docs/ANIMATION-SYSTEM.md`.
