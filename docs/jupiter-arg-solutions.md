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

# N.K.S.A. Public Site — the 180 (SPOILERS)

Page: `arg/nksa/index.html`. Looks like a dull agency site. Four actions, in order, flip it:

1. **Tap the seal 3 times** (within ~1.5 s). Clue: FAQ "some visitors report it responds if tapped three times".
   → a red 4th star appears, archive shows the withheld row 11-0829, news says "some records remain restricted".
2. **Search `11-0829`** → "1 restricted record · Crew 4 · Returned 3 … visit Kids Corner and count carefully".
3. **Kids Corner: answer 3** (the 4th astronaut is hollow, no face). Kiki: "…you noticed. Go say hello to the office."
4. **Contact form: send a message containing "hello"** → black screen, a voice says "hello?", alarm,
   takeover page that replays everything the visitor did with timestamps, Kies crawl toward "YOU",
   links to FILE 11-0829-JX.

"Return to public site" leaves it permanently wrong: "Every crew comes home. We're glad you're back. Please
don't do that again." Hidden "FORGET ME" link at the bottom of the takeover resets it.
