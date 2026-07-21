import os
from concurrent.futures import ProcessPoolExecutor, as_completed
import textgrid


# --- CONFIG ---
textgrid_dirs = [
    "/path/to/CommonVoice/cv-corpus-22.0-2025-06-20/de/aligned"
]
vocab_out = "/path/to/CommonVoice/cv-corpus-22.0-2025-06-20/de/vocab.txt"



num_workers = os.cpu_count()  # processes

# ----------------

def process_file(tg_path):
    local_vocab = set()
    try:
        tg = textgrid.TextGrid.fromFile(tg_path)
        phones_tier = next((t for t in tg.tiers if t.name.lower() in ["phones", "phonemes"]), None)
        if phones_tier:
            for interval in phones_tier.intervals:
                ph = interval.mark.strip()
                if ph:
                    local_vocab.add(ph)
    except Exception as e:
        print(f"[ERR] {tg_path}: {e}")
    return local_vocab


def collect_textgrid_files(dirs):
    files = []
    for tg_dir in dirs:
        for root, _, fs in os.walk(tg_dir):
            files.extend(os.path.join(root, f) for f in fs if f.lower().endswith(".textgrid"))
    return files


if __name__ == "__main__":
    all_files = collect_textgrid_files(textgrid_dirs)
    print(f"Processing {len(all_files)} files with {num_workers} processes...")

    vocab = set()
    total_files = len(all_files)
    completed = 0

    with ProcessPoolExecutor(max_workers=num_workers) as executor:
        futures = [executor.submit(process_file, f) for f in all_files]
        for fut in as_completed(futures):
            vocab.update(fut.result())
            completed += 1
            if completed % 10000 == 0:
                print(f"{completed}/{total_files} files processed")

    vocab = sorted(vocab)
    with open(vocab_out, "w", encoding="utf-8") as fout:
        for p in vocab:
            fout.write(f"{p}\n")

    print(f"✅ Vocabulary saved to {vocab_out}, {len(vocab)} phonemes found.")