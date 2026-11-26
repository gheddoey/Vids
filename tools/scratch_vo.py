"""Scratch voiceover from a script, for test cuts before the ElevenLabs take.

Usage: python3 tools/scratch_vo.py tools/scripts/<name>.json <name>

Speaks each line with the Piper voice (tools/get-voices.sh), times the words with Whisper,
joins lines with the script's `gap` (no dead air), and writes public/vo/<name>.wav and
src/<name>/timing.json in the same format as prep_vo.py. The timing JSON is marked
"scratch": true so it's obvious the real voice hasn't been dropped in yet.
"""

import json
import os
import subprocess
import sys
import tempfile
import wave

import numpy as np

sys.path.insert(0, os.path.dirname(__file__))
from words import words  # noqa: E402

ROOT = os.path.join(os.path.dirname(__file__), '..')
VOICE = os.path.join(os.path.dirname(__file__), 'voices', 'en_US-ryan-high.onnx')
SR = 44100


def speak(text, path):
    subprocess.run([sys.executable, '-m', 'piper', '-m', VOICE, '-f', path, '--length-scale', '0.92'], input=text.encode(), check=True, capture_output=True)


def load(path, filt='silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse'):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-af', filt, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32)


def main(script_path, name):
    script = json.load(open(script_path))
    gap = script.get('gap', 0.22)
    keep = {int(k): v for k, v in script.get('keepGapBefore', {}).items()}
    out, lines, t = [], [], 0.1
    out.append(np.zeros(int(SR * t), np.float32))
    with tempfile.TemporaryDirectory() as tmp:
        for i, l in enumerate(script['lines']):
            if i:
                g = keep.get(i, gap)
                out.append(np.zeros(int(SR * g), np.float32))
                t += g
            p = os.path.join(tmp, f'{i}.wav')
            speak(l['text'], p)
            x = load(p)
            clip = os.path.join(tmp, f'{i}c.wav')
            with wave.open(clip, 'wb') as w:
                w.setnchannels(1), w.setsampwidth(2), w.setframerate(SR)
                w.writeframes((np.clip(x, -1, 1) * 32767).astype(np.int16).tobytes())
            heard = words(clip)
            said = l['text'].split()
            dur = len(x) / SR
            if len(heard) == len(said):
                ws = [{'w': s, 's': round(t + h['s'], 3), 'e': round(t + h['e'], 3)} for s, h in zip(said, heard)]
            else:  # spread by word length if Whisper split words differently
                lens = np.array([len(s) + 2 for s in said], float)
                edges = np.concatenate([[0], np.cumsum(lens) / lens.sum() * dur])
                ws = [{'w': s, 's': round(t + edges[k], 3), 'e': round(t + edges[k + 1], 3)} for k, s in enumerate(said)]
            lines.append({'text': l['text'], 's': round(t, 3), 'e': round(t + dur, 3), 'words': ws})
            out.append(x)
            t += dur
            print(f'{i:2d} {lines[-1]["s"]:6.2f}-{lines[-1]["e"]:6.2f} {l["text"]}')
    audio = np.concatenate(out + [np.zeros(int(SR * 0.35), np.float32)])
    raw = os.path.join(ROOT, 'out', f'{name}_scratch_raw.wav')
    os.makedirs(os.path.dirname(raw), exist_ok=True)
    with wave.open(raw, 'wb') as w:
        w.setnchannels(1), w.setsampwidth(2), w.setframerate(SR)
        w.writeframes((np.clip(audio, -1, 1) * 32767).astype(np.int16).tobytes())
    os.makedirs(os.path.join(ROOT, 'public', 'vo'), exist_ok=True)
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', raw, '-af', 'highpass=f=80,loudnorm=I=-16:TP=-1.5:LRA=9', '-ar', str(SR), os.path.join(ROOT, 'public', 'vo', f'{name}.wav')], check=True)
    json.dump({'duration': round(t + 0.35, 3), 'lines': lines, 'scratch': True}, open(os.path.join(ROOT, 'src', name, 'timing.json'), 'w'), indent=1)
    print(f'wrote public/vo/{name}.wav, src/{name}/timing.json ({t:.1f} s)')


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
