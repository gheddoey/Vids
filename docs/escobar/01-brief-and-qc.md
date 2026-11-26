# Escobar v2: project brief + QC of v1

## Project brief
| | |
|---|---|
| Subject | Pablo Escobar (1949–1993): from Medellín hustler to cartel boss; the cost; his death; the hippos that outlived him |
| Audience | YouTube Shorts viewers, 13+, curious and casual; no prior knowledge assumed |
| Platform / format | YouTube Shorts, 1080×1920, 30 fps, ~65 s (locked to the existing VO) |
| Narration | Locked: ElevenLabs "Chuck Miller" take, 23 lines (`src/escobar/timing.json`) |
| Structure | Hook (hippos) → origins → rise (cocaine, money, zoo, Congress) → the cost → prison/escape → death → name → callback (hippos) |
| Tone | Factual, cinematic, never glamorous; violence implied only |
| Style | Six rules + cinematic GTA-like grade + smooth transitions (see `CLAUDE.md`) |
| Key characters | Pablo at 4 ages (boy, teen, 1970s, 1980s/1993), parents, brother Roberto, police, politicians |
| Key locations | Magdalena river, Medellín hillside barrio, market, alley, police records room, jungle airstrip, counting room, Hacienda Nápoles, Congress, night city, La Catedral, Los Olivos rooftops |

## QC of v1 (checked at 1 fps, both halves)
**Strong, keep:** the real 1976 mugshot on the cork board, the cash‑brick slice + label, the 80% flight lines, the candles, the birthday cake, the name in the dark, the Congress shot, the transitions.

**Problems, by shot**
1. **Hook river:** the water reads as grass (flat green), with no ripples, sparkle or reflections. The hippos read as grey boxes from this angle: not enough hippo silhouette (eyes, ears and nostrils above the waterline).
2. **Gate pull‑back:** confusing. Pillars plus a fallen log don't say "one man put them there". It needs the hippos leaving the ranch, or the ranch sign.
3. **Family:** a static line‑up facing the camera, with the father's hoe pose awkward. "Medellín" isn't conveyed: no hillside city, no barrio.
4. **Market:** an empty market with no background activity; the cartons are too small to read.
5. **Alley:** back to camera and dark; the motive is unclear.
6. **"Cocaine." door:** a plain grey slab. Nothing is communicated. Needs a factual, non‑glamorous image (wrapped packages in crates, a truck being loaded).
7. **Airstrip:** the plane is fine, but there's no activity (loaders, a fuel truck, dust).
8. **Map:** the shape doesn't read as the Americas; it needs a better outline and 3D labels (COLOMBIA, USA).
9. **Rich list:** the issues are hard to read and the open page is blown out.
10. **Counting room:** Roberto is static, and the room lacks motion (machines, falling notes).
11. **Ranch:** an awkward T‑pose, and the gate plane is too small.
12. **Zoo:** OK; the hippos are clumsy.
13. **Smoke:** cartoony fire blobs. "Bombings" is nearly black.
14. **Seats:** reads oddly (a white wall); needs an aircraft cabin feel.
15. **La Catedral:** a brick wall only; it doesn't read as a hilltop "luxury prison".
16. **Rooftop:** the tiles look like a flat red carpet; the pose is stiff; the police are far away.
17. **Name:** the caption "Escobar." overlaps the 3D name.
18. **Ruins:** unclear.
19. **Yawn:** the hippo face reads as a box.

**Global problems**
- **Characters:** stiff, mostly front‑on line‑ups; little secondary or ambient motion (weight shifts, head turns, gestures).
- **Environments:** almost no ambient motion (no clouds, birds, foliage sway, water ripples, dust, smoke, background people).
- **Depth:** little atmospheric depth or haze layering; no depth of field on close‑ups.
- **Exposure:** several shots too dark (the door, Bombings, the alley).
- **Captions:** they sometimes collide with 3D text.
- **Technical:** about 35% of frames came out tiled in the render and had to be repaired; it was repaired, but it costs about an hour.
