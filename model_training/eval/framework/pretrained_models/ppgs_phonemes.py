import numpy as np
from itertools import groupby
import ppgs
import torch

from framework.utils import simplified_arpabet


class PPGSRecognizer():
    def __init__(self):
        super().__init__(is_trainable=False)
        self.vocabulary = ppgs.PHONEMES
        
    def predict(self, audio_file):
        try:
            audio = ppgs.load.audio(audio_file)
        except:
            return [], False
        
        output = ppgs.from_audio(audio, ppgs.SAMPLE_RATE, gpu=None)

        # Extract data from batch
        ppg_tensor = output[0].to(dtype=torch.float32).cpu().detach().numpy()
        ppg_matrix = ppg_tensor.T                       
        phoneme_indices = np.argmax(ppg_matrix, axis=1)

        predicted_phonemes = [ppgs.PHONEMES[phoneme_id].lower() for phoneme_id in phoneme_indices]
        predicted_phonemes = [key for key, _ in groupby(predicted_phonemes)]
        predicted_phonemes = simplified_arpabet(predicted_phonemes.upper()).lower()
        predicted_phonemes = [ph for ph in predicted_phonemes if ph != "<SILENT>"]
        
        return predicted_phonemes, True