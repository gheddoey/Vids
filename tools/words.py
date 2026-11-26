"""Word timings with Whisper (faster-whisper, small.en, CPU).

Usage: python3 tools/words.py <audio> [out.json]
Prints "start end word" lines; optionally writes [{w, s, e}] JSON. More accurate than
pocketsphinx for cutting on exact words. First run downloads the model (~460 MB).
"""

import json
import os
import subprocess
import sys

import numpy as np

os.environ.setdefault('HF_HUB_DISABLE_XET', '1')  # plain HTTPS downloads (the xet host is blocked)


def load16k(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-ac', '1', '-ar', '16000', '-f', 'f32le', '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32)


def words(path, model='small.en'):
    from faster_whisper import WhisperModel

    m = WhisperModel(model, device='cpu', compute_type='int8')
    segs, _ = m.transcribe(load16k(path), word_timestamps=True, language='en')
    return [{'w': w.word.strip(), 's': round(w.start, 3), 'e': round(w.end, 3)} for s in segs for w in s.words]


if __name__ == '__main__':
    ws = words(sys.argv[1])
    for w in ws:
        print(f"{w['s']:7.2f} {w['e']:7.2f} {w['w']}")
    if len(sys.argv) > 2:
        json.dump(ws, open(sys.argv[2], 'w'), indent=1)
