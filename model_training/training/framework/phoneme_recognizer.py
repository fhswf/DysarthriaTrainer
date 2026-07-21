from abc import ABC, abstractmethod


class PhonemeRecognizer (ABC):
    def __init__(self, is_trainable=False):
        self.is_trainable = is_trainable
    
    def get_name(self):
        return self.__class__.__name__.replace("Recognizer", "")

    @abstractmethod
    def predict(self, audio_file):
        pass
