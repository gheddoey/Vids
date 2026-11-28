# D.B. Cooper — QC + production report

## Deliverable
- Composition `DBCooper` (`src/dbcooper/DBCooper.tsx`), 1080×1920, 30 fps, 71.3 s (VO 70.76 s + 0.5 s tail).
- Render: `out/dbcooper_raw.mp4` → `tools/fix_frames.py` (4 passes, tiled frames re-rendered as stills,
  audio limited at 0.85) → `out/dbcooper.mp4`; phone copy `out/DBCooper_phone.mp4` (crf 28, 44 MB).

## QC checklist
| Check | Result |
|---|---|
| Hook in 1–3 s (jet + open stair in storm on frame 1) | pass |
| Dead air removed (prep_vo gaps 0.2 s; dramatic gaps only on 6 lines) | pass |
| New pose + cut on every sentence (33 lines / 29 shots) | pass |
| Slice-open + 3D label (briefcase cutaway, BATTERY) | pass |
| No flat graphics (newspaper, $200,000 sign, MATCH, calendar, serial = 3D) | pass |
| Captions one word, gold on D.B. / Cooper | pass |
| Callback ending (tie on evidence felt / jet stair) | pass |
| Glitched frames | 17 frames still flagged by the detector after pass 4 — checked by eye: all are dips to black, fog-dark and flash frames (false positives) |
| Contact sheet 1 fps | checked, every shot reads |

## Known weak spots (next pass if the user asks)
- IntoRain (≈44 s) is still very dark; Loafers shoes read only just.
- Microfilm flash (≈31 s) goes near-white for ~0.5 s.

## Pipeline notes
- Whisper merged pauses into word starts; real onsets taken from waveform energy (≥150 ms silence).
- SkyDome scaled ×3 and `frustumCulled={false}` on instanced pines — both added to CLAUDE.md pitfalls.
