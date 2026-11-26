"""Align Whisper word times to the script, so captions and cuts land on exact words.

Usage: python3 tools/align_vo.py tools/scripts/<name>.json <whisper_words.json>
Adds, per line: s/e (original take) and words [{w, s, e}] using the script's own spelling.
Words Whisper wrote differently (numbers: "200" vs "two hundred") are interpolated between
their matched neighbours. Then run prep_vo.py, which keeps these exact times.
"""

import difflib
import json
import re
import sys


def norm(w):
    return re.sub(r"[^a-z']", '', w.lower())


def main(script_path, words_path):
    sc = json.load(open(script_path))
    heard = json.load(open(words_path))
    sw = []  # (line, word)
    for i, l in enumerate(sc['lines']):
        for w in l['text'].split():
            sw.append((i, w))
    a = [norm(w) for _, w in sw]
    b = [norm(h['w']) for h in heard]
    times = [None] * len(sw)
    for blk in difflib.SequenceMatcher(None, a, b, autojunk=False).get_matching_blocks():
        for k in range(blk.size):
            h = heard[blk.b + k]
            times[blk.a + k] = [h['s'], h['e']]
    # interpolate the unmatched ones between known neighbours
    i = 0
    while i < len(times):
        if times[i] is None:
            j = i
            while j < len(times) and times[j] is None:
                j += 1
            t0 = times[i - 1][1] if i > 0 else 0.0
            t1 = times[j][0] if j < len(times) else heard[-1]['e']
            n = j - i
            lens = [len(sw[k][1]) + 2 for k in range(i, j)]
            tot = sum(lens)
            t = t0
            for k in range(i, j):
                d = (t1 - t0) * lens[k - i] / tot
                times[k] = [round(t, 3), round(t + d, 3)]
                t += d
            i = j
        else:
            i += 1
    for li, l in enumerate(sc['lines']):
        ws = [{'w': w, 's': times[k][0], 'e': times[k][1]} for k, (ll, w) in enumerate(sw) if ll == li]
        l['words'] = ws
        l['s'] = ws[0]['s']
        l['e'] = ws[-1]['e']
    json.dump(sc, open(script_path, 'w'), indent=1)
    matched = sum(1 for k in range(len(sw)) if norm(sw[k][1]) in b)
    print(f'{len(sw)} script words aligned ({matched} matched directly)')


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
