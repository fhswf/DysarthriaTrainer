import os
import soundfile as sf
import numpy as np
import textgrid
import re
import unicodedata
from concurrent.futures import ThreadPoolExecutor, as_completed


# --- CONFIG ---
clips_dir = "/path/to/CommonVoice/cv-corpus-22.0-2025-06-20/de/clips"
aligned_dir = "/path/to/CommonVoice/cv-corpus-22.0-2025-06-20/de/aligned"
audio_out_dir = "/path/to/CommonVoice/cv-corpus-22.0-2025-06-20/de/clips_wordsplit"
phoneme_out_dir = "/path/to/CommonVoice/cv-corpus-22.0-2025-06-20/de/phonemes_wordsplit"

os.makedirs(audio_out_dir, exist_ok=True)
os.makedirs(phoneme_out_dir, exist_ok=True)

num_workers = os.cpu_count() * 2
padding = 0.05       # extend word segment by ±50 ms
target_sr = 16000     # resample target
# ----------------


def safe_filename(s: str) -> str:
    if not s:
        return "unknown"
    # normalize Unicode
    s = unicodedata.normalize('NFC', s)
    # keep a-z, A-Z, 0-9, German letters
    s = re.sub(r'[^a-zA-Z0-9äöüÄÖÜß]', '', s)
    if not s:
        return "unknown"
    return s

def resample_to_mono(audio: np.ndarray, sr: int, target_sr: int = 16000) -> tuple[np.ndarray, int]:
    """Convert to mono and resample to target sample rate if needed."""
    # Convert to mono
    if audio.ndim > 1:
        audio = np.mean(audio, axis=1)

    # Resample only if needed
    if sr != target_sr:
        import librosa
        audio = librosa.resample(audio, orig_sr=sr, target_sr=target_sr)

    return audio.astype(np.float32), target_sr


def process_pair(base):
    tg_path = os.path.join(aligned_dir, base + ".TextGrid")
    wav_path = os.path.join(clips_dir, base + ".wav")
    if not os.path.exists(tg_path) or not os.path.exists(wav_path):
        return f"[WARN] Missing pair: {base}"

    try:
        tg = textgrid.TextGrid.fromFile(tg_path)
        words_tier = next(t for t in tg.tiers if t.name.lower() == "words")
        phones_tier = next(t for t in tg.tiers if t.name.lower() in ["phones", "phonemes"])

        audio, sr = sf.read(wav_path, dtype="float32")
        audio, sr = resample_to_mono(audio, sr, target_sr)
        total_dur = len(audio) / sr

        for idx, w in enumerate(words_tier.intervals):
            word = w.mark.strip()
            
            # Skip invalid or unknown words
            if not word.lower() or word.lower() in ["<unk>", "unk", "sp", "sil", ""]:
                continue

            # Add small padding, clip to bounds
            start = w.minTime #max(0.0, w.minTime - padding)
            end = min(total_dur, w.maxTime + padding)
            if end <= start:
                continue

            start_sample = int(start * sr)
            end_sample = int(end * sr)
            segment = audio[start_sample:end_sample]

            # Collect phonemes overlapping this word
            phs = [
                p.mark.strip()
                for p in phones_tier.intervals
                if p.mark.strip() and not (p.maxTime < start or p.minTime > end)
            ]

            # write out files
            safe_word = safe_filename(word)
            
            out_audio = os.path.join(audio_out_dir, f"{base}_{idx:03d}_{safe_word}.wav")
            if not os.path.exists(out_audio):
                sf.write(out_audio, segment, sr, subtype="PCM_16")

            out_txt = os.path.join(phoneme_out_dir, f"{base}_{idx:03d}_{safe_word}.txt")
            if not os.path.exists(out_txt):
                with open(out_txt, "w", encoding="utf8") as f:
                    f.write(" ".join(phs))

        return None

    except Exception as e:
        return f"[ERR] {base}: {e}"


# --- MAIN ---
if __name__ == "__main__":
    files = [
        os.path.splitext(f)[0]
        for f in os.listdir(aligned_dir)#[0:100000]
        if f.endswith(".TextGrid")
    ]
    print(f"Processing {len(files)} files with {num_workers} threads...")

    with ThreadPoolExecutor(max_workers=num_workers) as ex:
        futures = [ex.submit(process_pair, base) for base in files]
        for i, fut in enumerate(as_completed(futures), 1):
            msg = fut.result()
            if msg:
                print(msg)
            if i % 1000 == 0:
                print(f"{i}/{len(files)} done...")

    print("✅ Finished splitting, resampling, and labeling words.")