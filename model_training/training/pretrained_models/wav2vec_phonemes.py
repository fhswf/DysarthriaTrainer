import librosa
from transformers import Wav2Vec2Processor, Wav2Vec2ForCTC
import torch
from itertools import groupby
import warnings
warnings.filterwarnings("ignore", message="enable_nested_tensor is True, but self.use_nested_tensor is False")

from framework.phoneme_recognizer import PhonemeRecognizer
from framework.utils import normalize_ipa, ipa2arpabet


class Wav2VecRecognizer(PhonemeRecognizer):
    def __init__(self, model_name="vitouphy/wav2vec2-xls-r-300m-timit-phoneme"):
        super().__init__(is_trainable=False)
        self.processor = Wav2Vec2Processor.from_pretrained(model_name)
        self.model = Wav2Vec2ForCTC.from_pretrained(model_name)
        
        vocabulary = normalize_ipa(self.processor.tokenizer.get_vocab(), merge_diphthongs=False)
        vocabulary = ipa2arpabet(vocabulary)
        self.vocabulary = [ph.upper() for ph in vocabulary if ph]

    def predict(self, audio_file):
        try:
            audio, sr = librosa.load(audio_file, sr=16000)
        except:
            return [], False
                
        input_values = self.processor(audio, sampling_rate=sr, return_tensors="pt").input_values

        with torch.no_grad():
            logits = self.model(input_values).logits

        probs = torch.nn.functional.softmax(logits, dim=-1)
        pred_ids = torch.argmax(probs, dim=-1)#.squeeze()
        
        # Flatten to a Python list of IDs
        if isinstance(pred_ids, torch.Tensor):
            pred_ids = pred_ids.view(-1)
        elif isinstance(pred_ids, int):
            pred_ids = [pred_ids]
            
        confidences = probs[0, torch.arange(probs.shape[1]), pred_ids]

        id2phn = self.processor.tokenizer.convert_ids_to_tokens(range(self.processor.tokenizer.vocab_size))
        pred_phonemes = [id2phn[id] for id in pred_ids]

        # ipa to arpabet
        pred_phonemes = [ph for ph in pred_phonemes if ph not in ["[PAD]", "|", " "]]
        pred_phonemes = normalize_ipa(pred_phonemes)
        pred_phonemes = ipa2arpabet(pred_phonemes)
        pred_phonemes = [ph.upper() for ph in pred_phonemes if ph]
        pred_phonemes = [key for key, _ in groupby(pred_phonemes)]

        return pred_phonemes, True