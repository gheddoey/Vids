# FILE 11-0829-JX — ARG solutions (SPOILERS)

Page: `arg/jupiter/index.html` (built by `python3 arg/jupiter/build.py` from `template.html`).
Each stage is encrypted with the previous answer, so the page source spoils nothing.
Answers are case/space-insensitive; a leading "THE" and repeats are ignored.

| # | Section | Puzzle | Answer |
|---|---|---|---|
| 0 | Landing | Vessel number 11-0829 + suffix = TARGET[0] (Jupiter → J) + COUNT(SECTIONS) (ten → X) | `11-0829-JX` |
| 1 | 04 / Call log | Caesar shift, "OFFSET = CREW". 4 fails; Version B crew is 3 (no Watkins) → shift back 3. Waldron: seat four "was HOLLOW" | `HOLLOW` |
| 2 | 02 / Personnel | "Mateo O. Algo", form language ES → "Mateo o algo" = "Mateo or something" | `SOMETHING` |
| 3 | 07 / Baker | Pod 2 lamp blinks Morse `.... . .-.. .-.. ---` (tone button too) | `HELLO` |
| 4 | 08 / Waldron | Vigenère, key "WHAT SEAT FOUR WAS" = HOLLOW. Memo: life on Europa found us in 1980, rode home in the vents… | `VENTS` |
| 5 | 06 / Entity | Finale. Hex at the bottom = `NEXT FILE: 80-1003-SX` (sequel hook: 1980 Saturn) | — |

Hidden extras: base64 HTML comment ("THERE IS NO SECTION 00. YOU ARE IN IT."), console message,
tab title becomes "HELLO?" when you leave, rare 70 ms flash frames, taunts after wrong guesses,
progress remembered per browser (PURGE button at the end).
Diegetic disclaimer kept from the source lore: "AUTHENTICITY: NONE (CREEPYPASTA)".
