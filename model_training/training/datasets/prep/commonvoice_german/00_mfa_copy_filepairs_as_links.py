import os
from math import ceil
from concurrent.futures import ThreadPoolExecutor, as_completed

# --- CONFIGURATION ---
data_dir = "/path/to/CommonVoice/cv-corpus-22.0-2025-06-20/de"
txt_dir = os.path.join(data_dir, "txt")
clips_dir = os.path.join(data_dir, "clips")
output_root = os.path.join(data_dir, "mfa_alignment", "speaker1_chunks")

files_per_chunk = 20000  # adjust
os.makedirs(output_root, exist_ok=True)

# --- COLLECT ALL BASE NAMES (no extension) ---
txt_files = [f for f in os.listdir(txt_dir) if f.endswith(".txt")]
bases = sorted(os.path.splitext(f)[0] for f in txt_files)
num_chunks = ceil(len(bases) / files_per_chunk)

print(f"Found {len(bases)} items → splitting into {num_chunks} chunks...")

def link_pair(base, chunk_dir):
    """Create symlinks for .wav and .txt files in a chunk."""
    txt_src = os.path.join(txt_dir, base + ".txt")
    wav_src = os.path.join(clips_dir, base + ".wav")

    txt_dst = os.path.join(chunk_dir, base + ".txt")
    wav_dst = os.path.join(chunk_dir, base + ".wav")

    if not os.path.exists(wav_src):
        return f"[WARN] Missing audio for {base}"

    try:
        # text file
        if os.path.lexists(txt_dst):  # covers broken links too
            os.remove(txt_dst)
        os.symlink(txt_src, txt_dst)

        # audio file
        if os.path.lexists(wav_dst):
            os.remove(wav_dst)
        os.symlink(wav_src, wav_dst)
        return None
    except OSError as e:
        return f"[ERR] {base}: {e}"

# --- CREATE CHUNKS + LINKS ---
for i in range(num_chunks):
    start = i * files_per_chunk
    end = min((i + 1) * files_per_chunk, len(bases))
    chunk_bases = bases[start:end]
    chunk_dir = os.path.join(output_root, f"chunk_{i+1:04d}")
    os.makedirs(chunk_dir, exist_ok=True)

    print(f"Creating links for chunk {i+1}/{num_chunks} with {len(chunk_bases)} files...")

    with ThreadPoolExecutor(max_workers=os.cpu_count() * 2) as ex:
        futures = [ex.submit(link_pair, base, chunk_dir) for base in chunk_bases]
        for j, fut in enumerate(as_completed(futures), 1):
            msg = fut.result()
            if msg:
                print(msg)
            if j % 5000 == 0:
                print(f"  Linked {j}/{len(chunk_bases)} in chunk {i+1}")

print("✅ All chunks processed — symlink structure ready for MFA.")