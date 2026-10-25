"""Rebuild the audition assets from the preserved recording; requires ffmpeg."""

from pathlib import Path
import hashlib
import json
import subprocess
import wave

ROOT = Path(__file__).resolve().parent
RATE = 48000
SEGMENTS = [
    ("nice", "take-01", 2.245, 2.875),
    ("great", "take-02", 4.085, 4.665),
    ("amazing", "take-03", 6.055, 6.815),
    ("wow", "take-04", 8.090, 8.585),
]


def run(*args):
    return subprocess.run(args, check=True, capture_output=True)


def ffmpeg(*args):
    return run("ffmpeg", "-hide_banner", "-nostdin", "-y", *args)


def stats(stderr):
    text = stderr.decode()
    # ffmpeg may print its final progress line after the loudnorm JSON.
    return json.JSONDecoder().raw_decode(text[text.rfind("{"):])[0]


def main():
    source = ROOT / "source/sound.m4a"
    pcm = ROOT / "analysis/source-mono.wav"
    ffmpeg("-i", str(source), "-map_metadata", "-1", "-ac", "1", "-ar", str(RATE),
           "-c:a", "pcm_s24le", str(pcm))
    manifest = {
        "date": "2026-10-25",
        "status": "audition_only_not_integrated",
        "source": "source/sound.m4a",
        "source_sha256": hashlib.sha256(source.read_bytes()).hexdigest(),
        "timebase": "seconds from start of decoded mono PCM",
        "sample_rate": RATE,
        "channels": 1,
        "target_lufs": -18.0,
        "max_true_peak_db": -1.5,
        "processing": {
            "stereo_to_mono": "mean of L/R; measured source correlation 0.9976",
            "highpass_hz": 65,
            "fade_in_ms": 5,
            "fade_out_ms": 20,
            "normalization": "two-pass EBU R128 loudnorm; -18 LUFS, LRA 11, TP -1.5 dBTP; linear gain",
            "noise_reduction": "none; source ambient RMS approximately -73.9 dBFS",
            "pitch_or_rate_change": "none",
            "reverb": "none",
        },
        "selection": "Four isolated utterances, one take each; no repeated versions to rank.",
        "segments": [],
    }
    for label, take, start, end in SEGMENTS:
        raw = ROOT / "takes" / (take + ".wav")
        trim = f"atrim=start_sample={round(start * RATE)}:end_sample={round(end * RATE)},asetpts=PTS-STARTPTS"
        ffmpeg("-i", str(pcm), "-af", trim, "-map_metadata", "-1", "-c:a", "pcm_s24le", str(raw))
        duration = end - start
        base = f"highpass=f=65,afade=t=in:st=0:d=0.005,afade=t=out:st={duration - .020:.6f}:d=0.020"
        first = ffmpeg("-i", str(raw), "-af", base + ",loudnorm=I=-18:TP=-1.5:LRA=11:print_format=json",
                       "-f", "null", "-")
        measured = stats(first.stderr)
        norm = (
            "loudnorm=I=-18:TP=-1.5:LRA=11:"
            f"measured_I={measured['input_i']}:measured_TP={measured['input_tp']}:"
            f"measured_LRA={measured['input_lra']}:measured_thresh={measured['input_thresh']}:"
            f"offset={measured['target_offset']}:linear=true:print_format=json"
        )
        master = ROOT / "masters" / (label + ".wav")
        second = ffmpeg("-i", str(raw), "-af", base + "," + norm, "-ar", str(RATE), "-ac", "1",
                        "-map_metadata", "-1", "-c:a", "pcm_s24le", str(master))
        final = stats(second.stderr)
        preview = ROOT / "previews" / (label + ".mp3")
        ffmpeg("-i", str(master), "-map_metadata", "-1", "-c:a", "libmp3lame", "-b:a", "192k", str(preview))
        for suffix, data in [("pass1", measured), ("pass2", final)]:
            (ROOT / "analysis" / f"{label}-{suffix}.json").write_text(json.dumps(data, indent=2) + "\n")
        manifest["segments"].append({
            "label": label,
            "take": take,
            "source_start": start,
            "source_end": end,
            "duration": round(duration, 6),
            "unprocessed": str(raw.relative_to(ROOT)),
            "master": str(master.relative_to(ROOT)),
            "preview": str(preview.relative_to(ROOT)),
            "source_lufs_after_cleanup": float(measured["input_i"]),
            "output_lufs": float(final["output_i"]),
            "output_true_peak_db": float(final["output_tp"]),
            "normalization_type": final["normalization_type"],
            "master_sha256": hashlib.sha256(master.read_bytes()).hexdigest(),
        })

    # A short gap permits comparison without changing the individual assets.
    frames = bytearray(b"\x00" * round(.15 * RATE) * 2)
    for i, (label, *_rest) in enumerate(SEGMENTS):
        decoded = ffmpeg("-v", "error", "-i", str(ROOT / "masters" / (label + ".wav")),
                         "-f", "s16le", "-ac", "1", "-ar", str(RATE), "pipe:1").stdout
        frames.extend(decoded)
        frames.extend(b"\x00" * round((.55 if i < 3 else .25) * RATE) * 2)
    sampler = ROOT / "previews/cheers-audition.wav"
    with wave.open(str(sampler), "wb") as wav:
        wav.setnchannels(1)
        wav.setsampwidth(2)
        wav.setframerate(RATE)
        wav.writeframes(frames)
    ffmpeg("-i", str(sampler), "-map_metadata", "-1", "-c:a", "libmp3lame", "-b:a", "192k",
           str(sampler.with_suffix(".mp3")))
    manifest["sampler"] = "previews/cheers-audition.mp3"
    (ROOT / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
    for entry in manifest["segments"]:
        print(entry["label"], entry["duration"], entry["source_lufs_after_cleanup"],
              entry["output_lufs"], entry["output_true_peak_db"], entry["normalization_type"])


if __name__ == "__main__":
    main()
