from allosaurus.app import read_recognizer
from itertools import groupby

from framework.phoneme_recognizer import PhonemeRecognizer
from framework.utils import ipa2arpabet


class AllosaurusRecognizer(PhonemeRecognizer):
    def __init__(self):
        super().__init__(is_trainable=False)
        self.model = read_recognizer()

    def predict(self, audio_file):
        try:
            output = self.model.recognize(audio_file, lang_id='eng', timestamp=True)
        except:
            return [], False
        
        predicted_phonemes =[]
        for line in output.strip().splitlines():
            start, dur, ph = line.strip().split()
            predicted_phonemes.append(ph.upper())

        predicted_phonemes = ipa2arpabet(predicted_phonemes)
        predicted_phonemes = [key for key, _ in groupby(predicted_phonemes)]
        
        return predicted_phonemes, True