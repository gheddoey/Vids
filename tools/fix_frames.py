"""Repair glitched frames in a Remotion render.

In this container Chromium sometimes captures a frame as one corner of the page tiled over the
whole image (happens in every HD composition, at any --gl / concurrency). Single stills render
clean, so: extract the frames, find the broken ones, re-render only those with `remotion still`,
then re-encode and keep the original audio.

Usage: python3 tools/fix_frames.py out/bundle <Comp> in.mp4 out.mp4
"""

import glob
import os
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor

import numpy as np
from PIL import Image


def small(p):
    return np.asarray(Image.open(p).convert('L').resize((90, 160)), dtype=np.float32)


def tiled_score(a):
    # A tiled frame repeats itself: compare it with itself shifted by every plausible tile size.
    best = 1e9
    for dy in range(18, 60):
        best = min(best, np.abs(a[dy:] - a[:-dy]).mean())
    return best


def find_bad(frames):
    imgs = [small(p) for p in frames]
    bad = []
    for i, a in enumerate(imgs):
        prev = imgs[i - 1] if i else None
        nxt = imgs[i + 1] if i + 1 < len(imgs) else None
        d_prev = np.abs(a - prev).mean() if prev is not None else 0
        d_next = np.abs(a - nxt).mean() if nxt is not None else 0
        jump = prev is not None and nxt is not None and d_prev > 12 and d_next > 12
        if tiled_score(a) < 4 or (jump and np.abs(prev - nxt).mean() < 0.5 * min(d_prev, d_next)):
            bad.append(i)
    return bad


def main(bundle, comp, src, dst):
    work = os.path.join(os.path.dirname(dst), 'fix_' + comp)
    os.makedirs(work, exist_ok=True)
    for f in glob.glob(os.path.join(work, '*.png')):
        os.remove(f)
    subprocess.run(['ffmpeg', '-v', 'error', '-i', src, os.path.join(work, 'f%04d.png')], check=True)
    frames = sorted(glob.glob(os.path.join(work, 'f*.png')))
    for rnd in range(4):
        bad = find_bad(frames)
        print(f'pass {rnd + 1}: {len(bad)} bad frames {bad}')
        if not bad:
            break

        def still(i):
            subprocess.run(['npx', 'remotion', 'still', bundle, comp, frames[i], f'--frame={i}', '--browser-executable=/opt/pw-browsers/chromium', '--gl=swangle', '--log=error'], check=True)

        with ThreadPoolExecutor(4) as ex:
            list(ex.map(still, bad))
    fps = subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v', '-show_entries', 'stream=r_frame_rate', '-of', 'csv=p=0', src], capture_output=True, text=True).stdout.strip()
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-framerate', fps, '-i', os.path.join(work, 'f%04d.png'), '-i', src, '-map', '0:v', '-map', '1:a', '-c:v', 'libx264', '-crf', '18', '-pix_fmt', 'yuv420p', '-af', 'alimiter=limit=0.85:level=false', '-c:a', 'aac', '-b:a', '192k', '-shortest', dst], check=True)
    print('wrote', dst)


if __name__ == '__main__':
    main(*sys.argv[1:5])
