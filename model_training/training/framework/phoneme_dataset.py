from abc import ABC, abstractmethod


class PhonemeDataset (ABC):
    def __init__(self):
        pass

    def get_name(self):
        return self.__class__.__name__.replace("Dataset", "")
    
    @abstractmethod
    def get_data(self):
        """ This method should return a tuple of two lists:
            - audio_files: List of paths to audio files
            - phoneme_sequences: List of lists of corresponding phonemes
        """
        pass