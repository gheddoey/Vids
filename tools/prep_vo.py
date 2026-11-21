"""Polish a voiceover, remove dead air, and write caption/scene timings.

Usage: python3 tools/prep_vo.py <voiceover.mp3> <script.json> <name>

script.json holds the script lines with their (start, end) in the original take
(measured with pocketsphinx), optional exact word anchors, and optional pauses to
keep longer (by line index) for dramatic beats.

- Voice polish: rumble cut, a little presence, gentle compression, -16 LUFS.
- Pauses longer than GAP are shortened to GAP (cut from their middle); the head and
  tail are trimmed; joins get a 12 ms crossfade.
- Output: public/vo/<name>.wav and src/<name>/timing.json.
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
POLISH = 'highpass=f=80,equalizer=f=220:t=q:w=1.2:g=-1.5,equalizer=f=3200:t=q:w=1.0:g=2,acompressor=threshold=-20dB:ratio=2.5:attack=8:release=120:makeup=2,loudnorm=I=-16:TP=-1.5:LRA=9'


def load(path, filt=None):
    cmd = ['ffmpeg', '-v', 'error', '-i', path]
    if filt:
        cmd += ['-af', filt]
    cmd += ['-ac', '1', '-ar', str(SR), '-f', 's16le', '-']
    raw = subprocess.run(cmd, capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768


def silences(path):
    out = subprocess.run(['ffmpeg', '-i', path, '-af', 'silencedetect=noise=-38dB:d=0.18', '-f', 'null', '-'], capture_output=True, text=True).stderr
    st = [float(x) for x in re.findall(r'silence_start: ([\d.]+)', out)]
    en = [float(x) for x in re.findall(r'silence_end: ([\d.]+)', out)]
    return list(zip(st, en))


def main(src, script_path, name):
    script = json.load(open(script_path))
    lines = script['lines']
    keep_before = {int(k): v for k, v in script.get('keepGapBefore', {}).items()}
    base_gap = script.get('gap', GAP)
    x = load(src, POLISH)
    sil = silences(src)
    speech_start, speech_end = lines[0]['s'], lines[-1]['e']

    def gap_for(s, e):
        for i, l in enumerate(lines):
            if i in keep_before and s < l['s'] <= e + 0.05:
                return keep_before[i]
        return base_gap

    keep, cur = [], max(0.0, speech_start - HEAD)
    for s, e in sil:
        if e <= speech_start or s >= speech_end:
            continue
        g = gap_for(s, e)
        if e - s > g:
            keep.append((cur, s + g / 2))
            cur = e - g / 2
    keep.append((cur, min(len(x) / SR, speech_end + TAIL)))

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
    with wave.open(os.path.join(ROOT, 'public', 'vo', f'{name}.wav'), 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((np.clip(out, -1, 1) * 32767).astype(np.int16).tobytes())

    def remap(t):
        acc = 0.0
        for i, (a, b) in enumerate(keep):
            if t <= b:
                return acc + max(0.0, t - a) - (xf / SR) * i
            acc += b - a
        return acc - (xf / SR) * (len(keep) - 1)

    anchors = script.get('anchors', {})
    res = []
    for l in lines:
        ns, ne = remap(l['s']), remap(l['e'])
        words = re.findall(r"[\w'\-]+[.,?!\"]*", l['text'].replace('"', ''))
        weights = [len(w.strip('.,?!')) + 2 for w in words]
        tot = sum(weights)
        t, ws = ns, []
        for w, k in zip(words, weights):
            d = (ne - ns) * k / tot
            ws.append({'w': w, 's': round(t, 3), 'e': round(t + d, 3)})
            t += d
        # Measured per-word start times (from ASR alignment), if the script provides them.
        if 'wt' in l and len(l['wt']) == len(ws):
            for k, wd in enumerate(ws):
                wd['s'] = round(remap(l['wt'][k]), 3)
                wd['e'] = round(remap(l['wt'][k + 1]), 3) if k + 1 < len(ws) else round(ne, 3)
        # Snap words that have measured times.
        for wd in ws:
            if wd['w'] in anchors and l['s'] - 0.05 <= anchors[wd['w']] <= l['e'] + 0.05:
                wd['s'] = round(remap(anchors[wd['w']]), 3)
        res.append({'text': l['text'], 's': round(ns, 3), 'e': round(ne, 3), 'words': ws})

    total = len(out) / SR
    os.makedirs(os.path.join(ROOT, 'src', name), exist_ok=True)
    with open(os.path.join(ROOT, 'src', name, 'timing.json'), 'w') as f:
        json.dump({'duration': round(total, 3), 'lines': res}, f, indent=1)
    print(f'original {len(x) / SR:.2f}s -> tightened {total:.2f}s')
    for i, l in enumerate(res):
        print(f"{i:2d} {l['s']:6.2f}-{l['e']:6.2f}  {l['text']}")


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2], sys.argv[3])
