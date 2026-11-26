# PS1 look — test short (storyboard)

Style test for the six-rule retro recipe. 270×480 render → 1080×1920 nearest-neighbour upscale, 30 fps, ~28 s.
VO is a **draft timing** (`tools/draft_timing.py`, 3.2 words/s) until the ElevenLabs take arrives; then
`prep_vo.py` replaces `src/ps1/timing.json` and everything re-times.

## The six rules → code
| Rule | Where |
|---|---|
| 1 Low poly, flat shading | `Pix` is 6 body boxes + 8 hair boxes (~170 tris). `ps1Patch` forces `flatShading` on every material. |
| 2 64-px textures painted by code | `tex64()` canvases (face per expression, shirt, sleeves, jeans+sneakers, planks, wallpaper, crate…), `NearestFilter`, no mipmaps. |
| 3 Render 270×480, no smoothing | Composition is 270×480, `antialias:false`, `dpr 1`; ffmpeg `scale=1080:1920:flags=neighbor`. |
| 4 Snap vertices, dither colours | Vertex shader snaps clip-space xy to the pixel grid; fragment shader 4×4 Bayer + 15 levels/channel. |
| 5 Slice it open, label one part | Shot 5: laser cuts Pix's head, halves part, 3D "BRAIN" label + pointer. |
| 6 New pose every sentence | Every line is a new key pose + hard cut; lines 7–9 are pure pose snaps. |

## Cast
| Who | Height | Features |
|---|---|---|
| Pix (narrator) | 1.0 | Spiky orange hair, freckles + rosy cheeks, green pupils, teal tee with pixel controller, yellow wristbands, red-striped sneakers |

## Shots
| # | Line | Place / props | Action / camera | Light | Sound |
|---|---|---|---|---|---|
| 0 | Six rules make anything look like a nineties video game. | Bedroom at night: CRT with static, console, cartridges, desk lamp, bed + quilt, window w/ moon, shelf, rug, beanbag, pizza box, soda, controller | Spins from CRT to camera, points; "6 RULES" 3D text pops; slow push-in | Warm key, cool moon rim, CRT blue + lamp practicals | whoosh, blip, chiptune bed starts (arp) |
| 1 | One. Low poly… | Green viewport studio, axis gizmo, low-poly rock/tree/gem | T-pose turntable, green wireframe on "Low" → off on "flat"; "300 TRIS" | Green rim | glitch, blip, drums enter |
| 2 | Two. Sixty-four pixel textures… | Orange studio, giant crate, paint cans | Paints with brush; crate texture fills row by row with a green scanline; "64px" | Warm | scribbles |
| 3a | Three. Render it tiny… | Purple studio, controller | Rendered at 1/3 res (90×160) — chunky; "270x480" | Purple rim | shrink, blip |
| 3b | No smoothing. | same | Cut on "No": close-up head shake, smug | | click |
| 4 | Four. Snap… dither… | Sunset studio, coloured pillars | Orbit; snap exaggerated to 4 px, then dither to 5 levels on "dither" | Pink rim | glitch ×2 |
| 5 | Five. Slice it open… | Night-blue studio | Laser sweeps down, head halves part on "open" (shock), BRAIN label on "label" (smug) | Red laser point light | laser, thud, ding; bed thins |
| 6–9 | Six… / Like this. / And this. / And this. | 4 coloured stages with glowing disc | Hands on hips → fist to sky → crane → dab, each a new camera angle | Per-stage rim | blip per pose, bed lifts |
| 10 | Now go make one. | Bedroom (callback) | Sits on beanbag with controller, points at camera, grin | Same as 0 | thud, coins, chiptune resolve |
