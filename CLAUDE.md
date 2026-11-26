# Vids — blocky animated YouTube Shorts

Everything learned so far making videos in this repo. Read it all before starting a new video.

## THE SIX RULES (engraved — apply to EVERY video, characters included)

The user's style card (`docs/six-rules.jpg`). Every new video and every remake follows all six:

1. **Low poly: ~300 triangles per character, flat shading.** Plain boxes (12 tris each), no rounded
   geometry, `flatShading` on everything.
2. **64-pixel textures, painted by code.** Faces, shirts, pants, shoes, props, floors, walls: `tex64()`
   canvases (64 px or smaller), nearest filtering, never smoothed. No 512-px faces or 585×559 shirt
   templates for new characters.
3. **Render at 270×480, no smoothing** — combined with 1080p via the **RetroHD** filter
   (`src/retro/RetroHD.tsx`): near subjects crisp HD with outlines, the world dissolves into true
   270×480 dithered pixels with distance. Captions stay HD.
4. **Snap vertices to a grid, dither the colours** (`PS1Pass` vertex snap + Bayer dither).
5. **Slice it open, label one part** — every video has one cutaway moment with a 3D label.
6. **A new pose on every sentence** — each VO line gets a fresh key pose (plus a cut).

Rig: `src/lowpoly/Rig.tsx` (`Look` config: hair styles, hats, tops/jerseys with pixel numbers, glasses,
beard, mustache, earrings, whistle, `half` for slicing). Example cast: `src/lebron2/cast.ts`.
The character rig keeps the approved proportions (R6 blocks, 1.2×1.4×1.2 head, face layout with
cream-rectangle eyes, square pupils, slab brows, per-character pupil colour), redrawn at 64 px.

## What we make

YouTube Shorts in a blocky, Roblox-like R6 style, animated with Remotion + Three.js
(@react-three/fiber via @remotion/three). Videos so far:

| Composition | File | What |
|---|---|---|
| `MessiShort` | `src/messi/MessiShort.tsx` | 58 s vertical biography short (best reference — copy this structure) |
| `LeBronShort` | `src/lebron/LeBronShort.tsx` | 41 s vertical biography short (first attempt; user found it "bland") |
| `IcedTea` | `src/IcedTea.tsx` | 22 s 16:9 homage of an anime bar scene |
| `LastSlice` | `src/LastSlice.tsx` | 22 s 16:9 original comedy short (pizza slice) |
| `LeBron2` | `src/lebron2/LeBron2.tsx` | 41 s LeBron remake: six rules, `lowpoly/Rig` cast, 17 dense sets, slice-open reveal (**new reference**) |
| `PS1Test` | `src/ps1/PS1Short.tsx` | 28 s retro "six rules" style test, HD-retro look (draft timing, no VO yet) |
| `GroupA/GroupB/Heads/Base` stills | `src/Lineup.tsx` | character line-ups for checking designs |

Shorts format: **1080×1920 (9:16), 30 fps**. Older 16:9 pieces are 1920×1080, 24 fps.

## The user (how they work)

- Works from a **phone**. Keep replies short and scannable; send renders with `SendUserFile`.
- Gives blunt visual feedback ("too soft", "copy to the EXACT detail", "dude, that's a basketball").
  Take it literally and fix exactly that; don't argue.
- **Always remove dead air** (audio pauses and visual holds). This is a standing rule.
- Wants **everything planned first**: a storyboard with places, props, characters, camera, light, sound.
- Wants **detail**: props and objects in every scene, characters of **different heights** (kids short,
  parents tall), **unique features** per person (glasses, mustache, hair, earrings…).
- **Dense, lived-in sets (user loved the PS1Test bedroom — do this in every future video):** each room gets
  its own layered story props: textured floor + wallpaper, a window showing outside (moon/stars/city),
  a practical light (desk lamp, CRT glow), furniture with stuff on it (cartridges, console, shelf of boxes),
  floor clutter (rug, beanbag, pizza box, soda can, controller). See `Bedroom` in `src/ps1/sets.tsx`.
- **No flat graphics.** Magazine covers, price tags, social posts, scoreboards, signs, counts must be
  **3D objects in the blocky style** (use `BlockText` / RBox), never flat posters or canvas images.
- Don't reuse a previous video's assets where they'd be recognised (the user noticed Messi's kid shirt
  was LeBron's). Make new shirts per video/character.
- Check the sport/domain props are right (soccer ball ≠ basketball; football pitch not a crowd wall).
- Has asked for: storyboard → script → they generate the voice in **ElevenLabs** (voice "Mike –
  Animation Explainers, Gaming") → I build the video from the mp3.
- Scripts: give them **without `<break>` tags** (they asked to remove them). Paragraph breaks only.
  Aim length by the voice speed: this voice speaks ~2.9 words/s, so ~170–210 words ≈ 60–70 s raw.
- Commit and push after each meaningful step (branch `claude/install-tools-qtsrqr`).

## Art style (locked in — the user approved these)

### Body
- R6 blocks: legs 1×2×1, torso 2×2×1, arms 1×2×1, **sharp edges** (user said "too soft, make it sharper").
  `RBox` bevel is a hairline (`r*0.15`, max 0.012) with `flatShading`.
- Head: **square, elongated: 1.2 wide × 1.4 tall × 1.2 deep** (`HEAD_H = 1.4`), radius 0.04.
  (A rounded classic-Roblox head was tried and **rejected** — user asked to go back to square.)
- Shirts are **585×559 classic Roblox templates** mapped per face (see `Character.tsx` TORSO/RIGHT_ARM/
  LEFT_ARM rects). Transparent areas show skin. Pants are a solid colour.
- Characters have a height = rig scale: kid 0.62–0.82, teen 0.7–0.92, adult 0.95–1.1.
  Wrap in `<group scale>` (see `Actor`/`Who`). Walk keys in local units = world ÷ scale.

### Face (final, approved — "this will be the last rework for the eyes")
- Eyes: **cream rectangles** (122×82 on the 512 face canvas) with a lighter inner panel, thin tan rim,
  soft drop shadow, and a **small square pupil** (27 px) with a tiny highlight.
- **Each character has a different pupil colour** (`eyeColor`).
- **Brows: thick slab** on top of each eye, bevelled (lighter top, darker bottom), tilt for expression.
  **Brow colour follows the hair** (`browColor` ?? hair colour ?? beard ?? dark brown) — not all grey.
- Expressions (`FaceType`): smile, serious, mustache, grin, calm, ouch, dizzy, chewA/B, smug,
  talkA/B, squint, shock. Variants via `EYES` table: `lid` (half-closed), `closed` (dark line),
  `chevron` (> <), `spiral`, `look`, `brow` tilt, `raise`.
- Extra face bits: nose hint, mouths, per-character marks (scar, freckles, blush, drop, mole).
- Face texture is drawn with `g.translate(0, 34)` so hair fringes don't cover brows.

### Accessories (`Hair.tsx`, `Hats.tsx`, `Character.tsx`)
- Hair: swept, spiky, bob, pompadour, bun, mop, flattop, braids, short, curly, long, receding, wavy.
- Hats: cap, fedora, beanie, goggles, headphones, badgecap, safari, schoolcap, headband, hardhat.
- `beard`, `mustache`, `glasses` (frame colour), `shades`, `earrings` props on Character.
- Hair/hats are modelled for a 1.2-tall head and lifted by `HEAD_H/2 - 0.6`.

### Lighting (always deliberate, per set)
- Every set: hemisphere fill + a **shadow-casting key** (`Shadowed` directional) + a **rim light** from
  behind (often cool/team colour) + a **soft front fill from the camera side** so faces read.
- Interiors need extra fill (rooms came out black at first). Practical lights (lamps, furnace, lightbox)
  as point lights + emissive meshes.
- Light that "tells the story": sun through blinds (striped), furnace glow, moonlight, floodlights, rain dim.
- Slight CSS grade on the composition: `saturate(1.05) contrast(1.05)`.

## Animation style

- **Spider-Verse-like 2.5D without effects**: characters animate **on twos** (`onTwos(frame)` → new pose
  every 2 frames) with eased key poses (`sample()` in `anim.ts`), while the **camera moves on ones**
  (smooth). User: "not too choppy, semi-smooth".
- Keyframe tracks: `Key = Partial<Pose> & {f, ease}`; eases inOut/out/in/linear/back/snap.
  Use anticipation (crouch/lean back before a jump), overshoot (`back`), holds, settle bounces,
  follow-through on limbs, head lolls, small breathing (`breathe()`).
- Pose joints: x,y,z, rotY, lean, twist, side, headX/Y/Z, armLX/LZ, armRX/RZ, legLX, legRX, face.
  Negative armX = arm forward/up; right arm outward = negative Z, left outward = positive Z;
  positive headX = look down; positive lean = tip forward.
- Sitting: `y = seat/scale - 2`, legs `-PI/2`. Lying: `y -1.5, lean -PI/2, legs -PI/2`.
- `walk()` helper makes walk cycles (optionally without arm swing); `stepFrames()` for footstep SFX.
- **Props held in hands use forward kinematics** (`handOf(pose, side, at, scale)`) so pitchers, glasses,
  balls, coins, cups stay locked to hands, and objects can be placed exactly where a hand reaches.
- Face swaps happen instantly (all expressions pre-drawn per character).
- Camera: per shot `Cam` with p0→p1 and t0→t1 eased by sine, optional decaying `shake` on impacts.
- Hard cuts every ~1–3 s for retention; cut 2 frames before each line starts. Cut on exact words for
  punchlines (e.g. reveal on "Lionel"). Use callbacks (end returns to the hook location).

## Camera rules for 9:16 (learned the hard way)

- Horizontal FOV is narrow: hfov ≈ vfov × 0.56. To fit an adult with arms (≈4 wide) the camera must be
  **~11–12 units away** at fov ~42; a face close-up ~3–4 units. Most early shots were far too close.
- Always check nothing stands **between the camera and the subject** (cameras ended up inside Mom,
  behind a hat, inside a robe). Move people off the camera line or move the camera.
- Characters 4 wide → space them ≥4.5 apart or stagger in depth.
- R3F aims the default camera at the origin — always call `camera.lookAt` (Cam does).

## Captions

- **One word at a time**, held until the next word (no flicker). Inter Bold 700, normal case,
  ~118 px, white, 10 px black stroke + soft shadow, small spring pop. Gold + bigger for key names
  (`GOLD` set in `CaptionsFor`). Placed at top ≈1180 px (below centre, clear of Shorts UI).
- Component: `CaptionsFor` in `src/lebron/common.tsx` (takes a timing JSON).

## Audio pipeline

1. User sends ElevenLabs mp3 (upload path given in the message).
2. Word timings: `pocketsphinx` (installed) — script in scratchpad `asr.py` pattern:
   `Decoder(samprate=16000)`, `d.seg()` with `start_frame/end_frame` (centiseconds).
3. Write `tools/scripts/<name>.json` with each script line's original start/end, word anchors for exact
   cuts, `gap` and `keepGapBefore` (dramatic pauses).
4. `python3 tools/prep_vo.py <mp3> tools/scripts/<name>.json <name>` → polishes voice (HPF, presence,
   compression, **-16 LUFS**), **removes dead air** (pauses → `gap`, default 0.2 s), writes
   `public/vo/<name>.wav` and `src/<name>/timing.json` (lines + word times).
5. SFX are **synthesized** in `tools/make_sfx.py` (no samples/licences): ambience, whoosh, swish, hit,
   thud, step, crowd, buzzer, netswish, bounce, shutter, riser, boom, crunch, munch, gulp, coins, pour,
   ice, glass, whistle, clang, crickets, engine, kick, rain, firework, ding, tick, scribble, etc.
   Music beds are synthesized too (`bed`, `bed_messi`): a pad that builds, drums enter at the turn,
   thin for the low point, lift for the climax, **silence before the name reveal, boom on the name**.
   Retime bed moments to the new line times whenever the VO changes.
6. Mix in the composition with `<Sequence from><Audio volume>` cues; quiet whoosh on every cut.
7. After rendering, limit peaks without re-rendering video:
   `ffmpeg -i in.mp4 -c:v copy -af "alimiter=limit=0.85:level=false" -c:a aac -b:a 192k out.mp4`.
- Never use copyrighted source audio (e.g. anime dubs); synthesize SFX instead.

## 3D text and shirts

- `tools/make_font3d.py` converts `InterDisplay-Black.otf` → `public/fonts/inter_black.json`
  (three.js typeface). `BlockText` (`src/BlockText.tsx`) = extruded, bevelled text.
  **Preload with `useBlockFont()` at the composition level** before mounting scenes (see below).
- `tools/make_shirts.py` draws templates at 4× and downsamples. Helpers: `T` (fill, vgrad, line, poly,
  dot, soft `folds`), `kit()` football shirts (stripes/halves, numbers, robe), `jersey()` basketball
  tanks, `check_shirt()`, `plain()`. Run `python3 tools/make_shirts.py messi` / `lebron` / (none) for sets.
- User-supplied Roblox templates live in `public/shirts/*.png` (pilot, plaid, scifi, bluejacket,
  jersey05, racing07, baseball, varsity, tiedye, wings, suit).

## Building a new video (workflow that worked)

1. **Script** (if asked): hook in the first line, rising stakes, a dip, payoff + name reveal, callback last
   line. Provide fact-check notes. No break tags.
2. **Storyboard** in `docs/<name>-storyboard.md`: cast table (height + unique features), and per scene:
   time, VO line, place + props/details, action/camera, light, sound. Plan the sound bed arc.
3. VO prep (above).
4. Wardrobe: new templates per character; preview contact sheet.
5. Sets file (`src/<name>/sets.tsx`): each set has its own lights, `Sky`, and many props.
6. Shots file: one component per shot, `SHOTS` list with `from` frames, `ShotCanvas` per `Sequence`.
7. Test with stills: bundle once, render chosen frames, make a contact sheet, **look at it**, fix, repeat.
8. Full render in the background; then contact sheet at 1 fps to verify; limit audio; send; commit/push.

### Commands

```bash
npx remotion bundle src/index.ts --out-dir=out/bundle --log=error
npx remotion still out/bundle <Comp> out/frames/x.png --frame=N --browser-executable=/opt/pw-browsers/chromium --gl=swangle --log=error
npx remotion render out/bundle <Comp> out/<name>.mp4 --browser-executable=/opt/pw-browsers/chromium --gl=swangle --concurrency=4 --crf=18 --log=error
ffmpeg -i out/<name>.mp4 -vf "fps=1,scale=150:-1,tile=12x5" -frames:v 1 out/check/sheet.png   # verify
```
- ~4 s per still; full 60 s vertical render ≈ 25 min (run in background).
- `out/` is git-ignored (renders aren't committed).

## Technical pitfalls (each one bit us once)

- **Async assets must load before the ThreeCanvas mounts.** ThreeCanvas only redraws on frame change, so
  textures/fonts that arrive later never appear. Load shirts (`useShirts`) and the 3D font
  (`useBlockFont`) in the composition with `delayRender`, return null until ready.
- **`<color attach="background">` / `<fog>` inside a `<group>` does nothing.** Use the `Sky` component
  (sets `scene.background`/`scene.fog` directly).
- Remotion can't download its own Chrome (remotion.media blocked) → always pass
  `--browser-executable=/opt/pw-browsers/chromium --gl=swangle`.
- Python edits via `str.replace` with `assert a in s` — if an assert fails, nothing is written; re-check
  the exact current text.
- **Glitched frames** (one corner of the frame tiled over the image) now appear in every HD render in this
  container, at any `--gl`/concurrency; stills are clean. Fix after rendering:
  `python3 tools/fix_frames.py out/bundle <Comp> raw.mp4 final.mp4` (re-renders bad frames as stills, keeps audio, limits peaks).
- `spotLight target-position` doesn't work in R3F; spotlights aim at the origin.
- Big crowds: use `instancedMesh` (`Crowd` in `src/messi/sets.tsx`).
- `RoundedBoxGeometry` keeps BoxGeometry face groups, so 6-material shirt mapping works on it.
- Character `img` must be passed; shirt PNGs are cropped per face into CanvasTextures (skin underneath).

## New tools (installed, tested)

- **Post-processing** (`@react-three/postprocessing`): `EffectComposer` with `Bloom` (glowing screens,
  lamps, lasers; give emissive materials `toneMapped={false}`), `Vignette`, DOF, SSAO, noise.
  **Always add `<Redraw />` from `src/fx.tsx` as the last child of the ThreeCanvas**, or frames render blank.
  The `Outline` effect and drei `<Outlines>` don't show in our renders; use `HullBox` (inverted hull).
- **drei** (`@react-three/drei`): ContactShadows, Sparkles, Clouds, Sky, MeshReflectorMaterial, etc.
- **Physics** (`@dimforge/rapier3d-compat`): init with delayRender, then re-simulate from 0 to the
  current frame each render (deterministic). Example: `src/lab/FxTest.tsx` (`FxTest` composition).
- **pedalboard** (Python): reverb/delay/EQ/compression for SFX and music beds.
- **Whisper word timings**: `python3 tools/words.py <audio> [out.json]` (faster-whisper small.en, CPU).
  Use instead of pocketsphinx for exact word cuts.
- **Scratch voice**: `python3 tools/scratch_vo.py tools/scripts/<name>.json <name>` → Piper voice
  (`tools/get-voices.sh` downloads it) + Whisper timings → `public/vo/<name>.wav` + timing.json
  (marked `scratch`). For test cuts only; the final voice is still the user's ElevenLabs take.
- Hugging Face is allowed in the environment now. Set `HF_HUB_DISABLE_XET=1` (words.py does) since the
  xet download host is blocked.

## Environment notes

- Cloud container, no GPU. Chromium + Playwright preinstalled. Python 3.13 with numpy, PIL,
  pocketsphinx, fonttools. ffmpeg 6.1. Fonts: Inter / Inter Display (all weights), DejaVu.
- Network is **unrestricted** now (user granted full access). Free asset sites work (Poly Haven, ambientCG —
  CC0 textures/HDRIs/models). Still prefer procedural assets for the house style; check licences on anything downloaded.
- GitHub pushes work now (Claude GitHub App connected for `gheddoey/Vids`).

## Content rules

- Biography shorts about real people are fine; keep them respectful and factual, flag facts to verify.
- No team/league logos or trademarks on shirts (colours + numbers only); generic magazine/sign names.
- **Magazine covers / social posts (user's choice, Nov 2026):** look up the REAL one online and either
  (1) rebuild it faithfully in 3D (`src/covers/Covers.tsx` `ChosenOneCover`: same layout, pose, colours,
  headline, cover lines, date; only the masthead name changes), or (2) use the real image crushed to a
  64-px texture (`tools/pixel_cover.py` → `public/covers/*.png`, shown with `PixelMag`). **Use a mix in every video:** some
  covers/posts as real 64-px decals, the key ones (story beats) hand-crafted in 3D, improving the
  recreation each time (keep arms inside the cover, closer pose/likeness). Option 3 (real image,
  full detail) is saved for later. Never commit the full-res originals; check the real thing for accuracy
  (the 2002 cover jersey is WHITE with green "IRISH 23", not green).
- Homages of existing scenes: build our own characters/designs and audio; no copied dialogue/audio.

## Retro "six rules" look (src/ps1/)

- Rules: low poly + flat shading; 64-px textures painted by code (`tex64`, nearest filter); render in
  HD but never smooth a texture pixel; snap vertices to a virtual grid + Bayer dither (`PS1Pass` patches
  every material via `onBeforeCompile`); slice something open and label one part; a new pose per sentence.
- **User preferred "HD retro" over true 270×480**: render 1080×1920 with antialias; retro grain comes from
  the snap grid (`GRID` 360×640) and dither in 3×3-px cells (`U.cell`), plus a soft vignette.
- Low-res moments if ever needed: `gl.setPixelRatio(1/k)` + `image-rendering: pixelated` (R3F `dpr` did nothing).
- `tools/draft_timing.py` makes a placeholder timing.json from a script (same format as prep_vo.py).
- `python3 tools/make_sfx.py name1 name2` regenerates only those sounds.
