import os

import settings
from framework.phoneme_dataset import PhonemeDataset


class CommonvoiceEnglishDataset(PhonemeDataset):
    def get_data(self):
        def _get_data_pairs(directories):
            audio_files = []
            phoneme_sequences = []

            for root_dir in directories:
                for root, _, files in os.walk(root_dir):
                    for phn_file in files:
                        if not phn_file.lower().endswith(".txt"):
                            continue

                        phn_path = os.path.join(root, phn_file)
                        wav_path = os.path.splitext(phn_path)[0] + ".wav"

                        if not os.path.exists(wav_path):
                            continue

                        with open(phn_path, "r", encoding="utf-8") as file_handle:
                            content = file_handle.read().strip()
                            phonemes = content.split()

                        audio_files.append(wav_path)
                        phoneme_sequences.append(phonemes)

            return audio_files, phoneme_sequences

        train_data = _get_data_pairs(settings.datasets["commonvoice_english_100k"]["train"])
        test_data = _get_data_pairs(settings.datasets["commonvoice_english_100k"]["test"])

        return train_data, test_data