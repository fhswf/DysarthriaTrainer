import os
import torch
import torch.nn as nn
from transformers import Wav2Vec2FeatureExtractor


class TransformerCTC(nn.Module):
    def __init__(self, model_class, model_name, num_classes, vocab, blank_token="<blank>", pretrained_weights=None):
        super().__init__()
        self.encoder = model_class.from_pretrained(model_name)
        self.fc = nn.Linear(self.encoder.config.hidden_size, num_classes)
        self.vocab = vocab
        self.blank_id = vocab.index(blank_token)
        self.feature_extractor = Wav2Vec2FeatureExtractor.from_pretrained(model_name)

        # Load pretrained weights if provided, matching only compatible layers. This allows to load pretrained weights even e.g. if number of classes (phonemes) differ.
        if pretrained_weights is not None:
            checkpoint_path = os.path.join(os.path.dirname(__file__), pretrained_weights)
            checkpoint = torch.load(checkpoint_path, map_location="cpu")
            state_dict = checkpoint['model_state_dict']

            model_dict = self.state_dict()
            # Filter out keys that do not match in size
            compatible_dict = {k: v for k, v in state_dict.items() if k in model_dict and v.size() == model_dict[k].size()}

            # Update current model dict
            model_dict.update(compatible_dict)
            self.load_state_dict(model_dict)
            self.eval()
            
    def forward(self, input_values, attention_mask=None):
        outputs = self.encoder(input_values, attention_mask=attention_mask)
        hidden_states = outputs.last_hidden_state
        logits = self.fc(hidden_states)
        return logits

    def predict(self, audio_array, sample_rate=16000):
        
        if len(audio_array.shape) > 1:
            audio_array = audio_array.mean(axis=1)

        inputs = self.feature_extractor(audio_array, sampling_rate=sample_rate, return_tensors="pt")
        input_values = inputs.input_values
        attention_mask = inputs.attention_mask

        with torch.no_grad():
            logits = self(input_values, attention_mask=attention_mask)
            pred_ids = torch.argmax(logits, dim=-1)[0].cpu().numpy()

        decoded = [self.vocab[idx] for idx in pred_ids]
        decoded = [key for key in decoded if key not in ['<blank>']]
        
        return decoded