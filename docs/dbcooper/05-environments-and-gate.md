# D.B. Cooper: environments, assets and quality-gate log

All assets are procedural (boxes, low-segment cylinders, 64-px code-painted textures). Nothing was downloaded, so there are no licences to track.

| Set | FG / MG / BG | Light story | Gate result |
|---|---|---|---|
| StormSky + Jet727 | Rain streaks / tail, aft stair, Cooper / racing cloud deck, lightning | Cool moon key, stair-well amber, red beacon, fin wash lights | Rev 1 failed (black hull, giant rails). Rev 3: relit, swept single-piece fin, slim rails → **pass** |
| Apron (PDX dusk) | Cones, puddles / 727 at the gate, baggage train / terminal glass wall, sign truss, tower, Mt Hood silhouette | Sodium lamps, sunset key | **Pass** (the mountain only appeared after the sky-dome fix) |
| TicketHall | Stanchions / counter, agent, Cooper / flip board, route map, travellers | Fluorescent troffers + warm rim | Rev 1–2 failed (camera inside the agent, then inside the counter). Agent moved, counter lowered, 3D clip-on tie added → **pass** |
| Cabin727 | Seat backs / Cooper row 18, Flo / aft bulkhead, EXIT, LAV, stair door | Reading-light pools, cove light, flicker on "bomb" | Rev 1–3 failed (9:16 framing too tight, seat backs blocking). `hideRow` + pulled-back cameras → **pass** |
| Briefcase (slice-open) | Seat fabric / sliced case, sticks, wires, battery / label | Cold top light | Rev 1 failed (a top plate hid the inside; the label was clipped). Plate removed, label moved → **pass** |
| Cockpit | Seat backs / Captain + note / windscreen rain, city grid below | Instrument glow | Rev 1 failed (camera too close). Rev 3: the note reads "$200,000 / 4 PARACHUTES" → **pass** |
| FbiOffice | Desk props / agents, microfilm stand, bag / map with yarn, calendar, archive shelves, rainy blinds | Flickering tubes, desk lamps, flash pops | Flash blew out the frame in rev 1; tamed → **pass** |
| Tarmac (Sea-Tac) | Puddles / passengers, stair truck, fuel truck, jet / floodlight towers, taxi lights, city | Floodlights, police strobe | **Pass** |
| Forest (night/dawn) | Ferns, logs / searchers, dog / fir walls, chopper, god-rays | Dawn rim through fog; night lightning | The night version was black (fog plus instanced-mesh culling). Fixed: `frustumCulled={false}`, fog pushed back, lightning fill → pass (dark by design) |
| Newsroom | Typewriter ECU / reporter / desks, windows to the city, fan | Green-shade hanging lamps | **Pass** |
| TenaBar (1980) | Driftwood, picnic, fire / boy, dad / river, barge, far-bank firs, pulp mill | Grey overcast + fire | Rev 1 failed: the sand tilted the wrong way and the far bank sat beyond the 90-unit sky dome. The dome is now scaled ×3 → **pass** |
| EvidenceTable | Ruler, tag / tie in the evidence bag, MATCH / darkness | One hard spotlight | The black tie was invisible on dark felt; the felt is now lighter → **pass** |

## Bugs worth remembering (also in CLAUDE.md)
- The `SkyDome` in `ps1/sets` has a 90-unit radius, and anything beyond it is hidden. Wrap it in `<group scale={3}>` (camera far = 300).
- Instanced forests far from the origin get frustum-culled. Use `frustumCulled={false}`.
- 9:16 hfov is narrow. Head close-ups need about 6 units at fov 42–44, and ECUs of small props about 1.6.
