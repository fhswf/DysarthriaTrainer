import torch
import os
import librosa
import numpy as np

from trainable_models.transformers_ctc import config
from trainable_models.transformers_ctc.transformers_ctc import TransformerCTC


def trim_silence(audio: np.ndarray, threshold: float = 0.01) -> np.ndarray:
    """ Trim silence from beginning and end of audio. """
    # Find indices where audio amplitude is above the threshold
    non_silence_indices = np.where(np.abs(audio) > threshold)[0]
    
    if len(non_silence_indices) == 0:
        # All audio is silence, return empty array
        return np.array([], dtype=audio.dtype)
    
    start = non_silence_indices[0]
    end = non_silence_indices[-1] + 1  # +1 to include this index
    
    return audio[start:end]


class PhonemeRecognizer():
    def __init__(self, checkpoint_path):
        checkpoint = torch.load(checkpoint_path, map_location="cpu")
        model_class = config.MODEL_CLASSES[str(checkpoint["model_class"]).rsplit(".",1)[-1]]
        model = TransformerCTC(model_class, checkpoint["model_name"], len(checkpoint["vocab"]), checkpoint["vocab"], '<blank>', checkpoint_path)       
        self.model = model

    def get_name(self):
        return self.__class__.__name__
    
    def predict(self, audio_file):
        try:
            audio_array, _ = librosa.load(audio_file, sr=16000)
        except:
            return [], False
        
        if len(audio_array) > 124000:
            return [], False
        
        phonemes = self.model.predict(audio_array)
        return phonemes, True

# torgo/timit arpabet
class HubertCTC(PhonemeRecognizer):
    def __init__(self):
        checkpoint_path = config.CHECKPOINTS["hubert_ctc"]
        checkpoint_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), checkpoint_path)
        super().__init__(checkpoint_path)

class Wav2Vec2XlsrCTC(PhonemeRecognizer):
    def __init__(self):
        checkpoint_path = config.CHECKPOINTS["wav2vec2_xlsr_ctc"]
        checkpoint_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), checkpoint_path)
        super().__init__(checkpoint_path)

class Wav2Vec2CTC(PhonemeRecognizer):
    def __init__(self):
        checkpoint_path = config.CHECKPOINTS["wav2vec2_ctc"]
        checkpoint_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), checkpoint_path)
        super().__init__(checkpoint_path)

class WavLmCTC(PhonemeRecognizer):
    def __init__(self):
        checkpoint_path = config.CHECKPOINTS["wavlm_ctc"]
        checkpoint_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), checkpoint_path)
        super().__init__(checkpoint_path)

# commonvoice-german ipa
class HubertCTC_CommonVoice(PhonemeRecognizer):
    def __init__(self):
        checkpoint_path = config.CHECKPOINTS["hubert_ctc_commonvoice"]
        checkpoint_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), checkpoint_path)
        super().__init__(checkpoint_path)