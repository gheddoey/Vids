# Pablo Escobar: The Rise and Fall — brief, script, storyboard

Source: the user's project file (Nov 26 2026). 60.0 s, 1080×1920, 30 fps, H.264. Cinematic 3D,
Spider-Verse-inspired acting (`docs/ANIMATION-DIRECTIVE.md`), full sets (`docs/SET-DESIGN-DIRECTIVE.md`),
six rules. Historical crime drama: factual, violence implied only, never glamorised.
Composition: `EscobarRF` (`src/escobarrf/`). Research: `docs/escobar/02-research.md` (rows 4, 11, 13, 14)
plus: surrender 19 Jun 1991 (A), escape 22 Jul 1992 (A, "a year later" ≈ 13 months), death 2 Dec 1993
Los Olivos (A), funeral 3 Dec 1993 drew thousands (A).

## Script (verbatim from the guide; beat-anchored)
| Beat | Time | Line |
|---|---|---|
| 1 Hook | 0.6 | In Colombia, one man would build an empire that shook the world. |
| 2 Rise | 6.4 | His name was Pablo Escobar. |
| 3 Empire | 11.4 | From humble beginnings, he rose to become the leader of the Medellín Cartel. |
| 4 Politics | 18.4 | He even entered politics, but his empire was built on more than money. |
| 5 Terror | 25.6 | It was built on violence, corruption, and fear. |
| 6 Escape | 33.4 | After surrendering in 1991, he escaped from prison a year later. |
| 7 Downfall | 40.6 | Now a fugitive, his empire was collapsing. |
| 8 Death | 48.4 | On December 2, 1993, Pablo Escobar was killed on a rooftop in Medellín. |
| 9 Aftermath | 55.2 | His empire was gone. But Colombia would live with its consequences for decades. |
~95 words in 60 s: the space between lines is carried by action, music and sound design (no frozen
holds). Scratch Piper voice until the ElevenLabs take arrives (lines can be re-anchored).

## Cast (profiles in `src/acting/profiles.ts`)
| Who | Height | Look | Acting |
|---|---|---|---|
| Pablo (1980s) | 1.0 | curls, 3D mustache, painted stubble, belly, **white open-collar shirt**, gold watch | `pablo`: controlled, smug, slow blinks |
| Pablo (fugitive 1993) | 1.0 | 3D beard, **blue shirt**, jeans, heavier | `pablo` posture + worried/tired faces |
| Bodyguard ×2 | 1.02 / 0.98 | dark shirts, cap / moustache | still, scanning |
| Politicians ×3 | 0.96–1.04 | suits, glasses, bald / grey | whisper, skeptical |
| Crowd extras | 0.8–1.05 | varied tees, hats | turn heads, walk |
| Police / Search Bloc | 1.0 | dark uniforms, caps | tense |

## Storyboard (FG/MG/BG per location; cameras; acting; light; sound)
| # | Time | Shot | Location (FG / MG / BG) | Action + acting | Camera | Light | Sound |
|---|---|---|---|---|---|---|---|
| 1a | 0–3.0 | Establishing | **Mirador**: barrio rooftop terrace / brick comunas / valley city, towers, mountains, sunset | city alive: lights flicker on, birds, laundry | crane down over rooftops (wide) | golden backlight, sun on the ridge | wind, distant city, pad starts |
| 1b | 3.0–5.6 | Back view | same terrace: plants, railing (FG) / Pablo from behind (MG) / city | Pablo breathes, weight shift, head turns slightly toward us; title PABLO ESCOBAR · THE RISE AND FALL (3D) | slow push past railing | rim on his curls | low hit on title |
| 2a | 5.6–7.0 | Medium | **Street**: shop awnings, parked 80s cars (FG) / crowd parts (MG) / brick buildings, power lines (BG) | Pablo walks through; people turn to look; bodyguards follow | backward dolly, low | late sun down the street | crowd murmur |
| 2b | 7.0–11.2 | Close-up | same | on "Pablo Escobar": he stops, turns to camera, slow smirk, eyes narrow; 3D name lands | push-in, slight low | warm key + rim | boom on the name |
| 3a | 11.2–14.0 | Aerial wide | **Hacienda Nápoles**: palms (FG) / white colonial mansion, pool, terraces (MG) / jungle hills, helicopter (BG) | helicopter crosses, staff, sprinklers, flags | aerial drift + tilt | high golden | rotor, birds |
| 3b | 14.0–18.2 | Medium wide | pool terrace | Pablo spreads his arms (proud sweep), then **SLICE IT OPEN**: the mansion wall cuts away to reveal stacked cash, 3D label "HIDDEN CASH" | orbit + push | golden | cash flutter, ding |
| 4a | 18.2–21.6 | Medium | **Congress chamber**: microphone stand cluster (FG) / Pablo at a lectern in a suit (MG) / tiered seats, members, wood panels, flags-free (BG) | he speaks (silent mouth over narration), deliberate gestures | slow push from a low angle | warm practical + window light | murmur, camera flashes |
| 4b | 21.6–25.4 | Reaction | same | two politicians whisper, one turns skeptical; Pablo's eyes slide to them, smile drops | OTS from behind members | same | whisper, flash |
| 5a | 25.4–29.0 | Wide | **Night street**: wet asphalt, debris (FG) / burning car, smoke (MG) / apartment blocks, police lights (BG) | fire, sparks, police lights sweep; silhouettes cross (no violence shown) | slow push, handheld | fire key, blue strobes | siren, fire crackle |
| 5b | 29.0–33.2 | Close-up | Pablo in a dark car interior, fire light on his face | cold stare, then looks away; jaw tight | locked, rack | fire through glass | heartbeat |
| 6a | 33.2–36.8 | Establishing | **La Catedral**: fence + guard tower (FG) / white prison blocks, pitch (MG) / city in the valley, helicopter (BG) | guards patrol, helicopter passes | high wide drift | dusk | rotor, dogs |
| 6b | 36.8–40.4 | Medium | back fence at night | Pablo slips through the cut fence, looks back (anxious), runs | low from outside the fence | moonlight, floodlight | crickets, steps |
| 7a | 40.4–44.2 | Medium | **Hillside hideout**: power poles, laundry (FG) / fugitive Pablo, beard, blue shirt (MG) / Medellín below, clouds (BG) | looks over his shoulder, worried, flinches at a helicopter | handheld, low | grey dusk | wind, distant heli |
| 7b | 44.2–48.2 | Close-up | same | tired eyes, slow blink, phone in hand | push-in | cold | low drone |
| 8a | 48.2–51.6 | Wide | **Los Olivos rooftops**: tile roofs, water tanks (FG) / Pablo silhouette on the roof (MG) / helicopter, sunset city (BG) | he climbs onto the roof, looks back | wide, slow | harsh sunset backlight | heli rising |
| 8b | 51.6–55.0 | Wide → black | same | police on the next roof; on "killed" cut to black (nothing shown) | static | — | heli, silence |
| 9a | 55.0–60.0 | Wide | **Funeral / city**: umbrellas, flowers (FG) / crowd with a framed 3D portrait (MG) / city skyline, hills (BG) | mourners, some angry, some crying; final pull back over the city | crane up and back | overcast evening | low strings, end |

Rules: slice-open = 3b (mansion wall, "HIDDEN CASH"); a new pose every sentence; transitions: whip
(rise), fade (empire), dip (terror, death), flash (politics flash); music: guitar/pad rise → drums at
3 → thin dark low at 5 → tension 6–8 → silence before "killed" → low strings for 9.
