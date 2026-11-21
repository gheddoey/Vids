"""Synthesized sound effects and the era-changing music bed for the GTA origins short.

Everything is generated from oscillators and filtered noise (no samples, no licences).
The bed follows the VO timing in src/gta/timing.json.
Run: python3 tools/make_sfx_gta.py
"""

import importlib.util
import json
import os

import numpy as np

HERE = os.path.dirname(__file__)
spec = importlib.util.spec_from_file_location('sfx', os.path.join(HERE, 'make_sfx.py'))
S = importlib.util.module_from_spec(spec)
spec.loader.exec_module(S)
SR, t_axis, env, band, noise, sweep, save, place, pad = S.SR, S.t_axis, S.env, S.band, S.noise, S.sweep, S.save, S.place, S.pad
rng = np.random.default_rng(11)


def sq(f, dur, duty=0.5):
    t = t_axis(dur)
    ph = (t * f) % 1
    return np.where(ph < duty, 1.0, -1.0)


def tri(f, dur):
    t = t_axis(dur)
    return 2 * np.abs(2 * ((t * f) % 1) - 1) - 1


def saw(f, dur):
    t = t_axis(dur)
    return 2 * ((t * f) % 1) - 1


def sine(f, dur):
    return np.sin(2 * np.pi * f * t_axis(dur))


def note(n):
    return 440.0 * 2 ** ((n - 69) / 12)


# ---------------- Effects ----------------
def siren():
    dur = 2.6
    t = t_axis(dur)
    f = 760 + 260 * np.sign(np.sin(2 * np.pi * 1.6 * t))
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.3 * np.sin(4 * np.pi * np.cumsum(f) / SR)
    return x * env(dur, 0.05, release=0.5) * np.linspace(0.6, 1, len(t))


def siren_far():
    x = siren()
    return band(x, 400, 1600) * 0.5


def glitch():
    dur = 0.6
    out = np.zeros(int(SR * dur))
    for i in range(14):
        seg = sq(rng.uniform(120, 2400), rng.uniform(0.015, 0.05), rng.uniform(0.1, 0.5))
        place(out, seg * rng.uniform(0.3, 1), rng.uniform(0, dur - 0.06))
    out += band(noise(dur), 2000, 9000) * 0.25 * env(dur, 0.001, 0.15)
    return out


def seagull():
    out = np.zeros(int(SR * 1.4))
    for k, at in enumerate((0.0, 0.42, 0.8)):
        d = 0.32
        x = sweep(1500, 900, d, 0.6) + 0.4 * sweep(3000, 1800, d, 0.6)
        place(out, x * env(d, 0.02, release=0.1) * (1 - k * 0.2), at)
    return band(out, 500, 5000)


def keys():
    d = 0.06
    x = band(noise(d), 1500, 7000) * env(d, 0.0005, 0.008) + 0.4 * sine(180, d) * env(d, 0.0005, 0.01)
    return x


def blip():
    d = 0.25
    out = np.zeros(int(SR * d))
    for i, n in enumerate((72, 76, 79)):
        place(out, sq(note(n), 0.07) * env(0.07, 0.001, release=0.02), i * 0.07)
    return out * 0.6


def boing():
    d = 0.22
    return sq(1, d) * 0 + sweep(500, 900, d, 0.5) * env(d, 0.002, 0.07) * 0.7


def snap():
    d = 0.12
    return band(noise(d), 1800, 9000) * env(d, 0.0003, 0.012) + 0.3 * sine(2400, d) * env(d, 0.0003, 0.006)


def pop():
    d = 0.15
    return sweep(300, 1200, d, 0.3) * env(d, 0.001, 0.035)


def yawn():
    d = 1.2
    t = t_axis(d)
    f0 = 180 + 120 * np.sin(np.pi * t / d)
    voiced = sum(np.sin(2 * np.pi * np.cumsum(f0 * h) / SR) / h for h in range(1, 7))
    x = band(voiced + 0.4 * noise(d), 250, 2400)
    return x * env(d, 0.15, release=0.4)


def scratch():
    d = 0.4
    t = t_axis(d)
    f = 300 + 900 * np.abs(np.sin(2 * np.pi * 3.5 * t))
    x = band(noise(d), 200, 4000) * 0.6 + 0.5 * np.sin(2 * np.pi * np.cumsum(f) / SR)
    return x * env(d, 0.005, release=0.1)


def skid():
    d = 0.9
    t = t_axis(d)
    x = np.sin(2 * np.pi * np.cumsum(1400 + 200 * np.sin(2 * np.pi * 37 * t)) / SR)
    return (0.4 * x + band(noise(d), 1500, 6000)) * env(d, 0.02, 0.35)


def laughs():
    d = 2.2
    out = np.zeros(int(SR * d))
    for v in range(4):
        base = rng.uniform(140, 260)
        at = rng.uniform(0, 0.15)
        for k in range(8):
            s = 0.12
            t = t_axis(s)
            f = base * (1 + 0.1 * np.sin(2 * np.pi * 4 * t))
            voiced = sum(np.sin(2 * np.pi * np.cumsum(f * h) / SR) / h for h in range(1, 6))
            syl = band(voiced + 0.6 * noise(s), 300, 3000) * env(s, 0.01, 0.05)
            place(out, syl * (1 - k * 0.08), at + k * rng.uniform(0.17, 0.22))
    return out


def unplug():
    d = 0.35
    return band(noise(d), 300, 3000) * env(d, 0.0005, 0.03) + 0.6 * sweep(220, 60, d) * env(d, 0.001, 0.08)


def powerdown():
    d = 1.1
    return (sweep(420, 40, d, 0.5) * 0.6 + 0.3 * saw(60, d) * np.linspace(1, 0, int(SR * d))) * env(d, 0.002, 0.45)


def powerup():
    d = 0.7
    out = np.zeros(int(SR * d))
    for k in range(3):
        place(out, band(noise(0.04), 2000, 8000) * env(0.04, 0.0005, 0.01), k * 0.08)
    place(out, sweep(60, 120, 0.5) * 0.5 * env(0.5, 0.05, release=0.2), 0.15)
    return out


def fax():
    d = 1.8
    t = t_axis(d)
    tone = np.sin(2 * np.pi * 1100 * t) * (np.sin(2 * np.pi * 8 * t) > 0) * 0.4
    mech = band(noise(d), 600, 3000) * (0.5 + 0.5 * np.sin(2 * np.pi * 22 * t)) * 0.5
    return (tone + mech) * env(d, 0.02, release=0.3)


def paperspin():
    d = 0.6
    t = t_axis(d)
    flap = band(noise(d), 800, 6000) * (0.4 + 0.6 * np.abs(np.sin(2 * np.pi * (6 + 18 * t / d) * t)))
    return flap * env(d, 0.01, release=0.15)


def murmur():
    d = 2.5
    out = np.zeros(int(SR * d))
    for _ in range(10):
        s = rng.uniform(0.15, 0.4)
        f = rng.uniform(110, 220)
        tt = t_axis(s)
        syl = sum(np.sin(2 * np.pi * f * h * tt) / h for h in range(1, 5))
        place(out, band(syl, 200, 1500) * env(s, 0.03, release=0.08) * rng.uniform(0.3, 0.8), rng.uniform(0, d - s))
    return out + band(noise(d), 200, 800) * 0.2


def register():
    d = 0.9
    out = np.zeros(int(SR * d))
    place(out, band(noise(0.08), 1000, 6000) * env(0.08, 0.0005, 0.02), 0)
    for k, f in enumerate((2093, 2637)):
        place(out, (sine(f, 0.6) + 0.3 * sine(f * 2.7, 0.6)) * env(0.6, 0.001, 0.18) * 0.6, 0.06 + k * 0.05)
    return out


def cityamb():
    d = 3.0
    t = t_axis(d)
    rumble = band(noise(d), 40, 300) * 0.6
    horn = np.zeros_like(t)
    place(horn, (sq(392, 0.35) + sq(466, 0.35)) * env(0.35, 0.01, release=0.05) * 0.12, 1.2)
    return rumble + band(horn, 200, 3000)


def neon():
    d = 0.8
    t = t_axis(d)
    buzz = sq(120, d) * 0.15 + band(noise(d), 2000, 7000) * 0.1
    flick = (np.sin(2 * np.pi * 9 * t) > 0) * (t < 0.35) + (t >= 0.35)
    return band(buzz, 100, 6000) * flick * env(d, 0.005, release=0.2)


def waves():
    d = 3.2
    t = t_axis(d)
    swell = 0.5 + 0.5 * np.sin(2 * np.pi * 0.4 * t - 1.2)
    return band(noise(d), 200, 2500) * swell * env(d, 0.4, release=0.6)


def hydraulic():
    d = 0.5
    return (band(noise(d), 500, 5000) * env(d, 0.005, 0.12) * 0.6 + sweep(90, 50, d) * env(d, 0.002, 0.15)) * 1.0


def passby():
    d = 1.4
    t = t_axis(d)
    f = 110 * (1.12 - 0.24 * t / d)
    eng = np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.5 * np.sin(4 * np.pi * np.cumsum(f) / SR) + 0.3 * band(noise(d), 100, 900)
    return eng * np.exp(-((t - 0.6) ** 2) / 0.12)


# ---------------- Music bed ----------------
def bed_gta(T):
    L = T['lines']
    W = lambda i, k: L[i]['words'][k]['s']
    dur = T['duration'] + 0.6
    out = np.zeros(int(SR * dur))

    def drums(a, b, bpm, kind='break', vol=1.0):
        beat = 60 / bpm
        k = 0
        while a + k * beat / 2 < b:
            at = a + k * beat / 2
            step = k % 8
            kick = {'break': (0, 3, 5), 'boom': (0, 3, 6), 'stomp': (0, 4), 'four': (0, 2, 4, 6)}[kind]
            if step in kick:
                place(out, sweep(120, 42, 0.32, 0.3) * env(0.32, 0.001, 0.08) * 0.75 * vol, at)
            if step in (2, 6):
                place(out, (band(noise(0.18), 900, 6000) * env(0.18, 0.001, 0.05) + 0.3 * sine(190, 0.18) * env(0.18, 0.001, 0.04)) * 0.5 * vol, at)
            if kind != 'stomp':
                place(out, band(noise(0.04), 7000, 14000) * env(0.04, 0.0005, 0.01) * 0.18 * vol, at)
            k += 1

    def bass(a, b, bpm, notes, vol=0.35, wave=saw):
        beat = 60 / bpm
        k = 0
        while a + k * beat < b:
            n = notes[(k // 2) % len(notes)]
            d = beat * 0.9
            x = band(wave(note(n), d), 30, 900) * env(d, 0.005, 0.25)
            place(out, x * vol, a + k * beat)
            k += 1

    def pad_(a, b, chord, vol=0.07, wave=sine):
        d = b - a
        if d <= 0:
            return
        x = sum(wave(note(n), d) + 0.3 * sine(note(n) * 2, d) for n in chord)
        place(out, x * np.clip(t_axis(d) / 0.4, 0, 1) * np.clip((d - t_axis(d)) / 0.3, 0, 1) * vol, a)

    def arps(a, b, bpm, seqs, vol=0.12, duty=0.25, detune=0.0):
        st = 60 / bpm / 4
        k = 0
        while a + k * st < b:
            at = a + k * st
            seq = seqs[(k // 16) % len(seqs)]
            n = seq[k % len(seq)]
            # detune grows over the range if asked (the boring slow-down)
            dt = detune * ((at - a) / max(0.01, b - a))
            f = note(n) * (1 - dt)
            place(out, sq(f, st * 0.9, duty) * env(st * 0.9, 0.001, st * 0.5) * vol, at)
            k += 1

    # Hook: low pulse
    pad_(0.0, 4.1, (45, 52), 0.08, tri)
    bass(0.3, 4.0, 120, (33, 33, 36, 31), 0.25)
    # Dundee → studio → lemmings: chiptune
    chip = [(60, 64, 67, 72), (57, 60, 64, 69), (53, 57, 60, 65), (55, 59, 62, 67)]
    arps(L[1]['s'] - 0.1, L[6]['s'], 132, chip, 0.11)
    bass(L[1]['s'] - 0.1, L[6]['s'], 132, (48, 45, 41, 43), 0.18, tri)
    # Race'n'Chase: chiptune continues, then goes slow and sour on "boring"
    arps(L[6]['s'], L[8]['s'], 132, chip, 0.1)
    arps(L[8]['s'], L[9]['s'], 66, chip, 0.09, detune=0.08)
    # Bug: silence, then the break
    a = W(9, 2)
    drums(L[10]['s'] - 0.1, L[14]['s'], 100, 'break', 1.0)
    bass(L[10]['s'] - 0.1, L[14]['s'], 100, (45, 45, 48, 43), 0.35)
    arps(L[10]['s'] - 0.1, L[14]['s'], 100, [(69, 72, 76, 72), (67, 71, 74, 71)], 0.06, 0.5)
    pad_(a, L[10]['s'], (45, 52, 57), 0.06)
    # Drags on: lone low pad (stops dead on the plug)
    pull = W(14, 9)
    pad_(L[14]['s'], pull, (40, 47, 52), 0.08)
    # Lean in → outrage: stomp
    drums(L[15]['s'] + 0.2, L[20]['s'], 92, 'stomp', 1.0)
    bass(L[15]['s'] + 0.2, L[20]['s'], 92, (38, 38, 41, 36), 0.33)
    pad_(L[16]['s'], L[20]['s'], (50, 53, 57), 0.05, saw)
    # New York: boom-bap
    drums(L[20]['s'] - 0.05, L[21]['s'], 90, 'boom', 0.9)
    bass(L[20]['s'] - 0.05, L[21]['s'], 90, (40, 43, 45, 38), 0.3, sine)
    # 3D: build to the drop on "3D"
    drop = W(21, 5)
    pad_(L[21]['s'], drop, (45, 52, 57, 64), 0.06, saw)
    drums(drop, L[22]['s'], 104, 'four', 1.0)
    bass(drop, L[22]['s'], 104, (45, 45, 43, 41), 0.35)
    # Vice: synthwave
    arps(L[22]['s'] - 0.1, L[23]['s'], 112, [(64, 67, 71, 76), (62, 66, 69, 74)], 0.1, 0.5)
    pad_(L[22]['s'] - 0.1, L[23]['s'], (52, 56, 59, 64), 0.08, saw)
    drums(L[22]['s'] - 0.1, L[23]['s'], 112, 'four', 0.8)
    # West coast groove: sine bass slides + whistle lead
    bass(L[23]['s'], L[24]['s'], 92, (41, 41, 44, 39), 0.38, sine)
    drums(L[23]['s'], L[24]['s'], 92, 'boom', 0.85)
    wl = sweep(note(77), note(81), 0.5, 0.4) * env(0.5, 0.05, release=0.15) * 0.08
    place(out, wl, L[23]['s'] + 0.1)
    # 2013: big beat building to the record
    drums(L[24]['s'], L[26]['s'], 120, 'four', 1.0)
    bass(L[24]['s'], L[26]['s'], 120, (45, 45, 48, 50), 0.35)
    arps(L[24]['s'], L[26]['s'], 120, [(69, 72, 76, 81)], 0.06, 0.5)
    rz = L[26]['s'] - L[24]['s']
    place(out, band(noise(rz), 2000, 9000) * np.linspace(0, 0.3, int(SR * rz)), L[24]['s'])
    # "The series is called…": almost silence (tiny tick of tension)
    pad_(L[26]['s'], W(27, 0) - 0.05, (33, 40), 0.05, tri)
    # Name and the sixth game: bright major pad, sunrise arps
    pad_(W(27, 0), L[28]['e'], (53, 57, 60, 64), 0.08, saw)
    arps(L[28]['s'], L[28]['e'], 110, [(65, 69, 72, 77), (64, 67, 72, 76)], 0.07, 0.5)
    bass(L[27]['s'], L[28]['e'], 110, (41, 41, 43, 45), 0.25, sine)
    # Callback: the break returns, ends on a hit
    drums(L[29]['s'], L[29]['e'] - 0.2, 100, 'break', 0.9)
    bass(L[29]['s'], L[29]['e'] - 0.2, 100, (45, 45, 48, 43), 0.3)
    end = L[29]['e'] - 0.15
    place(out, (sweep(90, 30, 1.2, 0.3) * env(1.2, 0.002, 0.4) + band(noise(1.2), 40, 400) * env(1.2, 0.002, 0.2)) * 0.9, end)

    # Dynamics: duck under the VO a little, fade tail
    g = np.ones_like(out)
    i0 = int(SR * (L[29]['e'] + 0.9))
    if i0 < len(g):
        g[i0:] = np.linspace(1, 0, len(g) - i0)
    return out * g


if __name__ == '__main__':
    T = json.load(open(os.path.join(HERE, '..', 'src', 'gta', 'timing.json')))
    os.makedirs(S.OUT, exist_ok=True)
    for n in ('siren', 'siren_far', 'glitch', 'seagull', 'keys', 'blip', 'boing', 'snap', 'pop', 'yawn', 'scratch', 'skid', 'laughs', 'unplug', 'powerdown', 'powerup', 'fax', 'paperspin', 'murmur', 'register', 'cityamb', 'neon', 'waves', 'hydraulic', 'passby'):
        save(n, globals()[n](), 0.8)
    save('bed_gta', bed_gta(T), 0.85)
    print('ok')
