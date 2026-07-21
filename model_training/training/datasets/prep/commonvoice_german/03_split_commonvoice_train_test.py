import os

# Paths
audio_dir = "\\path\\to\\CommonVoice\\cv-corpus-22.0-2025-06-20\\de\\clips_wordsplit"
phoneme_dir = "\\path\\to\\CommonVoice\\cv-corpus-22.0-2025-06-20\\de\\phonemes_wordsplit"
output_dir = "\\path\\to\\CommonVoice\\cv-corpus-22.0-2025-06-20\\de\\data"

train_ratio = 0.8

for split in ["train", "test"]:
    os.makedirs(os.path.join(output_dir, split), exist_ok=True)

audio_files = [f for f in os.listdir(audio_dir) if f.lower().endswith(".wav")][0:100000]

num_train = int(len(audio_files) * train_ratio)
train_files = audio_files[:num_train]
test_files = audio_files[num_train:]

def create_symlinks_or_copy(file_list, split_name):
    for audio_file in file_list:
        base = os.path.splitext(audio_file)[0]
        phoneme_file = base + ".txt"

        src_audio = os.path.join(audio_dir, audio_file)
        src_phoneme = os.path.join(phoneme_dir, phoneme_file)

        dst_audio = os.path.join(output_dir, split_name, audio_file)
        dst_phoneme = os.path.join(output_dir, split_name, phoneme_file)

        # Check if files exist
        if not os.path.isfile(src_audio):
            print(f"[WARN] Missing audio: {src_audio}")
            continue
        if not os.path.isfile(src_phoneme):
            print(f"[WARN] Missing phoneme: {src_phoneme}")
            continue

        # Create symlink
        for src, dst in [(src_audio, dst_audio), (src_phoneme, dst_phoneme)]:
            try:
                if not os.path.exists(dst):
                    os.symlink(os.path.abspath(src), dst)
            except Exception as e:
                print(f"[ERROR] Could not symlink {src})")

create_symlinks_or_copy(train_files, "train")
create_symlinks_or_copy(test_files, "test")

print(f"Done! {len(train_files)} train files, {len(test_files)} test files.")