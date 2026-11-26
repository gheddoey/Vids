"""Draft caption/scene timings from a script, before the real voiceover exists.

Usage: python3 tools/draft_timing.py tools/scripts/<name>.json <name> [words_per_sec]

Spaces words at the voice's speed (Mike ~2.9 words/s), gives sentence-ending words a
little extra, and uses the same small gap between lines that prep_vo.py leaves after
removing dead air. Writes src/<name>/timing.json in the exact format prep_vo.py
writes, so the real ElevenLabs take drops in later without code changes.
"""

import json
import os
import sys

ROOT = os.path.join(os.path.dirname(__file__), '..')


def main(script_path, name, wps=2.9):
    script = json.load(open(script_path))
    gap = script.get('gap', 0.22)
    keep = {int(k): v for k, v in script.get('keepGapBefore', {}).items()}
    t = 0.15
    lines = []
    for i, l in enumerate(script['lines']):
        if i:
            t += keep.get(i, gap)
        words = []
        s0 = t
        for w in l['text'].split():
            d = 1 / wps * (0.75 + 0.07 * len(w.strip('.,?!')) ** 0.9)
            if w[-1] in '.,?!':
                d += 0.12
            words.append({'w': w, 's': round(t, 3), 'e': round(t + d, 3)})
            t += d
        lines.append({'text': l['text'], 's': round(s0, 3), 'e': round(t, 3), 'words': words})
    out = {'duration': round(t + 0.35, 3), 'lines': lines, 'draft': True}
    os.makedirs(os.path.join(ROOT, 'src', name), exist_ok=True)
    json.dump(out, open(os.path.join(ROOT, 'src', name, 'timing.json'), 'w'), indent=1)
    print(f'{len(lines)} lines, {sum(len(l["words"]) for l in lines)} words, {out["duration"]:.2f} s')


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2], float(sys.argv[3]) if len(sys.argv) > 3 else 2.9)
