# "Grand Theft Origins": storyboard (plan, v1)

Vertical Short, 1080×1920, 30 fps, target ≈ 62–66 s after dead-air removal.
Everything in this video is **new**: new rigs' clothes, new sets, new props, new animations, new
music bed. Nothing reused from LeBron / Messi / IcedTea / LastSlice.

## Ground rules (IP)
- Real people (DMA team, Houser brothers) are drawn in our blocky style.
- **No game characters** (no protagonists, no Lemmings creatures). In-game moments use our own
  generic "Player" (plain grey hoodie, no face details beyond the house style) and our own cars/cops.
- **No real logos.** The title is our own design: chunky **asphalt-black block letters with a chrome
  bevel and a yellow road-stripe underline**, set in Inter Display Black, stacked GRAND / THEFT / AUTO.
  Not the real font, not the real boxed layout.
- No game music; our own synthesized bed.
- Era looks are evoked by setting, palette, cars and narration only.

## Script (send to ElevenLabs, voice "Mike")
See bottom of file. ~188 words → ≈ 65 s raw, ≈ 60–63 s tightened.

## Cast

| Who | Height (scale) | Unique features | Wardrobe (new templates) | Pupils |
|---|---|---|---|---|
| David Jones (founder) | 1.00 | Short dark side-parted hair, thin rectangular glasses | Navy 80s jumper with a cream zig-zag band, collar poking out | grey-blue |
| Mike Dailly (programmer) | 0.98 | Short beard, chunky over-ear headphones | Faded red band-style tee (our own band name "DUNDEE DRIVE") over a long-sleeve | green |
| Tester "Ali" | 0.92 | Beanie, freckles | Tie-dye-free striped rugby shirt, orange/green | brown |
| Tester "Fi" | 0.88 | Bob haircut, big hoop earrings | Oversized denim jacket, patches | hazel |
| Tester "Rab" | 1.05 | Spiky ginger hair, gap tooth | Flannel shirt open over white tee, energy drink in hand | blue |
| Publisher exec | 1.08 | Slick back hair, square jaw, mole | Grey double-breasted suit, red power tie | black |
| Publicist | 1.02 | Silver hair, tan, big grin | Cream suit, open collar, gold chain, phone brick | amber |
| Politician | 1.06 | Bald with side fringe, huge white mustache | Dark three-piece with pocket watch chain | pale grey |
| Newspaper reader 1 (mum) | 0.96 | Curlers, cat-eye glasses | Floral housecoat | blue |
| Newspaper reader 2 (grandad) | 1.00 | Flat cap, monocle | Tweed jacket with elbow patches | brown |
| Sam Houser | 1.02 | Backwards cap, stubble | Black bomber jacket, white tee | dark brown |
| Dan Houser | 1.00 | Curly hair, round glasses | Navy hoodie under a corduroy blazer | green-grey |
| "Player" (in-game stand-in) | 1.00 | No hair (hood up), plain | Grey hoodie, jeans | white-ish |
| Shop clerk (launch night) | 0.95 | Lanyard, nose ring, high ponytail | Shop polo, generic store name "GAME STOP N GO"→ use **"PIXEL PIT"** | violet |
| Queue fans (6–8) | 0.7–1.05 | Kid on dad's shoulders, onesie guy, cosplay-free | Mixed new tees | mixed |

## New animation library (to build in `src/gta/moves.ts`)
- `type()` fast keyboard hammering (arms alternate on twos), `sip()` mug to mouth,
  `lean_back_laugh()` (head back, belly shake), `double_over()` laugh, `facepalm()`, `head_on_desk()`,
  `paper_shake()` furious newspaper read, `podium_pound()` politician fist-bang, `phone_brick()` talk
  with free hand gestures, `high_five()` (two-actor, hand contact locked by FK), `queue_shuffle()`,
  `jump_cheer()`, `point_at_screen()`, `shrug()`, `snap_finger()`.
- Vehicles: `drive(path)` with body roll + pitch on braking, `drift()` with yaw overshoot,
  `ram()` impact + crumple squash and spark burst, `hop()` (lowrider bounce), siren light bar
  (alternating red/blue point lights), wheel spin.

## Sound bed arc (`bed_gta`, synthesized)
1. Hook: dead quiet + police siren doppler, crunch on the ram.
2. Dundee: **chiptune** square-wave arpeggio over rain ambience (fits 1988 computers).
3. Race'n'Chase: chiptune slows and detunes on "boring" (pitch-drop "wah").
4. Bug: record-scratch → **breakbeat drums kick in** with siren stabs.
5. Near-cancel: drums drop, lone low pad, clock ticks.
6. Outrage: stomping drums + crowd murmur + newspaper rustles.
7. New York: boom-bap loop, city ambience, taxi horn.
8. 3D jump: big riser + whoosh, **full beat**.
9. Vice City: **synthwave** arps, gated snare.
10. San Andreas: laid-back West Coast groove (our own: sine bass slide, whistle-like lead).
11. $1B: coin cascade + cash register + crowd cheer, building riser.
12. **Silence** → **boom** on "Grand Theft Auto".
13. VI tease: dreamy sunrise synth, seagulls, waves.
14. Callback: siren returns, crunch, cut to black on a final bass hit.
Quiet whoosh on every cut. VO at −16 LUFS, bed ducked under VO.

## Shots (times are estimates; retimed to the real VO)

### 1. Hook — "The biggest game series on Earth only exists because of a bug." (0.0–3.6)
- **1a** (0.0–1.6) Top-down diorama city at night: grid streets, tiny block buildings, our grey
  player car. A **cop car** (black/white, light bar flashing) swerves in and RAMS it. Sparks, shake.
  Camera straight down, slight rotation. Light: streetlamp pools, siren red/blue spill.
- **1b** (1.6–3.6) Low 3D angle on the wreck: cop car's bumper crumpled, a block "BUG" glitch pixel
  cluster (3D voxel cubes) fizzles off the car. Camera pushes in. Steam rising.

### 2. Dundee — "Dundee, Scotland. 1988." (3.6–5.4)
- Exterior: grey sandstone tenement street, **rain**, puddles with reflections, red phone box,
  a bus stop with a 3D timetable, chip-shop sign ("THE GOLDEN FRYER"), parked boxy hatchback,
  seagull on a bin. 3D block caption "DUNDEE 1988" sitting on the pavement like a kerb.
  Camera cranes down from rooftops. Light: overcast blue-grey, warm windows.

### 3. "A young programmer named David Jones starts a tiny studio called DMA Design." (5.4–9.6)
- **3a** Interior studio: cramped room, beige computers with chunky CRTs (screens emissive green),
  floppy-disk stacks, coiled cables, corkboard with index cards, tea mugs, biscuit tin, radiator with
  socks drying, rain-streaked window. David types fast (`type()`), pushes up glasses.
- **3b** Door sign being screwed on: 3D block plaque "DMA DESIGN". Mike walks in with headphones and two teas.

### 4. "Their first big hit? Lemmings. Millions of tiny walkers, marching off cliffs." (9.6–13.6)
- **4a** Over-shoulder onto a CRT; inside the screen (rendered as a mini 3D diorama behind glass)
  **our own** tiny walkers (orange hard-hat block critters) march off a cliff. No real Lemmings design.
- **4b** Zoom out: the same tiny critters now pour off David's desk edge into a box of game
  cartridges labelled "MILLIONS SOLD" (3D numbers ticking on a flip counter). David and Mike high-five.

### 5. "Then they try something new. A top-down cops and robbers game called Race'n'Chase." (13.6–17.8)
- Big table **diorama city** (the game as a physical model): roads, crossings, little cops and our
  grey car. Testers crowd round with controllers. Camera orbits overhead. Whiteboard behind with
  scribbled 3D-marker arrows. 3D block title on a sticky note: "RACE'N'CHASE".

### 6. "One problem. It's boring." (17.8–19.4)
- Close-ups, quick: Rab yawns, Fi chin-in-hand, Ali asleep on a pizza box. The tiny car drives in
  a perfect boring square. Camera locked, very still (comic contrast). Chiptune detunes.

### 7. "Until a bug changes everything." (19.4–21.4)
- CRT screen glitch: voxel cubes burst, screen flickers red. Record scratch. Everyone's head snaps up.

### 8. "The police cars go crazy, ramming the player off the road." (21.4–24.6)
- In the diorama, every cop car turns at once (eyes-on-car headlights flare), chases, RAMS the
  grey car off the road into a hedge. Sparks, dust, camera shakes and whips with the chase.

### 9. "The team should fix it. Instead, they laugh, and keep it." (24.6–28.0)
- **9a** David reaches for a 3D "FIX" sticky note… pauses.
- **9b** The whole room cracks up: `lean_back_laugh`, `double_over`, Rab sprays energy drink.
  David crumples the note and tosses it over his shoulder into the bin. Camera dollies back.

### 10. "Chaos becomes the game." (28.0–29.6)
- Diorama goes full chaos: cars flipping, a fire hydrant spraying, a tiny explosion puff, the camera
  spins over it. Breakbeat in.

### 11. "But the project drags on, and the publisher almost pulls the plug." (29.6–33.4)
- **11a** Wall calendar pages flipping (3D pages flying off), clock spinning, pizza boxes stacking up.
- **11b** Glass-walled London boardroom, rain outside: exec stands and **yanks a giant plug** from a
  wall socket — the DMA desk lamp across town flickers off. Cold top light.

### 12. "So they lean into it. A publicist stirs up outrage on purpose." (33.4–36.6)
- Publicist in cream suit on a brick phone in a sunny office (blinds striped light), feet on desk,
  grin, snaps fingers. Fax machine spits out paper.

### 13. "Newspapers rage. Politicians complain." (36.6–39.4)
- **13a** Newsstand: 3D tabloid headlines on stacked papers: "BAN THIS GAME!", "OUTRAGE!",
  "SHAME!" (generic paper names "THE DAILY BLARE", "MORNING HOWL"). Mum in curlers shakes paper;
  grandad's monocle pops.
- **13b** Wood-panelled chamber, green benches: politician pounds podium, mustache flaps.

### 14. "And the game flies off the shelves." (39.4–41.2)
- Shop shelf: boxed games (our own box art: block cop car + road stripe) literally fly off,
  spinning into hands. Till drawer bangs open. 3D "1997" price-tag hangs on the shelf edge.

### 15. "In New York, the Houser brothers start Rockstar Games." (41.2–44.6)
- 1998 New York loft: brick walls, big arched windows on skyline, water tower outside, yellow taxi
  below, pizza box, record decks, boombox. Sam and Dan fist-bump; a neon-style 3D block star sign
  flickers on (our own star shape + "ROCKSTAR" block text, not the real logo).

### 16. "In 2001, the series goes 3D, and suddenly the whole city is yours." (44.6–48.2)
- **Signature move:** start top-down on the diorama, camera dives down into it and **tilts to
  street level** — the city scales up into a full 3D night city (lit windows, steam vents, el-train
  bridge, traffic). Player stands on the street, hood up, looks around. Riser + whoosh.

### 17. "Vice City. San Andreas." (48.2–50.6)
- **17a** Vice City vibe: pink sunset, palm trees, art-deco hotel with neon trim, pastel convertible,
  waves. Synthwave. (Generic, no characters.)
- **17b** San Andreas vibe: dusty sun-baked street, lowrider bouncing (`hop()`), BMX, palm silhouette
  hills, basketball hoop on a garage. (Our own designs.)

### 18. "Then, in 2013, part five makes one billion dollars in three days," (50.6–54.4)
- Midnight launch queue outside "PIXEL PIT" store: kid on dad's shoulders, onesie guy, clerk unlocks
  the shutter. A **3D flip-counter** on the roof rolls up to $1,000,000,000. Coins rain, confetti cannons.

### 19. "the fastest entertainment launch in history." (54.4–56.4)
- A generic trophy (3D, gold "RECORD" plinth) is set down on the counter; flashbulbs.

### 20. "The series is called…" (56.4–58.0) — near silence
- Black asphalt void, one streetlamp. Camera slowly descends. Siren faint and distant.

### 21. "Grand Theft Auto." (58.0–60.0) — BOOM
- Our block logo slams down onto the asphalt, road dust shockwave, stripe underline lights up,
  headlights sweep across, camera shake. Gold caption.

### 22. "And after thirteen years of waiting, the sixth one has finally arrived." (60.0–63.4)
- Dawn over a neon coastal skyline, flamingos lift off a lagoon, a huge chrome block **"VI"** rises out
  of the sea, water pouring off it. Warm pink/orange sun + cool cyan rim.

### 23. Callback — "And it all started with a cop car that wouldn't stop." (63.4–66.0)
- Back to the top-down diorama from 1a. The cop car rams again. Camera tilts up into the night sky.
  Bass hit, cut to black.

## Lighting per set (each gets hemi + shadowed key + rim + front fill)
| Set | Key | Rim | Practicals / mood |
|---|---|---|---|
| Diorama night | cool moon | red/blue siren | tiny streetlamp point lights |
| Dundee street | overcast soft | cool | warm shop windows, rain dim |
| DMA studio | window grey | warm lamp | CRT green glow, desk lamp |
| Boardroom | cold top | rain-blue | city bokeh blocks |
| Publicist office | sun through blinds (striped) | warm | |
| Newsstand | morning sun | cool | |
| Chamber | warm chandelier | green bounce | |
| Shop 1997 | fluorescent | | price-tag shine |
| NY loft | golden hour | orange | neon star |
| 3D city night | sodium street orange | cyan | lit windows, steam |
| Vice sunset | low pink sun | purple | neon trim |
| West Coast | hot noon | warm | heat haze tint |
| Launch night | storefront white | purple | counter glow |
| Logo void | single streetlamp | headlight sweep | |
| VI dawn | sunrise | cyan | |

## Facts to verify
- DMA Design founded 1988 in Dundee by David Jones. ✔ (widely documented)
- Lemmings released 1991, sold millions. ✔
- Race'n'Chase was the working title; the "aggressive police bug" origin story is told by the
  developers in interviews. ✔ (anecdote — phrased as a story)
- Development was troubled and nearly cancelled. ✔ (reported; phrased "almost")
- Publicist Max Clifford was hired to generate controversy; questions raised in UK Parliament. ✔ (not named in VO)
- First game released 1997. ✔
- Rockstar Games founded in New York in 1998 by Sam & Dan Houser and others. ✔ ("start" is a simplification)
- GTA III (2001) took the series to 3D. ✔
- GTA V (Sept 2013): $1B in three days, Guinness "fastest entertainment property to gross $1 billion". ✔
- GTA VI: released **19 Nov 2026** (PS5 / Xbox Series). ✔ (confirmed by user)

## Script (no break tags)

The biggest game series on Earth only exists because of a bug.

Dundee, Scotland. 1988. A young programmer named David Jones starts a tiny studio called DMA Design. Their first big hit? Lemmings. Millions of tiny walkers, marching off cliffs.

Then they try something new. A top-down cops and robbers game called Race'n'Chase. One problem. It's boring.

Until a bug changes everything. The police cars go crazy, ramming the player off the road. The team should fix it. Instead, they laugh, and keep it.

Chaos becomes the game. But the project drags on, and the publisher almost pulls the plug.

So they lean into it. A publicist stirs up outrage on purpose. Newspapers rage. Politicians complain. And the game flies off the shelves.

In New York, the Houser brothers start Rockstar Games. In 2001, the series goes 3D, and suddenly the whole city is yours.

Vice City. San Andreas. Then, in 2013, part five makes one billion dollars in three days, the fastest entertainment launch in history.

The series is called... Grand Theft Auto.

And after thirteen years of waiting, the sixth one has finally arrived.

And it all started with a cop car that wouldn't stop.
