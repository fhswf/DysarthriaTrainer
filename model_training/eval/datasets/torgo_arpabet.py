import os

from framework.dataset import CustomDataset
from config import datasets


TORGO_TO_ARPABET = {
    "ahn": "ah",
    "noi": "sil",
    "noio": "sil",
    "riy": "iy",
    "oa": "ow",
    "h": "hh",
    "et": "eh",
    "aor": "aw",
    "c": "k",
    "si": "s",
    "ff": "f",
    "nh": "ng"
}

ARPABET_61_TO_39 = {
    "aa": "aa", "ae": "ae", "ah": "ah", "ao": "aa", "aw": "aw", "ax": "ax", "ax-h": "ax", "axr": "er",
    "ay": "ay", "b": "b", "bcl": "b", "ch": "ch", "d": "d", "dcl": "d", "dh": "dh", "dx": "dx",
    "eh": "eh", "el": "l", "em": "m", "en": "n", "eng": "ng", "epi": "sil", "er": "er", "ey": "ey",
    "f": "f", "g": "g", "gcl": "g", "h#": "sil", "hh": "hh", "hv": "hh", "ih": "ih", "ix": "ax",
    "iy": "iy", "jh": "jh", "k": "k", "kcl": "k", "l": "l", "m": "m", "n": "n", "ng": "ng",
    "nx": "n", "ow": "ow", "oy": "oy", "p": "p", "pau": "sil", "pcl": "p", "q": "sil", "r": "r",
    "s": "s", "sh": "sh", "t": "t", "tcl": "t", "th": "th", "uh": "uh", "uw": "uw", "ux": "uw",
    "v": "v", "vcl": "v", "w": "w", "y": "y", "z": "z", "zh": "sh", "clf": "sil"
}


class TorgoArpabetDataset (CustomDataset):
    def __init__(self, encoder, usecase="train", max_samples=None):
        dataset_config = datasets["torgo_arpabet"]
        super().__init__(encoder, dataset_config, usecase, max_samples)

    def initialize_samples(self, max_samples=None):
        # Walk through the directory and find all .phn files - then check if corresponding wav file exists as well
        for root_dir in self.data_paths:
            for root, _, files in os.walk(root_dir):
                if os.path.basename(root).lower() in ["phn_headmic", "phn_arraymic"]:
                    for phn_file in files:
                        if not phn_file.lower().endswith(".phn"):
                            continue

                        phn_path = os.path.join(root, phn_file)
                        wav_path = phn_path.replace("phn_", "wav_").replace(".PHN", ".wav")

                        if not os.path.exists(wav_path):
                            continue

                        with open(phn_path, "r") as f:
                            phonemes = [line.strip().split()[2].lower() for line in f if line.strip()]
                        
                        if phonemes == []:
                            print("No phoneme labels in this sample, skip it")
                            continue

                        phonemes = [TORGO_TO_ARPABET.get(ph.lower(), ph) for ph in phonemes]
                        phonemes = [ARPABET_61_TO_39[p.lower()] for p in phonemes if p.lower() in ARPABET_61_TO_39]

                        self.samples.append((wav_path, phonemes))

                        if max_samples is not None:
                            if len(self.samples) >= max_samples:
                                return

    def vocabulary_alignment(self, phoneme_sequence):
        phoneme_sequence = [ph for ph in phoneme_sequence if ph != "sil"]
        return phoneme_sequence

    def get_name(self):
        return "torgo_arpabet"