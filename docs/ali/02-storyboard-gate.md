# Muhammad Ali — storyboard (as built) + quality-gate log

VO: user's ElevenLabs take (Mike), 61.9 s → 58.1 s after dead-air removal (`src/ali/timing.json`).
Composition `Ali` (`src/ali/Ali.tsx`), 1756 frames. Cast `src/ali/cast.ts` (trunks + bare-torso rig added
to `lowpoly/Rig`), sets `src/ali/sets.tsx`, props `src/ali/props.tsx`, bed `bed_ali` (make_sfx).

| # | Words | Location (FG/MG/BG) | Action / acting | Camera | Tr |
|---|---|---|---|---|---|
| 1 | Louisville, 1954 | Columbia Auditorium: parked 50s cars, kiosk / bike in the rack, the kid / brick facade, marquee, bunting, shops, autumn trees, falling leaves | the kid parks and runs in, happy | crane down | — |
| 2 | Someone steals… bike | same | the thief rides off (on ones) | pan with the bike | cut |
| 3 | …tells a cop… whup the thief | same, cut chain on the empty rack | shock → fury; punches the air on "whup"; Officer Joe Martin amused | push-in, shake on "whup" | cut |
| 4 | The cop runs a boxing gym | basement gym: bags, speed bag, small ring, lockers, light shafts | Martin offers gloves; kids train in BG | two-shot | whip |
| 5 | Learn to fight first, he says | bench | **SLICE IT OPEN:** the glove cut in half → "HORSEHAIR" | macro | zoom |
| 6 | Six years later… Olympic champion | Rome: ribbed dome, ring, podium, crowd | arms up on "Clay", medal | push | fade |
| 7 | At twenty-two… most feared man | Miami ring, smoke, press row | Clay dances; Liston's stare (close); Liston quits on his stool; Clay to the ropes shouting | wide → Liston CU → wide | whip |
| 8 | Then he changes his name… | press room, a dozen mics, flashbulbs | "my name is Muhammad Ali" mouthed; 3D name lands | slow push | flash |
| 9 | …the Army drafts him… step forward | induction hall, yellow line, blinds, flag, clock | the others step forward, he stays; they turn to look | from behind the officer, push | cut |
| 10 | strip his title / license / five years | courtroom | the belt slides away; the licence tears; gavel | inserts → wide | dip |
| 11 | The man who'd fight anyone… refused | the empty gym at night, the calendar flips 1967→1970 | shadowboxing alone, stops, sad | push to CU | dip |
| 12 | He comes back slower… first loss | Madison Square Garden, flashbulbs | Frazier's left hook (on ones, impact frame, squash); Ali hits the canvas | wide → low | whip |
| 13 | Months later… eight to nothing | Supreme Court: columns, curtain, 9 chairs, one empty (Marshall recused) | the justices; 3D "8 - 0" | push | flash |
| 14 | Zaire, 1974… punch himself out | Kinshasa open-air stadium: floodlight towers, palms, haze, 60k crowd | rope-a-dope: ropes bow, Foreman pounds, Ali taunts | aerial → side profile | zoom |
| 15 | knocks him down… Champion again | same | the right hand (on ones), Foreman spins down; Ali arms up shouting | profile → low hero through the ropes | cut |
| 16 | Twenty-two years later… Olympic flame | Atlanta stadium at night, cauldron tower | trembling hand + torch (procedural tremor), lights it; fire climbs | wide → CU → tower | dip |
| 17 | He never found the kid who stole his bike | Louisville at dusk, the empty rack, the cut chain | (no one) | slow push | fade |

## Gate log (stills from the real cameras)
1. Pass 1: FAIL on most shots: parked car in FG, cameras inside props/torso, title cut, belt/licence unreadable, Kinshasa fighters facing away from each other.
2. Pass 2: street, Rome, press, exile, Frazier, Supreme Court, rack PASS; fights + inserts still FAIL.
3. Pass 3–4: slice, name, licence, belt, Liston, Atlanta PASS (face lights motivated: torch, ring fill).
4. Kinshasa: debug renders (top-down, wide lens) showed the framing was right but the diagonal angle
   over Foreman's back made it unreadable; the rope-bow was on the wrong side → side-profile cameras,
   rope fixed → PASS; "Champion again" camera moved out of Ali's back → PASS.
