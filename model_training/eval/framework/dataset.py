import sys
import soundfile as sf
import torch
from torch.utils.data import Dataset
from transformers import Wav2Vec2FeatureExtractor
from abc import ABC, abstractmethod


class CustomDataset(Dataset, ABC):
    def __init__(self, encoder, dataset_config, usecase="train", max_samples=None):
        # feature extractor
        self.feature_extractor = Wav2Vec2FeatureExtractor.from_pretrained(encoder)
        
        if usecase == "train":
            self.data_paths = dataset_config["train_dir"]
        elif usecase == "test":
            self.data_paths = dataset_config["test_dir"]
        elif usecase == "combine":
            self.data_paths = dataset_config["train_dir"] + dataset_config["test_dir"]
        else:
            print("Argument usecase must be 'train', 'test' or 'combine'")
            sys.exit()

        # vocabulary
        self.blank = "<blank>"
        self.phonemes = dataset_config["vocabulary"]
        self.vocab = [self.blank] + self.phonemes
        self.vocab_dict = {p: i for i, p in enumerate(self.vocab)}

        self.samples = []
        self.initialize_samples(max_samples)

    @abstractmethod
    def initialize_samples(self, max_samples=None): ...

    @abstractmethod
    def vocabulary_alignment(self, phoneme_sequence): ...

    @abstractmethod
    def get_name(self): ...

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        wav_path, phonemes = self.samples[idx]
        try:
            audio, sr = sf.read(wav_path)
            
            # limit audi length to 124000 samples (~7.75s at 16kHz)
            if len(audio) > 124000 or sr !=16000:
                raise IndexError

            audio = torch.tensor(audio).unsqueeze(0)  # (1, T)

            # Feature extraction
            input_values = self.feature_extractor(audio.squeeze(0).numpy(), sampling_rate=16000, return_tensors="pt").input_values[0]

            # Convert phonemes to indices
            labels = torch.tensor([self.vocab_dict[p] for p in phonemes], dtype=torch.long)
        
            return input_values, labels
    
        except Exception:
            raise IndexError