import os

import settings
from framework.phoneme_dataset import PhonemeDataset


torgo_to_arpa = {
    "ahn": "ah",
    "noi": "sil",
    "noio": "sil",
    "riy": "iy",
    "oa": "ow",
    "o": "ow",
    "sil": "sil",
    "h": "hh",
    "et": "eh",
    "aor": "aw",
    "c": "k",
    "si": "s",
    "ff": "f",
    "nh": "ng"
}

arpa_to_ipa = {
    "aa": "ɑː",
    "ae": "æ",
    "ah": "a",
    "ao": "ɒː",
    "aw": "aw",
    "ax": "ə",
    "er": "ɜ",
    "ay": "aj",
    "b": "b",
    "ch": "tʃ",
    "d": "d",
    "dh": "ð",
    "dx": "d",
    "eh": "ɛ",
    "l": "l",
    "m": "m",
    "n": "n",
    "ng": "ŋ",
    "sil": "spn",
    "ey": "eː",
    "f": "f",
    "g": "ɡ",
    "hh": "h",
    "ih": "ɪ",
    "iy": "iː",
    "jh": "dʒ",
    "k": "k",
    "ow": "o",
    "oy": "oj",
    "p": "p",
    "r": "ɹ",
    "s": "s",
    "sh": "ʃ",
    "t": "t",
    "th": "θ",
    "uh": "ʊ",
    "uw": "uː",
    "v": "v",
    "w": "w",
    "y": "j",
    "z": "z",
    "zh": "ʒ",
    "gcl": "spn",
    "dcl": "spn",
    "tcl": "spn",
    "pcl": "spn",
    "kcl": "spn",
    "bcl": "spn",
    "kc": "spn",
    "eg": "spn"                    
}


class TorgoIpaDataset (PhonemeDataset):
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
                            
                            phonemes = [torgo_to_arpa.get(ph.lower(), ph.lower()) for ph in phonemes]
                            phonemes = [arpa_to_ipa.get(ph) for ph in phonemes]

                            audio_files.append(wav_path)
                            phoneme_sequences.append(phonemes)
        
            return audio_files, phoneme_sequences
        
        train_data = _get_data_pairs(settings.datasets["Torgo"]["train"])
        test_data = _get_data_pairs(settings.datasets["Torgo"]["test"])
        
        return train_data, test_data