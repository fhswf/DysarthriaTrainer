import os

import settings
from framework.phoneme_dataset import PhonemeDataset


class TimitDataset (PhonemeDataset):
    def get_data(self):
        def _get_phoneme_sequence(file):
            phonemes = []
            with open(file, "r") as f:
                lines = f.readlines()
                for line in lines[1:-1]: # Skip header and last line
                    parts = line.strip().split()
                    phonemes.append(parts[2])

            phonemes = [ph.upper() for ph in phonemes if ph]
            
            return phonemes
        
        # Walk through the directory and find all .wav files - then check if corresponding phoneme file exists as well
        def _get_data_pairs(root_dir):
            audio_files = []
            phoneme_sequences = []
            
            for root, dirs, files in os.walk(root_dir):
                for file in files:
                    if file.endswith('.wav'):
                        audio_file = os.path.join(root, file)
                        phoneme_file = audio_file.split(".",1)[0] + ".PHN"
                        if os.path.isfile(phoneme_file):
                            audio_files.append(audio_file)
                            phoneme_sequence = _get_phoneme_sequence(phoneme_file)
                            phoneme_sequences.append(phoneme_sequence)

            return audio_files, phoneme_sequences
        
        train_data = _get_data_pairs(settings.datasets["Timit"]["train"])
        test_data = _get_data_pairs(settings.datasets["Timit"]["test"])

        return train_data, test_data