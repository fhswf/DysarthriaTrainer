import os
import subprocess
from concurrent.futures import ThreadPoolExecutor, as_completed

# --- CONFIG ---
chunks_root = "/path/to/CommonVoice/cv-corpus-22.0-2025-06-20/de/mfa_alignment/speaker1_chunks"
global_aligned_dir = "/path/to/CommonVoice/cv-corpus-22.0-2025-06-20/de/aligned"

dictionary = "german_mfa"
acoustic_model = "german_mfa"

os.makedirs(global_aligned_dir, exist_ok=True)

# Number of parallel MFA processes to run (full CPU usage)
num_parallel_jobs = os.cpu_count()

# --- FUNCTION TO RUN MFA ON A SINGLE CHUNK ---
def align_chunk(chunk_dir):
    command = [
        "mfa", "align",
        chunk_dir,              # input folder for this chunk
        dictionary,
        acoustic_model,
        global_aligned_dir,     # write all outputs here
        "--single-speaker",
        "--clean"
    ]

    chunk_name = os.path.basename(chunk_dir)
    try:
        subprocess.run(command, check=True)
        return f"[OK] Finished {chunk_name}"
    except subprocess.CalledProcessError as e:
        return f"[ERR] {chunk_name}: {e}"

# --- MAIN LOOP: PARALLEL EXECUTION ---
chunk_dirs = [os.path.join(chunks_root, d) for d in os.listdir(chunks_root)
              if os.path.isdir(os.path.join(chunks_root, d))]

from concurrent.futures import ThreadPoolExecutor, as_completed
with ThreadPoolExecutor(max_workers=num_parallel_jobs) as executor:
    futures = [executor.submit(align_chunk, c) for c in chunk_dirs]
    for fut in as_completed(futures):
        print(fut.result())

print("✅ All chunks aligned into the global folder.")