"""Original 120 BPM promo beat and one-shot effects for the 25-second promo video.

Run from any directory: python3 assets/audio/promo-beat-v1/compose.py  (Python 3, NumPy, ffmpeg)
Bars follow design/reviews/2026-10-26-promo-video/STORYBOARD.md: 12 bars of 2 s, then a 1 s tail.
The score contains no samples, borrowed melodies, voices, or external recordings.
"""
from pathlib import Path
import json
import subprocess
import wave

import numpy as np

ROOT = Path(__file__).resolve().parent
RATE = 48000
BPM = 120
BEAT = 60 / BPM
BARS = 12
SECONDS = BARS * 4 * BEAT + 1.0
FRAMES = round(SECONDS * RATE)
RNG = np.random.default_rng(261026)
MIX = np.zeros((FRAMES, 2), dtype=np.float64)


def midi(name):
    return (int(name[-1]) + 1) * 12 + {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11}[name[0]] + (1 if "#" in name else 0)


def hz_of(name):
    return 440 * 2 ** ((midi(name) - 69) / 12)


def env(t, attack, decay, length):
    return np.minimum(t / attack, 1) * np.exp(-t / decay) * np.minimum((length - t) / .01, 1)


def tone(name, seconds, voice):
    t = np.arange(round(seconds * RATE)) / RATE
    hz = hz_of(name)
    if voice == "lead":
        # bright square-ish lead: odd harmonics, short pluck
        y = sum(np.sin(2 * np.pi * hz * h * t) / h for h in (1, 3, 5, 7)) * env(t, .004, .22, seconds)
        y += .3 * np.sin(2 * np.pi * hz * 2 * t) * env(t, .002, .06, seconds)
    elif voice == "bass":
        y = (np.sin(2 * np.pi * hz * t) + .35 * np.sin(4 * np.pi * hz * t) + .12 * np.sin(6 * np.pi * hz * t)) * env(t, .006, .28, seconds)
    elif voice == "stab":
        y = sum(np.sin(2 * np.pi * hz * h * t) * .6 ** h for h in range(1, 6)) * env(t, .003, .12, seconds)
    else:  # pad
        y = (np.sin(2 * np.pi * hz * t) + .2 * np.sin(4 * np.pi * hz * t)) * np.sin(np.pi * t / seconds) ** 2
    return y


def kick(length=.32, punch=1.0):
    t = np.arange(round(length * RATE)) / RATE
    f = 48 + 110 * np.exp(-t / .035) * punch
    return np.sin(2 * np.pi * np.cumsum(f) / RATE) * env(t, .001, .13, length)


def noise(length, decay, hp=True):
    t = np.arange(round(length * RATE)) / RATE
    n = RNG.normal(0, 1, len(t))
    if hp:
        n = np.concatenate(([0], np.diff(n)))
    return n * env(t, .001, decay, length)


def clap():
    y = noise(.22, .06) * .6
    for d in (.0, .011, .022):
        y[round(d * RATE):] += noise(.22 - d, .012)[: len(y) - round(d * RATE)] * .5
    return y


def add(y, beat, gain, pan=0.0, buf=MIX):
    start = round(beat * BEAT * RATE)
    if start >= len(buf):
        return
    y = y[: len(buf) - start]
    angle = (pan + 1) * np.pi / 4
    buf[start:start + len(y), 0] += y * gain * np.cos(angle)
    buf[start:start + len(y), 1] += y * gain * np.sin(angle)


# C / G / Am / F, one chord per bar
CHORDS = [("C2", ["C4", "E4", "G4"]), ("G1", ["B3", "D4", "G4"]), ("A1", ["A3", "C4", "E4"]), ("F1", ["A3", "C4", "F4"])]
# two-bar hook, (beat, pitch, length in beats)
HOOK = [
    [(0, "E5", .5), (.5, "G5", .5), (1, "C6", .75), (2, "G5", .5), (2.5, "E5", .5), (3, "G5", .75)],
    [(0, "D5", .5), (.5, "G5", .5), (1, "B5", .75), (2, "A5", .5), (2.5, "G5", .5), (3.5, "D5", .5)],
]
BASS = [(0, 0), (.5, 0), (1.5, 12), (2, 0), (2.5, 0), (3, 7), (3.5, 12)]


def groove(bar, hook=True, hats=True):
    base = bar * 4
    root, chord = CHORDS[bar % 4]
    for b in range(4):
        add(kick(), base + b, .9)
    for b in (1, 3):
        add(clap(), base + b, .38, .05)
    if hats:
        for b in range(8):
            add(noise(.05, .012), base + b * .5, .07 if b % 2 else .04, .3)
    for step, semis in BASS:
        add(tone(transpose(root, semis), .45, "bass"), base + step, .32)
    for step in (.5, 1.5, 2.5, 3.5):
        for p in chord:
            add(tone(p, .3, "stab"), base + step, .05, -.25)
    if hook:
        for step, pitch, length in HOOK[bar % 2]:
            add(tone(pitch, length * BEAT, "lead"), base + step, .085, .15)


NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]


def transpose(name, semis):
    m = midi(name) + semis
    return f"{NAMES[m % 12]}{m // 12 - 1}"


# Bar 1–2: a slam on every beat for the stickers, hook enters in bar 2
for bar in (0, 1):
    for b in range(4):
        add(kick(.45, 1.4), bar * 4 + b, 1.0)
        add(noise(.3, .08), bar * 4 + b, .18)
        root, chord = CHORDS[bar % 4]
        add(tone(root, .5, "bass"), bar * 4 + b, .35)
    if bar == 1:
        for step, pitch, length in HOOK[0]:
            add(tone(pitch, length * BEAT, "lead"), 4 + step, .07, .15)
# riser into bar 3
t = np.arange(round(BEAT * RATE)) / RATE
riser = RNG.normal(0, 1, len(t)) * (t / BEAT) ** 2 * .25
add(np.concatenate(([0], np.diff(riser))), 7, 1.0)
# Bar 3–9: full groove
for bar in range(2, 9):
    groove(bar)
# Bar 10: half-bar breakdown (suspense for the owner quiz), then a snare build
for p in CHORDS[1][1]:
    add(tone(p, 2 * BEAT, "pad"), 36, .06)
for i in range(8):
    add(clap(), 38 + i * .25, .12 + .03 * i)
# Bar 11: chorus returns
groove(10)
# Bar 12: one big hit, then the chord rings into the tail
add(kick(.6, 1.6), 44, 1.1)
add(noise(1.6, .5), 44, .22)
for p in ["C4", "E4", "G4", "C5"]:
    add(tone(p, 3.0, "pad"), 44, .09)
    add(tone(p, 1.2, "lead"), 44, .05)
add(tone("C2", 1.5, "bass"), 44, .4)

MIX -= MIX.mean(axis=0)
fade = np.ones(FRAMES)
fade[-round(.6 * RATE):] = np.linspace(1, 0, round(.6 * RATE))
MIX *= fade[:, None]
MIX *= .8 / np.max(np.abs(MIX))


def write(path, data):
    with wave.open(str(path), "wb") as out:
        out.setparams((2, 2, RATE, len(data), "NONE", "not compressed"))
        out.writeframes((np.clip(data, -1, 1) * 32767).astype("<i2").tobytes())


def mono(y, peak=.8):
    y = y / np.max(np.abs(y)) * peak
    return np.stack([y, y], axis=1)


master = ROOT / "promo-beat-v1.wav"
write(master, MIX)
subprocess.run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", str(master), "-codec:a", "libmp3lame", "-b:a", "192k", str(ROOT / "promo-beat-v1.mp3")], check=True)

# One-shot effects placed by the video timeline
sfx = ROOT / "sfx"
sfx.mkdir(exist_ok=True)
t = np.arange(round(.18 * RATE)) / RATE
pop = np.sin(2 * np.pi * np.cumsum(500 + 900 * (t / .18)) / RATE) * env(t, .002, .05, .18)
write(sfx / "pop.wav", mono(pop))
write(sfx / "slam.wav", mono(kick(.5, 1.6) + noise(.5, .07) * .3))
t = np.arange(round(.5 * RATE)) / RATE
whoosh = np.convolve(RNG.normal(0, 1, len(t)), np.ones(30) / 30, "same") * np.sin(np.pi * t / .5) ** 2
write(sfx / "whoosh.wav", mono(whoosh, .6))
ding = sum(np.sin(2 * np.pi * f * np.arange(round(.9 * RATE)) / RATE) * a for f, a in ((1568, 1), (2093, .6), (3136, .25)))
write(sfx / "ding.wav", mono(ding * env(np.arange(len(ding)) / RATE, .002, .25, .9), .6))
write(sfx / "crash.wav", mono(np.pad(kick(.8, 1.8), (0, round(.4 * RATE))) + noise(1.2, .4) * .5))

stats = {
    "title": "毛孩子全明星 · 宣传片节拍 / Promo Beat v1",
    "bpm": BPM, "meter": "4/4", "key": "C major", "bars": BARS, "tailSeconds": 1.0,
    "seconds": SECONDS, "sampleRate": RATE,
    "peakDbFS": float(20 * np.log10(np.max(np.abs(MIX)))),
    "rmsDbFS": float(20 * np.log10(np.sqrt(np.mean(MIX ** 2)))),
    "sfx": sorted(p.name for p in sfx.glob("*.wav")),
    "source": "Original score, additive synthesis and seeded noise; no external samples.",
}
(ROOT / "manifest.json").write_text(json.dumps(stats, ensure_ascii=False, indent=2) + "\n")
print(json.dumps(stats, ensure_ascii=False, indent=2))
