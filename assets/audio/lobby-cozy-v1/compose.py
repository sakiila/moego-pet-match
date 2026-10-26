"""Original lobby score and deterministic synthesis. Requires Python 3, NumPy, ffmpeg.

Run from any directory: python3 assets/audio/lobby-cozy-v1/compose.py
The score contains no samples, borrowed melodies, voices, or external recordings.
"""
from pathlib import Path
import json
import subprocess
import wave

import numpy as np

ROOT = Path(__file__).resolve().parent
RATE = 44100
BPM = 100
BEAT = 60 / BPM
SECONDS = 32 * 4 * BEAT
FRAMES = round(SECONDS * RATE)
RNG = np.random.default_rng(261026)
MIX = np.zeros((FRAMES, 2), dtype=np.float64)


def midi(name):
    return (int(name[-1]) + 1) * 12 + {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11}[name[0]] + (1 if "#" in name else 0)


def note(name, seconds, voice):
    t = np.arange(round(seconds * RATE)) / RATE
    hz = 440 * 2 ** ((midi(name) - 69) / 12)
    if voice == "mallet":
        y = np.sin(2 * np.pi * hz * t) * np.exp(-t / .27)
        y += .19 * np.sin(2 * np.pi * hz * 4.01 * t) * np.exp(-t / .062)
        y += .035 * np.sin(2 * np.pi * hz * 9.2 * t) * np.exp(-t / .025)
        attack = .006
    elif voice == "pluck":
        y = sum((np.sin(2 * np.pi * hz * h * t) * np.exp(-t / (.28 / h ** .3)) / h ** 1.8) for h in range(1, 7))
        attack = .004
    elif voice == "bass":
        y = (np.sin(2 * np.pi * hz * t) + .14 * np.sin(4 * np.pi * hz * t)) * np.exp(-t / .35)
        attack = .018
    elif voice == "pad":
        y = (np.sin(2 * np.pi * hz * t) + .12 * np.sin(4 * np.pi * hz * t)) * np.sin(np.pi * t / seconds) ** 2
        attack = .12
    else:
        y = (np.sin(2 * np.pi * hz * t) * np.exp(-t / .5) + .08 * np.sin(2 * np.pi * hz * 2.76 * t) * np.exp(-t / .12))
        attack = .009
    y *= np.minimum(t / attack, 1)
    y *= np.minimum((seconds - t) / .025, 1)
    return y


def add(y, beat, gain, pan=0):
    start = round(beat * BEAT * RATE)
    idx = (start + np.arange(len(y))) % FRAMES
    angle = (pan + 1) * np.pi / 4
    MIX[idx, 0] += y * gain * np.cos(angle)
    MIX[idx, 1] += y * gain * np.sin(angle)


def play(name, beat, length, gain, voice, pan=0):
    add(note(name, length, voice), beat, gain, pan)


# Each tuple is (beat within the bar, pitch). Empty spaces are intentional rests.
A = [
    [(0.5, "E5"), (1.25, "G5"), (2, "A5"), (3, "G5")],
    [(0, "E5"), (1.5, "D5"), (2.5, "C5")],
    [(0.5, "D5"), (1.25, "F5"), (2, "A5"), (3, "G5")],
    [(0, "E5"), (1.5, "D5"), (3, "G4")],
    [(0.5, "E5"), (1.25, "G5"), (2, "B5"), (3, "A5")],
    [(0, "G5"), (1.5, "E5"), (2.5, "C5")],
    [(0.5, "D5"), (1.25, "F5"), (2, "E5"), (3, "D5")],
    [(0, "C5"), (2, "E5"), (3.5, "D5")],
]
B = [
    [(0, "A5"), (1.5, "G5"), (2.5, "E5")],
    [(0.5, "G5"), (1.25, "E5"), (2, "D5"), (3, "C5")],
    [(0, "F5"), (1.5, "A5"), (2.5, "G5")],
    [(0, "E5"), (2, "D5")],
    [(0.5, "E5"), (1.25, "G5"), (2, "A5"), (3, "C6")],
    [(0, "B5"), (1.5, "G5"), (2.5, "E5")],
    [(0.5, "F5"), (1.25, "E5"), (2, "D5"), (3, "G5")],
    [(0, "E5"), (1.5, "D5"), (3, "G4")],
]
# C6 / Am7 / Dm7 / G6 / Em7 / Am7 / Dm7 / G7.
CHORDS = [
    ("C3", "G3", ["E4", "G4", "A4", "C5"]),
    ("A2", "E3", ["E4", "G4", "A4", "C5"]),
    ("D3", "A3", ["D4", "F4", "A4", "C5"]),
    ("G2", "D3", ["D4", "E4", "G4", "B4"]),
    ("E3", "B3", ["D4", "E4", "G4", "B4"]),
    ("A2", "E3", ["C4", "E4", "G4", "A4"]),
    ("D3", "A3", ["D4", "F4", "A4", "C5"]),
    ("G2", "D3", ["D4", "F4", "G4", "B4"]),
]

for bar in range(32):
    phrase, local = divmod(bar, 8)
    base = bar * 4
    root, fifth, chord = CHORDS[local]
    motif = B[local] if phrase == 2 else A[local]
    for step, pitch in motif:
        # A little answer in the second statement, a quieter final return.
        if phrase == 1 and local == 7 and step >= 2:
            pitch = "G5" if step == 2 else "D5"
        gain = (.15 if phrase == 2 else .135) * (0.9 if phrase == 3 else 1)
        play(pitch, base + step, 1.25, gain * RNG.uniform(.94, 1.04), "mallet", -.10)
    for step, strength in [(0, 1), (1.55, .65), (2.5, .8), (3.55, .55)]:
        for string, pitch in enumerate(chord):
            play(pitch, base + step + string * .014, .85, .035 * strength * RNG.uniform(.94, 1.04), "pluck", -.34)
    play(root, base, 1.2, .125, "bass", .04)
    play(fifth, base + 2, .95, .085, "bass", .04)
    if phrase == 2:
        for pitch in chord[:3]:
            play(pitch, base, 2.25, .012, "pad", .3)
    if local in (1, 5) and phrase != 2:
        play(chord[-1], base + 3.5, 1.6, .025, "bell", .4)
    for step in (.56, 1.56, 2.56, 3.56):
        t = np.arange(round(.075 * RATE)) / RATE
        n = RNG.normal(0, 1, len(t))
        n = np.concatenate(([0], np.diff(n)))
        shake = n * np.exp(-t / .014) * np.minimum(t / .004, 1) * np.minimum((.075 - t) / .01, 1)
        add(shake, base + step, .006 if phrase == 2 else .0045, .48)
    for step in (1, 3):
        t = np.arange(round(.08 * RATE)) / RATE
        tap = np.sin(2 * np.pi * 780 * t) * np.exp(-t / .014) * np.minimum(t / .002, 1)
        add(tap, base + step, .014, .2)

# Circular room reflections preserve the previous phrase's decay at the seam.
dry = MIX.copy()
for delay, level in [(0.041, .12), (.073, .10), (.127, .07), (.187, .045), (.293, .022)]:
    MIX += np.roll(dry[:, ::-1], round(delay * RATE), axis=0) * level
MIX -= MIX.mean(axis=0)
MIX *= .75 / np.max(np.abs(MIX))
master = ROOT / "little-paws-afternoon-v1.wav"
with wave.open(str(master), "wb") as out:
    out.setparams((2, 2, RATE, FRAMES, "NONE", "not compressed"))
    out.writeframes((MIX * 32767).astype("<i2").tobytes())

preview = ROOT / "little-paws-afternoon-v1.mp3"
subprocess.run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", str(master), "-codec:a", "libmp3lame", "-b:a", "112k", "-metadata", "title=Little Paws Afternoon", str(preview)], check=True)
stats = {
    "title": "毛孩子的小小午后 / Little Paws Afternoon",
    "bpm": BPM, "meter": "4/4", "key": "C major", "bars": 32,
    "seconds": SECONDS, "sampleRate": RATE, "frames": FRAMES,
    "peakDbFS": float(20 * np.log10(np.max(np.abs(MIX)))),
    "rmsDbFS": float(20 * np.log10(np.sqrt(np.mean(MIX ** 2)))),
    "seamDelta": float(np.max(np.abs(MIX[0] - MIX[-1]))),
    "source": "Original score, additive synthesis and seeded noise; no external samples.",
}
(ROOT / "manifest.json").write_text(json.dumps(stats, ensure_ascii=False, indent=2) + "\n")
print(json.dumps(stats, ensure_ascii=False, indent=2))
