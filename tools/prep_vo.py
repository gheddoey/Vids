"""Tighten the LeBron voiceover (remove dead air) and write caption/scene timings.

- Every pause longer than GAP seconds is shortened to GAP (cut from its middle),
  leading/trailing silence is trimmed, joins get a 12 ms crossfade.
- Line timings (measured with pocketsphinx on the original take) are remapped onto
  the tightened audio, and each line's words are spread across it by length.

Run: python3 tools/prep_vo.py <voiceover.mp3>
"""

import json
import os
import re
import subprocess
import sys
import wave

import numpy as np

ROOT = os.path.join(os.path.dirname(__file__), '..')
SR = 44100
GAP = 0.22
HEAD = 0.04
TAIL = 0.35

# Pauses found with: ffmpeg -af silencedetect=noise=-38dB:d=0.18
SILENCES = [
    (1.315, 1.515), (3.794, 4.204), (6.053, 6.429), (8.244, 8.652), (11.443, 11.873),
    (13.893, 14.218), (17.165, 17.652), (20.605, 20.988), (22.017, 22.479), (23.034, 23.373),
    (25.405, 25.704), (29.752, 30.108), (30.939, 31.279), (35.230, 35.556), (37.742, 38.106),
    (39.583, 39.933), (41.833, 42.047),
]
SPEECH_START, SPEECH_END = 0.10, 43.31

# Script lines with their (start, end) in the original take, from the word timings.
LINES = [
    ('This kid missed more than eighty days of school in one year.', 0.10, 3.81),
    ('His mom was sixteen when she had him.', 4.18, 6.15),
    ('No dad.', 6.40, 7.09),
    ('No stable home.', 7.23, 8.25),
    ('They kept moving, and nobody expected anything from him.', 8.64, 11.47),
    ('Then a youth football coach took him in.', 11.84, 13.90),
    ('Gave him a room, a routine, and a reason to show up.', 14.21, 17.27),
    ('At sixteen, he was on the cover of Sports Illustrated.', 17.61, 20.61),
    ('"The Chosen One."', 20.95, 22.04),
    ('Eighteen.', 22.46, 23.04),
    ('First pick in the NBA Draft.', 23.33, 25.44),
    ('Down three games to one in the Finals, against a seventy-three-win team.', 25.68, 29.76),
    ('He won.', 30.09, 30.90),
    ('Twenty years later, he became the leading scorer in NBA history.', 31.26, 35.29),
    ('Then he played alongside his own son.', 35.49, 37.77),
    ('That kid who missed all that school?', 38.05, 39.65),
    ('His name is LeBron James.', 39.90, 41.84),
    ("And he's still not done.", 42.01, 43.31),
]


def load(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-ac', '1', '-ar', str(SR), '-f', 's16le', '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768


def main(src):
    x = load(src)
    # Intervals of the original to keep.
    keep, cur = [], max(0.0, SPEECH_START - HEAD)
    for s, e in SILENCES:
        d = e - s
        if d > GAP:
            cut0 = s + GAP / 2
            cut1 = e - GAP / 2
            keep.append((cur, cut0))
            cur = cut1
    keep.append((cur, min(len(x) / SR, SPEECH_END + TAIL)))

    # Stitch with short crossfades.
    xf = int(SR * 0.012)
    out = np.zeros(0, dtype=np.float32)
    for a, b in keep:
        seg = x[int(a * SR) : int(b * SR)].copy()
        if len(out) and len(seg) > xf:
            ramp = np.linspace(0, 1, xf)
            out[-xf:] = out[-xf:] * (1 - ramp) + seg[:xf] * ramp
            seg = seg[xf:]
        out = np.concatenate([out, seg])
    fade = int(SR * 0.08)
    out[-fade:] *= np.linspace(1, 0, fade)

    os.makedirs(os.path.join(ROOT, 'public', 'vo'), exist_ok=True)
    with wave.open(os.path.join(ROOT, 'public', 'vo', 'lebron.wav'), 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((np.clip(out, -1, 1) * 32767).astype(np.int16).tobytes())

    # Map an original time onto the tightened timeline.
    def remap(t):
        acc = 0.0
        for i, (a, b) in enumerate(keep):
            if t <= b:
                return acc + max(0.0, t - a) - (xf / SR) * i
            acc += b - a
        return acc - (xf / SR) * (len(keep) - 1)

    lines = []
    for text, s, e in LINES:
        ns, ne = remap(s), remap(e)
        words = re.findall(r"[\w'\-]+[.,?!\"]*", text.replace('"', ''))
        weights = [len(w.strip('.,?!')) + 2 for w in words]
        tot = sum(weights)
        t, ws = ns, []
        for w, k in zip(words, weights):
            d = (ne - ns) * k / tot
            ws.append({'w': w, 's': round(t, 3), 'e': round(t + d, 3)})
            t += d
        lines.append({'text': text, 's': round(ns, 3), 'e': round(ne, 3), 'words': ws})

    os.makedirs(os.path.join(ROOT, 'src', 'lebron'), exist_ok=True)
    total = len(out) / SR
    with open(os.path.join(ROOT, 'src', 'lebron', 'timing.json'), 'w') as f:
        json.dump({'duration': round(total, 3), 'lines': lines}, f, indent=1)
    print(f'original {len(x) / SR:.2f}s -> tightened {total:.2f}s')
    for l in lines:
        print(f"{l['s']:6.2f}-{l['e']:6.2f}  {l['text']}")


if __name__ == '__main__':
    main(sys.argv[1])
