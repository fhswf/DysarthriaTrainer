import os

from framework.dataset import CustomDataset
from config import datasets


class CommonvoiceGermanDataset_100k(CustomDataset):
    def __init__(self, encoder, usecase="train", max_samples=None):
        dataset_config = datasets["commonvoice_german_100k"]
        super().__init__(encoder, dataset_config, usecase, max_samples)

    def initialize_samples(self, max_samples=None):
        self.samples = []
        for root_dir in self.data_paths:
            for root, _, files in os.walk(root_dir):
                for phn_file in files:
                    if not phn_file.lower().endswith(".txt"):
                        continue

                    phn_path = os.path.join(root, phn_file)
                    wav_path = os.path.splitext(phn_path)[0] + ".wav"

                    if not os.path.exists(wav_path):
                        continue

                    # read phonemes from space-separated line
                    with open(phn_path, "r", encoding="utf-8") as f:
                        content = f.read().strip()
                        phonemes = content.split()

                    self.samples.append((wav_path, phonemes))

                    if max_samples is not None:
                        if len(self.samples) >= max_samples:
                            return

    def vocabulary_alignment(self, phoneme_sequence):
        phoneme_sequence = [phn for phn in phoneme_sequence if phn != "spn"]
        return phoneme_sequence

    def get_name(self):
        return "commonvoice_german"