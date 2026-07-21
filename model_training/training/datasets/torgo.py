import os

import settings
from framework.phoneme_dataset import PhonemeDataset


torgo_to_arpa = {
    "ahn": "ah",
    "noi": "sil",
    "noio": "sil",
    "riy": "iy",
    "oa": "ow",
    "sil": "sil",
    "h": "hh",
    "et": "eh",
    "aor": "aw",
    "c": "k",
    "si": "s",
    "ff": "f",
    "nh": "ng"
}


class TorgoDataset (PhonemeDataset):
    def get_data(self):
        # Walk through the directory and find all .phn files - then check if corresponding wav file exists as well
        def _get_data_pairs(directories):
            audio_files = []
            phoneme_sequences = []
                  
            for root_dir in directories:
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
                            
                            phonemes = [torgo_to_arpa.get(ph.lower(), ph).upper() for ph in phonemes]
                            
                            audio_files.append(wav_path)
                            phoneme_sequences.append(phonemes)
        
            return audio_files, phoneme_sequences
        
        train_data = _get_data_pairs(settings.datasets["Torgo"]["train"])
        test_data = _get_data_pairs(settings.datasets["Torgo"]["test"])
        
        return train_data, test_data