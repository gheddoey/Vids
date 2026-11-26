# Escobar v3 — environments: design plans + quality-gate log

Shared library: `src/env/` (materials, terrain, nature, build, atmos). Six rules kept: boxes /
low icosahedra, flat shading, 64-px code-painted textures, PS1 snap + dither, CineGrade.

| Module | Contents |
|---|---|
| `materials.ts` | cached `mat(kind)` painters with wear: planks, boards, bark, bamboo, brick, stone, concrete, plaster (chips show brick), tin (rust streaks), rooftile (moss), thatch, fabric, grass, mud, dirt, asphalt, tiles, leaves, water; `flat`, `glow`, `tint` |
| `terrain.tsx` | `Terrain` (flat-shaded heightfield, per-face colour by height/slope), `Ridge` (distant silhouettes for atmospheric perspective), `vnoise` |
| `nature.tsx` | instanced swaying `Blades` + `scatter`/`tuft`, `Bamboo` (guadua), `BigTree` (buttressed ceiba), `Palm2`, `Bush`, `Treeline`, `Hyacinth`, `Glimmers`, `WaterSurface` (see-through, flowing), `Reflection` |
| `build.tsx` | `Wall` with real openings, `Window`, `Door`, `Room` (floor + ceiling + beams + trim), `GableRoof`, `ShedRoof`, `StiltHouse`, `Laundry`, `Jetty`, `Canoe`, `Pole` + `Wires`, `Fence`, `Road`, `LampPost` |
| `atmos.tsx` | `Sky3` (3-stop sky, sun glow, dark below-horizon for water), `Mist`, `SunPath`, `Shafts`, `SunRig` |

**Scale rule learned:** R6 characters are ~5.4 units tall (1 unit ≈ 0.32 m). Build man-made set
pieces at that scale (houses/canoes ×1.5–1.7 of the library defaults), or people dwarf them.

## 1. River — shots 1 + 26 (`src/escobar/river.tsx`, `RiverV3`)
**Analysis.** The Magdalena near Puerto Triunfo at sunrise: a wide, brown, slow river; fishing
families in stilt houses; guadua bamboo, ceibas, palms; real yellow "PELIGRO" hippo signs.
**Plan / layout.** River along X; camera at the waterline looking −Z. Far bank at z −38 (wide river),
a sandbar at z −17, hippos at z −0.5…−7.
- FG: reed tufts framing the lower corners, floating water hyacinth, the water with flowing texture and
  the mirrored bank as a reflection.
- MG: 3 hippos (v2, recoloured grey-brown, teeth only when open, full mouth for the yawn), sandbar
  with reeds, driftwood snag, egrets.
- BG: stilt house (porch, tin roof, laundry, hammock, ladder) with a fisherman leaning on the rail with a
  coffee; jetty + moored canoes; second house; bamboo clumps; 2 ceibas; palms; power line; fence;
  PELIGRO sign; two treelines; three haze ridges; sun disc + light shafts; clouds; birds.
**Light.** Low sun behind the far bank (backlight, long shadows toward camera, sun path on the water),
sky hemisphere fill, warm camera-side fill, left rim; warm fog for aerial perspective; grade `golden`.
**Ambient.** Current + glints, mist drift, reeds/bamboo/palm sway, laundry, birds, pollen, egret turn,
canoes rocking, the fisherman's idle life.
**Shot 26** mirrors the camera to the left side so the BG behind the yawn is sign/bamboo/palms/house.

**Gate log (rendered stills of Escobar frames 4/10, 50, 85, 1945 from the real cameras):**
1. FAIL: hippos black, blown-out yellow water, trees clogging the sky, background life off-frame.
2. FAIL: FG reeds hid the hippos in the push-in, post read as a black slab, pink stripes on hippos.
3. FAIL: teeth showing on closed mouths; fisherman looked like he was riding a hippo; "Ó" missing in the 3D font (sign now "HIPOPOTAMOS").
4–6. FAIL: scale mismatch (character vs house/canoe); shot 26 had the house as a flat wall behind the hippo → camera mirrored.
7. FAIL: house became a wall behind the hippos; river far too narrow for character scale.
8. **PASS**: far bank moved to z −38 + sandbar MG layer. Clear FG/MG/BG, atmospheric depth, story
   light, background life, reflections. Shot 26: PASS (yawn reads, layered BG).
Known limits: the hippo body is still a stack of boxes; water near the lens is a large dark area
(it carries the reflections).
