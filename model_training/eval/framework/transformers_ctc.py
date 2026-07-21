import os
import soundfile as sf
import torch
import torch.nn as nn
from transformers import Wav2Vec2FeatureExtractor
import numpy as np

from framework.utils import resample_audio


class TransformerCTC(nn.Module):
    def __init__(self, model_name, model_class, encoder, num_classes, vocab, blank_token="<blank>", pretrained_weights=None):
        super().__init__()
        self.alias = model_name
        self.encoder = model_class.from_pretrained(encoder)
        self.fc = nn.Linear(self.encoder.config.hidden_size, num_classes)
        self.vocab = vocab
        self.blank_id = vocab.index(blank_token)
        self.feature_extractor = Wav2Vec2FeatureExtractor.from_pretrained(encoder)

        # Load pretrained weights if provided, matching only compatible layers. This allows to load pretrained weights even e.g. if number of classes (phonemes) differ.
        if pretrained_weights is not None:
            checkpoint_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), pretrained_weights)
            checkpoint = torch.load(checkpoint_path, map_location="cpu")
            state_dict = checkpoint['model_state_dict']

            model_dict = self.state_dict()
            # Filter out keys that do not match in size
            compatible_dict = {k: v for k, v in state_dict.items() if k in model_dict and v.size() == model_dict[k].size()}

            # Update current model dict
            model_dict.update(compatible_dict)
            self.load_state_dict(model_dict)
        
        self.eval()

    
    def get_name(self):
        return self.alias
    
    def forward(self, input_values, attention_mask=None):
        outputs = self.encoder(input_values, attention_mask=attention_mask)
        hidden_states = outputs.last_hidden_state
        logits = self.fc(hidden_states)
        return logits

    def predict(self, audio_array, sample_rate=16000):
        
        if len(audio_array.shape) > 1:
            audio_array = audio_array.mean(axis=1)

        # Feature extraction
        inputs = self.feature_extractor(audio_array, sampling_rate=sample_rate, return_tensors="pt")
        input_values = inputs.input_values
        attention_mask = inputs.attention_mask

        # Move inputs to same device as model
        device = next(self.parameters()).device
        input_values = input_values.to(device)
        if attention_mask is not None:
            attention_mask = attention_mask.to(device)
            
        with torch.no_grad():
            logits = self(input_values, attention_mask=attention_mask)
        
        #decoded_ids = self.decode_predictions(logits)[0]
        decoded_ids, confidences = self.decode_predictions_with_confidences(logits)
        decoded_ids = decoded_ids[0]
        confidences = confidences[0]        
        decoded_phonemes = [self.vocab[idx] for idx in decoded_ids]
        
        
        # remove low confidence phonemes
        clean_phonemes = []
        clean_confidences = []
        for i, ph in enumerate(decoded_phonemes):
            if confidences[i] > 0.5:
                clean_phonemes.append(ph)
                clean_confidences.append(confidences[i])
        decoded_phonemes = clean_phonemes
        confidences = clean_confidences
        

        return decoded_phonemes, confidences
    
    def predict_from_file(self, audio_file):
        try:
            audio_array, sr = sf.read(audio_file)
        except:
            print("Can't load audio file:", audio_file)
            return [], []
        
        if len(audio_array) < 16000:
            #    audio_array = np.pad(audio_array, (0, 16000 - len(audio_array)), mode='empty')
            
            # Pad audio to at least 1 second
            MIN_SAMPLES = 16000
            if len(audio_array) < MIN_SAMPLES:
                pad_len = MIN_SAMPLES - len(audio_array)
                audio_array = np.pad(audio_array, (0, pad_len), mode='constant', constant_values=0)

          
        if len(audio_array) > 124000:
            print("Audio file too long:", audio_file)
            return [], []
        elif sr != 16000:
            #audio_array, sr = resample_audio(audio_array, sr)
            print("Audio file not sampled at 16kHz:", audio_file)
            return [], []
        
        phonemes, confidences = self.predict(audio_array)
        return phonemes, confidences

    def decode_predictions(self, logits):
        """
        Greedy decode logits to phoneme indices.
        Args:
            logits: Tensor of shape (B, T, C) logits from the model.
            blank_id: id of the CTC blank token.
        Returns:
            List of lists: decoded sequences of phoneme indices without blanks and repeats.
        """
        
        pred_ids = torch.argmax(logits, dim=-1)  # (B, T)

        decoded = []
        for seq in pred_ids:
            seq = seq.cpu().numpy()
            # Collapse repeats and remove blanks
            dedup = []
            prev = self.blank_id
            for id in seq:
                if id != prev and id != self.blank_id:
                    dedup.append(id)
                prev = id
            decoded.append(dedup)
        
        return decoded

    def decode_predictions_with_confidences(self, logits):
        """
        Proper greedy CTC decode with confidences.
        """
        probs = torch.softmax(logits, dim=-1)  # (B, T, C)
        pred_ids = torch.argmax(logits, dim=-1)  # (B, T)

        all_ids = []
        all_conf = []

        for id_seq, prob_seq in zip(pred_ids, probs):
            id_seq = id_seq.cpu().numpy()
            prob_seq = prob_seq.cpu().numpy()

            seq_ids = []
            seq_conf = []

            prev_id = self.blank_id  # critical: prev = blank, not None

            for id, prob_vec in zip(id_seq, prob_seq):

                if id != prev_id:                # collapse repeats
                    if id != self.blank_id:      # skip blanks
                        seq_ids.append(id)
                        seq_conf.append(float(prob_vec[id]))

                prev_id = id                    # update AFTER collapse logic

            all_ids.append(seq_ids)
            all_conf.append(seq_conf)

        return all_ids, all_conf