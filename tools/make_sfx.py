"""Synthesize the sound effects for "The Last Slice" into public/sfx/*.wav.

Everything is generated from sine waves and filtered noise, so there are no
third-party samples or licences to worry about. Run: python3 tools/make_sfx.py
"""

import os
import wave

import numpy as np

SR = 44100
OUT = os.path.join(os.path.dirname(__file__), '..', 'public', 'sfx')
rng = np.random.default_rng(7)


def t_axis(dur):
    return np.arange(int(SR * dur)) / SR


def env(dur, attack=0.005, decay=None, release=None):
    """Attack then exponential decay (decay = time constant in seconds)."""
    t = t_axis(dur)
    a = np.clip(t / max(attack, 1e-4), 0, 1)
    d = np.exp(-t / decay) if decay else np.ones_like(t)
    e = a * d
    if release:
        r = np.clip((dur - t) / release, 0, 1)
        e *= r
    return e


def band(x, lo, hi):
    """FFT band-pass filter (lo/hi in Hz, soft edges)."""
    n = len(x)
    f = np.fft.rfftfreq(n, 1 / SR)
    X = np.fft.rfft(x)
    g = 1 / (1 + (lo / np.maximum(f, 1)) ** 4) if lo else 1
    g = g * (1 / (1 + (f / hi) ** 4) if hi else 1)
    return np.fft.irfft(X * g, n)


def noise(dur):
    return rng.standard_normal(int(SR * dur))


def sweep(f0, f1, dur, curve=1.0):
    t = t_axis(dur)
    f = f0 + (f1 - f0) * (t / dur) ** curve
    return np.sin(2 * np.pi * np.cumsum(f) / SR)


def norm(x, peak=0.9):
    m = np.max(np.abs(x)) or 1
    return x / m * peak


def save(name, x, peak=0.9):
    x = norm(x, peak)
    data = (x * 32767).astype(np.int16)
    with wave.open(os.path.join(OUT, name + '.wav'), 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(data.tobytes())


def pad(x, dur):
    out = np.zeros(int(SR * dur))
    out[: len(x)] = x[: len(out)]
    return out


def place(buf, x, at):
    i = int(SR * at)
    j = min(len(buf), i + len(x))
    buf[i:j] += x[: j - i]


# --- Park ambience: soft wind plus occasional birds (22 s) ---
def ambience():
    dur = 22.5
    wind = band(noise(dur), 80, 700)
    t = t_axis(dur)
    wind *= 0.6 + 0.4 * np.sin(2 * np.pi * t / 7.3) * np.sin(2 * np.pi * t / 3.1 + 1)
    out = norm(wind, 0.25)
    for at in [0.8, 1.05, 4.2, 6.9, 7.1, 11.5, 14.8, 15.0, 18.6, 20.9]:
        d = 0.09
        f0 = rng.uniform(2800, 3600)
        chirp = sweep(f0, f0 * rng.uniform(1.3, 1.6), d, 0.6) * env(d, 0.004, 0.04)
        place(out, chirp * 0.16, at)
    return out


# --- Short percussive hit for each close-up ---
def hit():
    d = 0.4
    body = sweep(140, 60, d, 0.4) * env(d, 0.002, 0.11)
    click = band(noise(0.02), 1500, 8000) * env(0.02, 0.0005, 0.004)
    return body + pad(click, d) * 0.6


# --- Everyone notices the slice: low "dun" with a rising swish ---
def notice():
    d = 1.2
    dun = (sweep(75, 52, d, 0.5) + 0.5 * sweep(150, 104, d, 0.5)) * env(d, 0.01, 0.35)
    sw = band(noise(0.35), 600, 4000) * np.linspace(0, 1, int(SR * 0.35)) ** 2
    out = np.zeros(int(SR * d))
    place(out, sw * 0.5, 0)
    place(out, dun, 0.08)
    return out


# --- Standoff tension: wavering high whistle over wind (3 s) ---
def tension():
    d = 3.2
    t = t_axis(d)
    vib = 1 + 0.006 * np.sin(2 * np.pi * 5.5 * t)
    f = 880 + 60 * (t / d)
    tone = np.sin(2 * np.pi * np.cumsum(f * vib) / SR) + 0.3 * np.sin(2 * np.pi * np.cumsum(1.5 * f * vib) / SR)
    tone *= np.clip(t / 1.2, 0, 1) * np.clip((d - t) / 0.4, 0, 1) * 0.35
    wind = band(noise(d), 200, 1200) * (0.5 + 0.5 * np.sin(2 * np.pi * t / 1.6)) * 0.4
    return tone + norm(wind, 0.3)


def click():
    d = 0.03
    return band(noise(d), 2500, 9000) * env(d, 0.0005, 0.005)


def swish():
    d = 0.3
    t = t_axis(d)
    x = band(noise(d), 900, 5000)
    return x * np.sin(np.pi * t / d) ** 2


def whoosh():
    d = 0.7
    t = t_axis(d)
    parts = [band(noise(d), lo, lo * 2.2) * np.exp(-((t - c) ** 2) / 0.012) for lo, c in [(250, 0.15), (500, 0.28), (1000, 0.4), (2000, 0.5)]]
    return sum(parts)


# --- The bonk: hollow wood knock + low thump ---
def bonk():
    d = 0.9
    knock = sum(a * np.sin(2 * np.pi * f * t_axis(d)) for f, a in [(520, 1), (1040, 0.55), (1630, 0.35), (2400, 0.2)])
    knock *= env(d, 0.001, 0.07)
    thump = sweep(160, 55, d, 0.3) * env(d, 0.001, 0.18)
    crack = band(noise(0.03), 1500, 7000) * env(0.03, 0.0003, 0.006)
    return knock * 0.9 + thump * 1.2 + pad(crack, d) * 0.7


# --- Dizzy cartoon ring after the bonk ---
def ring():
    d = 1.4
    t = t_axis(d)
    f = 1500 * (1 + 0.05 * np.sin(2 * np.pi * 9 * t))
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.4 * np.sin(2 * np.pi * np.cumsum(f * 2.01) / SR)
    return tone * env(d, 0.01, 0.45)


def thud():
    d = 0.35
    body = sweep(110, 45, d, 0.4) * env(d, 0.002, 0.08)
    dirt = band(noise(d), 60, 500) * env(d, 0.002, 0.05)
    return body + dirt * 0.8


def step():
    d = 0.12
    f = rng.uniform(0.9, 1.1)
    return band(noise(d), 80 * f, 900 * f) * env(d, 0.002, 0.025) + sweep(120, 70, d) * env(d, 0.001, 0.02) * 0.4


def rustle():
    d = 0.45
    t = t_axis(d)
    jitter = np.abs(band(noise(d), 0, 40))
    jitter /= jitter.max()
    return band(noise(d), 1200, 6000) * jitter * np.sin(np.pi * t / d)


# --- Bite crunch: crackle bursts with a little body ---
def crunch():
    d = 0.32
    out = np.zeros(int(SR * d))
    for at in np.sort(rng.uniform(0, 0.22, 26)):
        dd = 0.012
        place(out, band(noise(dd), 1800, 9000) * env(dd, 0.0003, 0.003) * rng.uniform(0.4, 1), at)
    body = band(noise(d), 150, 900) * env(d, 0.002, 0.06)
    return out + body * 0.5


def munch():
    d = 0.16
    return band(noise(d), 120, 900) * np.sin(np.pi * t_axis(d) / d) ** 2


def gulp():
    d = 0.22
    return sweep(320, 110, d, 0.6) * np.sin(np.pi * t_axis(d) / d) ** 1.5


# --- Sad trombone: four falling notes, the last one wobbling ---
def sadtrombone():
    notes = [(233.1, 0.42), (220.0, 0.42), (207.7, 0.42), (196.0, 1.3)]
    out = []
    for i, (f, d) in enumerate(notes):
        t = t_axis(d)
        vib = 1 + (0.025 * np.sin(2 * np.pi * 5 * t) if i == 3 else 0)
        bright = np.clip(t / 0.12, 0, 1)  # "wah": brighter after the attack
        phase = 2 * np.pi * np.cumsum(f * vib) / SR
        tone = sum((1 / n) * (bright if n > 2 else 1) * np.sin(n * phase) for n in range(1, 9))
        tone *= np.clip(t / 0.03, 0, 1) * np.clip((d - t) / 0.08, 0, 1)
        out.append(tone)
    return np.concatenate(out)


# --- Bar: low room tone, a fan hum, and desert wind leaking through the door ---
def bar_ambience():
    dur = 22.5
    t = t_axis(dur)
    room = band(noise(dur), 40, 300) * 0.5
    hum = 0.08 * np.sin(2 * np.pi * 60 * t) * (1 + 0.3 * np.sin(2 * np.pi * 0.5 * t))
    wind = band(noise(dur), 300, 1500) * (0.4 + 0.3 * np.sin(2 * np.pi * t / 6.1))
    return norm(room, 0.3) + hum + norm(wind, 0.12)


def coins():
    """Three coins dropped and slid on stone."""
    d = 0.7
    out = np.zeros(int(SR * d))
    for i, at in enumerate([0.0, 0.07, 0.13]):
        x = sum(a * np.sin(2 * np.pi * f * t_axis(0.35)) for f, a in [(2900 + i * 230, 1), (4700 + i * 310, 0.6), (6900, 0.3)])
        place(out, x * env(0.35, 0.001, 0.08), at)
    slide = band(noise(0.3), 1500, 6000) * np.linspace(1, 0, int(SR * 0.3)) * 0.25
    place(out, slide, 0.2)
    return out


def pour():
    d = 0.45
    t = t_axis(d)
    x = band(noise(d), 300, 2500) * (0.6 + 0.4 * np.sin(2 * np.pi * 23 * t))
    rising = sweep(500, 900, d) * 0.15
    return (x + rising) * np.clip(t / 0.03, 0, 1) * np.clip((d - t) / 0.08, 0, 1)


def ice():
    d = 0.4
    out = np.zeros(int(SR * d))
    for at in [0.0, 0.06, 0.15]:
        f = rng.uniform(3000, 4500)
        place(out, (np.sin(2 * np.pi * f * t_axis(0.12)) + 0.5 * np.sin(2 * np.pi * f * 1.7 * t_axis(0.12))) * env(0.12, 0.0005, 0.025), at)
    return out


def glass():
    d = 0.3
    x = sum(a * np.sin(2 * np.pi * f * t_axis(d)) for f, a in [(1900, 1), (3300, 0.5), (5200, 0.25)])
    return x * env(d, 0.0005, 0.06)


# ======================= LeBron short =======================
def crowd():
    """Arena crowd swelling into a roar, with scattered claps."""
    d = 4.0
    t = t_axis(d)
    roar = band(noise(d), 250, 2500) * (0.25 + 0.75 * np.clip(t / 0.6, 0, 1)) * np.clip((d - t) / 1.5, 0, 1)
    out = norm(roar, 0.6)
    for at in rng.uniform(0.2, 3.2, 70):
        place(out, band(noise(0.03), 900, 5000) * env(0.03, 0.001, 0.008) * rng.uniform(0.1, 0.35), at)
    return out


def buzzer():
    d = 0.9
    t = t_axis(d)
    sq = np.sign(np.sin(2 * np.pi * 196 * t)) * 0.5 + np.sign(np.sin(2 * np.pi * 247 * t)) * 0.3
    return band(sq, 100, 3000) * np.clip(t / 0.01, 0, 1) * np.clip((d - t) / 0.05, 0, 1)


def netswish():
    d = 0.35
    return band(noise(d), 2500, 9000) * env(d, 0.01, 0.09) + band(noise(d), 600, 2000) * env(d, 0.005, 0.05) * 0.4


def bounce():
    d = 0.18
    return sweep(150, 80, d, 0.4) * env(d, 0.001, 0.035) + band(noise(d), 800, 3000) * env(d, 0.0005, 0.006) * 0.5


def shutter():
    d = 0.25
    out = np.zeros(int(SR * d))
    for at in (0.0, 0.05):
        place(out, band(noise(0.02), 1500, 8000) * env(0.02, 0.0005, 0.005), at)
    place(out, sweep(3000, 2200, 0.15) * env(0.15, 0.002, 0.03) * 0.2, 0.02)
    return out


def riser():
    d = 2.0
    t = t_axis(d)
    tone = sweep(120, 900, d, 2.0) * 0.4
    hiss = band(noise(d), 1500, 8000) * (t / d) ** 2
    return (tone + hiss) * np.clip((t / d) ** 1.5, 0, 1)


def boom():
    d = 2.2
    sub = sweep(70, 32, d, 0.3) * env(d, 0.002, 0.6)
    hit = band(noise(0.15), 60, 600) * env(0.15, 0.001, 0.05)
    tail = band(noise(d), 100, 900) * env(d, 0.01, 0.5) * 0.25
    return sub * 1.3 + pad(hit, d) + tail


def alarm():
    d = 0.9
    out = np.zeros(int(SR * d))
    for at in (0.0, 0.2, 0.45, 0.65):
        place(out, np.sign(np.sin(2 * np.pi * 2100 * t_axis(0.12))) * env(0.12, 0.001, 0.08) * 0.4, at)
    return out


def bed():
    """Quiet, steady beat that builds: kick, off-beat hat, soft minor pad. 41 s at 92 bpm."""
    dur, bpm = 42.0, 92
    beat = 60 / bpm
    out = np.zeros(int(SR * dur))
    t = t_axis(dur)
    # Pad: Am - F - C - G, one chord per 2 bars
    chords = [(220.0, 261.6, 329.6), (174.6, 220.0, 261.6), (196.0, 261.6, 329.6), (196.0, 246.9, 293.7)]
    bar = beat * 4
    for i in range(int(dur / (bar * 2)) + 1):
        c = chords[i % 4]
        s0 = i * bar * 2
        n = int(SR * bar * 2)
        tt = t_axis(bar * 2)
        tone = sum(np.sin(2 * np.pi * f * tt) + 0.3 * np.sin(2 * np.pi * f * 2 * tt) for f in c)
        tone *= np.clip(tt / 0.4, 0, 1) * np.clip((bar * 2 - tt) / 0.4, 0, 1) * 0.08
        place(out, tone, s0)
    # Drums come in after the hook and get busier toward the reveal
    k = 0
    while k * beat < dur:
        at = k * beat
        if at > 3.6:
            place(out, (sweep(110, 45, 0.3, 0.3) * env(0.3, 0.001, 0.07)) * 0.55, at)
            if at > 10.8:
                place(out, band(noise(0.05), 6000, 12000) * env(0.05, 0.0005, 0.012) * 0.25, at + beat / 2)
            if at > 23.5 and k % 2 == 1:
                place(out, band(noise(0.12), 900, 5000) * env(0.12, 0.001, 0.04) * 0.35, at)
        k += 1
    # Duck everything right before the name drop, then let it land
    fade = np.ones_like(out)
    a, b = int(SR * 37.0), int(SR * 37.4)
    fade[a:b] = np.linspace(1, 0.1, b - a)
    fade[b:] = 0.1
    c = int(SR * 38.25)
    fade[c:] = 1.0
    return out * fade


# ======================= Messi short =======================
def whistle():
    d = 0.6
    t = t_axis(d)
    f = 2800 * (1 + 0.04 * np.sign(np.sin(2 * np.pi * 28 * t)))
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR) + band(noise(d), 2400, 3600) * 0.3
    return tone * np.clip(t / 0.02, 0, 1) * np.clip((d - t) / 0.06, 0, 1)


def clang():
    d = 1.4
    x = sum(a * np.sin(2 * np.pi * f * t_axis(d)) * env(d, 0.001, dk) for f, a, dk in [(220, 1, 0.5), (563, 0.7, 0.35), (1180, 0.5, 0.2), (2310, 0.3, 0.12)])
    return x + pad(band(noise(0.04), 1500, 8000) * env(0.04, 0.0005, 0.01), d) * 0.8


def crickets():
    d = 4.0
    out = np.zeros(int(SR * d))
    for at in np.arange(0, d - 0.2, 0.42):
        for k in range(3):
            place(out, np.sin(2 * np.pi * 4600 * t_axis(0.025)) * env(0.025, 0.002, 0.008) * 0.5, at + k * 0.045)
    return out + band(noise(d), 100, 500) * 0.05


def engine():
    d = 2.2
    t = t_axis(d)
    hum = band(noise(d), 80, 900) * (0.6 + 0.4 * np.sin(np.pi * t / d))
    return hum + 0.2 * np.sin(2 * np.pi * 110 * t) * np.sin(np.pi * t / d)


def kick():
    d = 0.2
    return sweep(180, 70, d, 0.4) * env(d, 0.001, 0.03) + band(noise(d), 500, 2500) * env(d, 0.0005, 0.01) * 0.6


def rain():
    d = 3.0
    out = band(noise(d), 1500, 9000) * 0.25
    for at in rng.uniform(0, d - 0.05, 160):
        place(out, band(noise(0.01), 2000, 8000) * env(0.01, 0.0003, 0.003) * rng.uniform(0.1, 0.4), at)
    t = t_axis(d)
    return out * np.clip(t / 0.3, 0, 1) * np.clip((d - t) / 0.4, 0, 1)


def firework():
    d = 2.0
    out = boom()[: int(SR * d)] * 0.5
    for at in rng.uniform(0.15, 1.5, 50):
        place(out, band(noise(0.015), 2000, 9000) * env(0.015, 0.0003, 0.004) * rng.uniform(0.1, 0.4), at)
    return out


def ding():
    d = 0.9
    return sum(a * np.sin(2 * np.pi * f * t_axis(d)) for f, a in [(1568, 1), (3136, 0.3), (4704, 0.12)]) * env(d, 0.002, 0.3)


def tick():
    d = 0.06
    return band(noise(d), 2000, 7000) * env(d, 0.0005, 0.006)


def scribble():
    d = 0.6
    t = t_axis(d)
    return band(noise(d), 1500, 6000) * (0.4 + 0.6 * np.abs(np.sin(2 * np.pi * 7 * t))) * np.sin(np.pi * t / d) * 0.6


def bed_messi():
    """Emotional bed: minor pad; drums from the move to Spain; a dip for the heartbreak;
    a full lift at the World Cup; silence before the name; resolve after."""
    dur, bpm = 61.0, 88
    beat = 60 / bpm
    out = np.zeros(int(SR * dur))
    chords = [(220.0, 261.6, 329.6), (174.6, 220.0, 261.6), (261.6, 329.6, 392.0), (196.0, 246.9, 293.7)]
    bar = beat * 4
    for i in range(int(dur / (bar * 2)) + 1):
        c = chords[i % 4]
        tt = t_axis(bar * 2)
        tone = sum(np.sin(2 * np.pi * f * tt) + 0.25 * np.sin(2 * np.pi * f * 2 * tt) + 0.12 * np.sin(2 * np.pi * f / 2 * tt) for f in c)
        tone *= np.clip(tt / 0.5, 0, 1) * np.clip((bar * 2 - tt) / 0.5, 0, 1) * 0.07
        place(out, tone, i * bar * 2)
    k = 0
    while k * beat < dur:
        at = k * beat
        in_drums = (22.55 <= at < 36.54) or (45.74 <= at < 51.90)
        if in_drums:
            place(out, (sweep(110, 45, 0.3, 0.3) * env(0.3, 0.001, 0.07)) * 0.55, at)
            place(out, band(noise(0.05), 6000, 12000) * env(0.05, 0.0005, 0.012) * 0.22, at + beat / 2)
            if k % 2 == 1:
                place(out, band(noise(0.12), 900, 5000) * env(0.12, 0.001, 0.04) * 0.3, at)
            if at >= 45.74:
                place(out, band(noise(0.05), 6000, 12000) * env(0.05, 0.0005, 0.01) * 0.15, at + beat / 4)
        k += 1
    g = np.ones_like(out)
    seg = lambda a, b, v0, v1: g.__setitem__(slice(int(SR * a), int(SR * b)), np.linspace(v0, v1, int(SR * b) - int(SR * a)))
    seg(36.34, 37.14, 1.0, 0.55)  # heartbreak: thinner
    g[int(SR * 37.14) : int(SR * 45.54)] = 0.55
    seg(45.54, 45.94, 0.55, 1.25)  # the lift
    g[int(SR * 45.94) : int(SR * 51.80)] = 1.25
    seg(51.80, 52.15, 1.25, 0.0)  # silence before the name
    g[int(SR * 52.15) : int(SR * 54.40)] = 0.0
    g[int(SR * 54.40) :] = 0.9
    tail = int(SR * 57.39)
    g[tail:] *= np.linspace(1, 0, len(g) - tail)
    return out * g


# ---------- Retro test short (PS1 look) ----------

def square(f, dur, duty=0.5):
    ph = (np.cumsum(np.full(int(SR * dur), f)) / SR) % 1
    return np.where(ph < duty, 1.0, -1.0)


def blip():
    d = 0.14
    t = t_axis(d)
    f = np.where(t < 0.05, 988, 1319)
    return np.where((np.cumsum(f) / SR) % 1 < 0.5, 1.0, -1.0) * env(d, 0.001, 0.08) * 0.5


def glitch():
    d = 0.35
    x = noise(d)
    x = np.repeat(x[::40], 40)[: int(SR * d)]  # sample-and-hold "bit crush"
    x = x * square(60, d, 0.3) * 0.6 + square(180, d, 0.25) * 0.25 * (t_axis(d) % 0.07 < 0.035)
    return x * env(d, 0.001, 0.15)


def laser():
    d = 0.5
    return (square(1, d) * 0 + np.sign(sweep(2400, 300, d, 0.6))) * env(d, 0.002, 0.25) * 0.4 + band(noise(d), 3000, 9000) * env(d, 0.001, 0.05) * 0.3


def shrink():
    d = 0.45
    return np.sign(sweep(900, 120, d, 0.7)) * env(d, 0.002, 0.25) * 0.35


def bed_ps1():
    """Chiptune bed timed to src/ps1/timing.json: arpeggio intro, drums from rule one,
    thinner for the slice, a lift through the pose run, a little resolve at the end."""
    import json
    tm = json.load(open(os.path.join(os.path.dirname(__file__), '..', 'src', 'ps1', 'timing.json')))
    L = [l['s'] for l in tm['lines']]
    dur = tm['duration'] + 1.0
    bpm = 132
    step = 60 / bpm / 4
    out = np.zeros(int(SR * dur))
    prog = [(220.0, 261.6, 329.6), (174.6, 220.0, 261.6), (196.0, 246.9, 293.7), (164.8, 207.7, 246.9)]
    n = int(dur / step)
    for i in range(n):
        at = i * step
        if at > L[10] + 0.9:
            break
        bar = int(i // 16)
        c = prog[bar % 4]
        note = c[[0, 1, 2, 1][i % 4]] * (2 if (i // 4) % 2 else 1)
        thin = L[5] <= at < L[6]
        place(out, square(note, step * 0.9, 0.25) * env(step * 0.9, 0.001, 0.06) * (0.05 if thin else 0.08), at)
        if i % 8 == 0:
            place(out, square(c[0] / 2, step * 6, 0.5) * env(step * 6, 0.002, 0.3) * 0.09, at)
        drums = L[1] - 0.05 <= at < L[10] - 0.1 and not thin
        if drums:
            if i % 8 == 0:
                place(out, sweep(150, 45, 0.18, 0.4) * env(0.18, 0.001, 0.05) * 0.5, at)
            if i % 8 == 4:
                place(out, band(noise(0.1), 1200, 6000) * env(0.1, 0.001, 0.03) * 0.3, at)
            if i % 2 == 0:
                place(out, band(noise(0.03), 7000, 12000) * env(0.03, 0.0005, 0.008) * 0.12, at)
    # Resolve jingle on the last line.
    for k, f in enumerate([523.3, 659.3, 784.0, 1046.5]):
        place(out, square(f, 0.25, 0.25) * env(0.25, 0.001, 0.12) * 0.12, L[10] + 0.95 + k * 0.09)
    tail = int(SR * (dur - 0.6))
    out[tail:] *= np.linspace(1, 0, len(out) - tail)
    return out


if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    import sys
    if len(sys.argv) > 1:  # only the named sounds, e.g. python3 tools/make_sfx.py blip bed_ps1
        for n in sys.argv[1:]:
            save(n, globals()[n](), 0.8)
        raise SystemExit
    save('ambience', ambience(), 0.5)
    save('hit', hit())
    save('notice', notice())
    save('tension', tension(), 0.6)
    save('click', click(), 0.5)
    save('swish', swish(), 0.6)
    save('whoosh', whoosh(), 0.8)
    save('bonk', bonk(), 0.95)
    save('ring', ring(), 0.5)
    save('thud', thud())
    save('step', step(), 0.6)
    save('rustle', rustle(), 0.5)
    save('crunch', crunch(), 0.9)
    save('munch', munch(), 0.6)
    save('gulp', gulp(), 0.7)
    save('sadtrombone', sadtrombone(), 0.8)
    save('bar_ambience', bar_ambience(), 0.5)
    save('coins', coins(), 0.7)
    save('pour', pour(), 0.7)
    save('ice', ice(), 0.6)
    save('glass', glass(), 0.6)
    for n in ('whistle', 'clang', 'crickets', 'engine', 'kick', 'rain', 'firework', 'ding', 'tick', 'scribble', 'bed_messi'):
        save(n, globals()[n](), 0.8)
    for n in ('crowd', 'buzzer', 'netswish', 'bounce', 'shutter', 'riser', 'boom', 'alarm', 'bed'):
        save(n, globals()[n](), 0.8)
    print('wrote', sorted(os.listdir(OUT)))
