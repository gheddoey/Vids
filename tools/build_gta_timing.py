"""Build tools/scripts/gta.json from pocketsphinx word segments (scratch asr json).
Each script word is matched to its ASR token(s) in order; special counts cover
numbers and words the recogniser split or merged."""
import json, re, sys
segs = json.load(open(sys.argv[1]))
toks = [(w, a, b) for w, a, b in segs if not w.startswith('<') and w != '[NOISE]']
LINES = [
 "The biggest game series on Earth only exists because of a bug.",
 "Dundee, Scotland. 1988.",
 "A young programmer named David Jones starts a tiny studio called DMA Design.",
 "Their first big hit? Lemmings.",
 "Millions of tiny walkers, marching off cliffs.",
 "Then they try something new.",
 "A top-down cops and robbers game called Race'n'Chase.",
 "One problem.",
 "It's boring.",
 "Until a bug changes everything.",
 "The police cars go crazy, ramming the player off the road.",
 "The team should fix it.",
 "Instead, they laugh, and keep it.",
 "Chaos becomes the game.",
 "But the project drags on, and the publisher almost pulls the plug.",
 "So they lean into it.",
 "A publicist stirs up outrage on purpose.",
 "Newspapers rage.",
 "Politicians complain.",
 "And the game flies off the shelves.",
 "In New York, the Houser brothers start Rockstar Games.",
 "In 2001, the series goes 3D, and suddenly the whole city is yours.",
 "Vice City.",
 "San Andreas.",
 "Then, in 2013, part five makes one billion dollars in three days,",
 "the fastest entertainment launch in history.",
 "The series is called...",
 "Grand Theft Auto.",
 "And after thirteen years of waiting, the sixth one has finally arrived.",
 "And it all started with a cop car that wouldn't stop.",
]
COUNT = {'top-down': 2, '1988.': 3, "Race'n'Chase.": 2, '2001,': 3, '2013,': 2, '3D,': 2, 'entertainment': 2, 'they@12': 2}
MERGE = {('keep', 12): 2, ('the', 19): 2}  # these script words share one token with the next word
# "drags on, and the publisher": 'and' is the [SPEECH] token — 1:1, fine.
lines, i = [], 0
for li, text in enumerate(LINES):
    words = re.findall(r"[\w'\-]+[.,?!\"]*", text)
    wt = []
    k = 0
    while k < len(words):
        w = words[k]
        base = w.strip('.,?!').lower()
        n = COUNT.get(f'{base}@{li}', COUNT.get(w, 1))
        if (base, li) in MERGE:
            m = MERGE.pop((base, li))
            wt += [toks[i][1]] * m
            k += m; i += 1
            continue
        wt.append(toks[i][1]); i += n; k += 1
    lines.append({'text': text, 's': round(wt[0], 2), 'e': round(toks[i - 1][2], 2), 'wt': [round(t, 2) for t in wt]})
assert i == len(toks), (i, len(toks), toks[i:])
lines[4]['s'] = lines[4]['wt'][0] = 14.51  # recogniser placed 'Millions' late; audio starts at the silence end
for l in lines:
    print(f"{l['s']:6.2f}-{l['e']:6.2f} {l['text']}")
json.dump({'lines': lines, 'gap': 0.2, 'keepGapBefore': {'27': 0.45}}, open('tools/scripts/gta.json', 'w'), indent=1)
