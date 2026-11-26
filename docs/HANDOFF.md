# HANDOFF: read this first in a new conversation

Repo: `gheddoey/Vids`, branch **`ccr-57de31c0-kzppxs`** (all work is pushed here; `CLAUDE.md` still names an old branch).
Full detail is in `CLAUDE.md`, `docs/PRODUCTION-SYSTEM.md` and `docs/SET-DESIGN-DIRECTIVE.md`. This page is the compact version.

## What we make
Blocky (Roblox R6‑style) animated **YouTube Shorts**, 1080×1920, 30 fps, built with Remotion + Three.js (R3F).
The user works from a phone: short replies, send renders with SendUserFile. Feedback is blunt; take it literally.

## The user's standing rules (all still apply)
1. **Six rules** (`docs/six-rules.jpg`): low poly (~300 tris/character, flat shading) · 64‑px textures painted by
   code · render 270×480 / no smoothing (we use the HD‑retro look: native 1080p, vertex snap on a 360×640 grid, 3‑px
   Bayer dither) · snap vertices + dither · **slice something open and label one part** (once per video) · **a new
   pose on every sentence**.
2. **Production system** (`docs/PRODUCTION-SYSTEM.md`): 9 stages per video: brief → research (source register,
   reliability, asset/licence register) → script treatment → full storyboard (camera, 3 motion layers, light, SFX,
   assets per shot) → assets → animation → edit → QC → export + production report. Docs go in `docs/<video>/`.
   Never fabricate facts; never claim a tool or render that didn't happen.
3. **Set‑design directive + quality gate** (`docs/SET-DESIGN-DIRECTIVE.md`). The user is unhappy that sets look like
   "basic game maps". Every location must be a **complete feature‑film set** with **foreground / midground /
   background**, real architecture, floor *and* ceiling, varied materials (wood grain, brick, concrete, metal, glass,
   fabric, wear), story lighting (key/fill/rim/practicals, interior ≠ exterior), purposeful ambient motion, directed
   blocking (no lines of people facing camera) and varied cinematic cameras with foreground framing.
   Per environment: analyse → design plan → layout → FG/MG/BG → asset list → build → light → block → camera →
   ambient → **render a preview from the real camera, inspect it, revise until it passes**. Keep the blocky identity.
4. **Look:** the cinematic GTA‑like grade `CineGrade` (`src/cine/Cine.tsx`) is the last child of every canvas;
   strong warm key, low ambient, hot rim; **smooth transitions** (fade/whip/zoom/dip/flash; see `layerStyle` in
   `src/escobar/Escobar.tsx`).
5. **Characters:** `src/lowpoly/Rig.tsx` (64‑px painted, R6 proportions, unique features, different heights, a
   different pupil colour each). **Facial hair: stubbly, a mix of hand‑drawn and 3D** (`stubble` paint/3d,
   `mustache3d`, `beard3d`). Add life (blinks and idle motion, `life()` in `src/escobar/kit.tsx`).
6. **Covers/posts:** look up the real one; use a mix of real 64‑px decals (`tools/pixel_cover.py`) and improved
   hand‑crafted 3D recreations (only the masthead name changes). Never commit full‑res originals.
7. **Other:** always remove dead air; plan first (storyboard); dense, lived‑in sets; no flat graphics (3D text and
   objects only); new wardrobe per video; check facts; scripts with no `<break>` tags (~2.9 words/s); commit and
   push after each step.

## Pipeline commands
- **Voiceover:** `python3 tools/words.py <mp3> words.json` (Whisper) → `python3 tools/align_vo.py
  tools/scripts/<n>.json words.json` → `python3 tools/prep_vo.py <mp3> tools/scripts/<n>.json <n>` (removes dead air,
  writes `public/vo/<n>.wav` and `src/<n>/timing.json`).
- **SFX/music:** synthesized: `python3 tools/make_sfx.py name1 name2`.
- **Render:** `npx remotion bundle src/index.ts --out-dir=out/bundle --log=error`, then `remotion still|render … --browser-executable=/opt/pw-browsers/chromium --gl=swangle`.
- **Repair:** HD renders glitch (tiled frames; now about 35% with transitions and the grade). Always run
  `python3 tools/fix_frames.py out/bundle <Comp> raw.mp4 final.mp4`. A full render plus repair takes about 1.5 h.
- **Tools available:** postprocessing (needs `<Redraw/>`; CineGrade includes it), drei, Rapier physics,
  pedalboard, Whisper, a Piper scratch voice, unrestricted network.

## Status
- **Done:** `LeBron2` (six‑rules remake; render not redone with the new lighting, per the user), `Escobar` v1
  (sent), cover tools, CineGrade, the transition system.
- **In progress: Escobar rework (v2 → v3).**
  - Docs: `docs/escobar/01-brief-and-qc.md` (v1 QC), `02-research.md` (sources, reliability, asset register),
    `03-storyboard-v2.md` (26 shots, full fields).
  - Built (uncommitted parts are committed as of this handoff): `src/escobar/kit.tsx` (clouds, birds, motes, smoke,
    living water, ripples, HippoV2, Piper Super Cub, BrickHillside, `life()`), new sets (Warehouse, Cabin,
    Rooftops2, Nápoles with Super Cub + ruins, better map), shots v2 in `src/escobar/Escobar.tsx`.
  - v2 preview stills were checked: better, but the user then issued the set‑design directive, so **v2 is not good
    enough**.
- **Next:**
  1. Build a shared environment library (richer materials, architecture, interiors with ceilings, vegetation, streets).
  2. Redo each Escobar location through the quality gate, one at a time, with rendered previews: River (shots 1, 26)
     → Nápoles (2, 13, 14, 25) → Medellín hillside home (3) → market (4) → alley/warehouse (5, 7) → police records
     room (6) → airstrip (8) → map (9) → rich‑list desk (10) → counting room (11, 12) → Congress (15) → night city
     (16, 17, 19) → 727 cabin (18) → La Catedral (20, 21) → Los Olivos rooftops (22) → cake room / void (23, 24).
     Record each plan and gate result in `docs/escobar/04-environments.md`.
  3. Then render, repair, QC and write the production report.
- **Open:** the user mentioned reference images (a courtroom, an outdoor character scene, a bar scene) that
  **were never received**. Ask them to re‑send.
- The VO for Escobar is locked (Chuck Miller take, 65.3 s, `src/escobar/timing.json`).
