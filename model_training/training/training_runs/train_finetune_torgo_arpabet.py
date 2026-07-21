import os
import torch
import torchaudio
import random
import torch.nn as nn
import torch.optim as optim
import soundfile as sf
from torch.utils.data import Dataset, DataLoader
from transformers import Wav2Vec2FeatureExtractor
from tqdm import tqdm
import editdistance
from transformers import HubertModel, Wav2Vec2Model, WavLMModel
import json

import sys

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PACKAGE_ROOT = os.path.dirname(CURRENT_DIR)
if PACKAGE_ROOT not in sys.path:
    sys.path.insert(0, PACKAGE_ROOT)

from trainable_models.transformers_ctc.transformers_ctc import TransformerCTC


# -------------- Training Configuration ---------------- #
config = {
    "models" : [
        {
            "model_name": "facebook/hubert-large-ls960-ft",
            "model_class": HubertModel,
            "checkpoint": "checkpoints/timit/checkpoint_hubert-large-ls960-ft_unfrozen_encoder.pth"
        },
        {
            "model_name": "facebook/wav2vec2-large-lv60",
            "model_class": Wav2Vec2Model,
            "checkpoint": "checkpoints/timit/checkpoint_wav2vec2-large-lv60_unfrozen_encoder.pth"
        },
        {
            "model_name": "facebook/wav2vec2-large-xlsr-53",
            "model_class": Wav2Vec2Model,
            "checkpoint": "checkpoints/timit/checkpoint_wav2vec2-large-xlsr-53_unfrozen_encoder.pth"
        },
        {
            "model_name": "microsoft/wavlm-large",
            "model_class": WavLMModel,
            "checkpoint": "checkpoints/timit/checkpoint_wavlm-large_unfrozen_encoder.pth"
        }
    ],
    "meta" : {
        "frozen_encoder" : [True], #[False],
        "initial_learning_rate" : [3e-4]
    },
    "dataset": {
        "train": ["/path/to/Torgo/F/F01",
                  "/path/to/Torgo/F/F03",
                  "/path/to/Torgo/M/M01",
                  "/path/to/Torgo/M/M02",
                  "/path/to/Torgo/M/M03",
                  "/path/to/Torgo/M/M04"],
        "test": ["/path/to/Torgo/F/F04",
                 "/path/to/Torgo/M/M05"]
    }
}


# -------------- Dataset ---------------- #
TORGO_TO_ARPABET = {
    "ahn": "ah",
    "noi": "sil",
    "noio": "sil",
    "riy": "iy",
    "oa": "ow",
    "h": "hh",
    "et": "eh",
    "aor": "aw",
    "c": "k",
    "si": "s",
    "ff": "f",
    "nh": "ng"
}

ARPABET_61_TO_39 = {
    "aa": "aa", "ae": "ae", "ah": "ah", "ao": "aa", "aw": "aw", "ax": "ax", "ax-h": "ax", "axr": "er",
    "ay": "ay", "b": "b", "bcl": "b", "ch": "ch", "d": "d", "dcl": "d", "dh": "dh", "dx": "dx",
    "eh": "eh", "el": "l", "em": "m", "en": "n", "eng": "ng", "epi": "sil", "er": "er", "ey": "ey",
    "f": "f", "g": "g", "gcl": "g", "h#": "sil", "hh": "hh", "hv": "hh", "ih": "ih", "ix": "ax",
    "iy": "iy", "jh": "jh", "k": "k", "kcl": "k", "l": "l", "m": "m", "n": "n", "ng": "ng",
    "nx": "n", "ow": "ow", "oy": "oy", "p": "p", "pau": "sil", "pcl": "p", "q": "sil", "r": "r",
    "s": "s", "sh": "sh", "t": "t", "tcl": "t", "th": "th", "uh": "uh", "uw": "uw", "ux": "uw",
    "v": "v", "vcl": "v", "w": "w", "y": "y", "z": "z", "zh": "sh", "clf": "sil"
}

PHONEMES_39 = sorted(set(ARPABET_61_TO_39.values()))
BLANK = "<blank>"
VOCAB = [BLANK] + PHONEMES_39
VOCAB_DICT = {p: i for i, p in enumerate(VOCAB)}

class CustomDataset(Dataset):
    def __init__(self, data_paths, feature_extractor_name="facebook/hubert-large-ls960-ft", augment=False, intensity=0.0):
        self.samples = []
        self.feature_extractor = Wav2Vec2FeatureExtractor.from_pretrained(feature_extractor_name)
        self.augment = augment
        self.intensity = intensity
        if self.augment and self.intensity > 0:
            self.augmenter = SpeechAugmenter(sample_rate=16000, intensity=intensity)
        
        # Load samples
        for root_dir in data_paths:
            for root, _, files in os.walk(root_dir):
                if os.path.basename(root).lower() in ["phn_headmic", "phn_arraymic"]:
                    for phn_file in files:
                        if not phn_file.lower().endswith(".phn"):
                            continue

                        phn_path = os.path.join(root, phn_file)
                        wav_path = phn_path.replace("phn_", "wav_").replace(".PHN", ".wav")

                        if not os.path.exists(wav_path):
                            continue

                        with open(phn_path, "r") as f:
                            phonemes = [line.strip().split()[2].lower() for line in f if line.strip()]
                        
                        phonemes = [TORGO_TO_ARPABET.get(ph.lower(), ph).upper() for ph in phonemes]
                        phonemes = [ARPABET_61_TO_39[p.lower()].upper() for p in phonemes if p.lower() in ARPABET_61_TO_39]

                        self.samples.append((wav_path, phonemes))

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        wav_path, phonemes = self.samples[idx]
        try:
            audio, sr = sf.read(wav_path)
        except RuntimeError:
            return None

        if len(audio) > 124000 or len(audio) < 16000:
            return None

        assert sr == 16000, f"Expected 16kHz audio, got {sr}"
        audio = torch.tensor(audio).unsqueeze(0)  # (1, T)

        # Apply Waveform augmentation (only during training)
        if self.augment and self.intensity > 0:
            audio = self.augmenter.waveform_pertubation(audio)

        # extract features
        input_values = self.feature_extractor(
            audio.squeeze(0).numpy(), sampling_rate=16000, return_tensors="pt"
        ).input_values[0]

        # Apply Spec augmentation (only during training)
        if self.augment and self.intensity > 0:
            input_values = self.augmenter.spec_augment(input_values)
            
        # Feature extraction
        input_values = self.feature_extractor(audio.squeeze(0).numpy(), sampling_rate=16000, return_tensors="pt").input_values[0]

        # Convert phonemes to indices
        labels = torch.tensor([VOCAB_DICT[p.lower()] for p in phonemes], dtype=torch.long)

        return input_values, labels

    def get_longest_file(self):
        max_len = 0
        counter = 0
        overall_count = 0

        print(len(self.samples))
        for wav_path, _ in self.samples:
            try:
                audio, sr = sf.read(wav_path)
            except RuntimeError as e:
                print(f"Skipping {wav_path}: {e}")
                continue
            
            if len(audio) > max_len:
                max_len = len(audio)
            if len(audio) > 124000:
                counter += 1
            overall_count += 1
            
        counter = counter / overall_count
        return max_len, counter
    
def collate_fn(batch):
    batch = [b for b in batch if b is not None]
    if len(batch) == 0:
        return None  # tell DataLoader to skip this batch
    
    inputs = [item[0] for item in batch]
    labels = [item[1] for item in batch]
    input_lengths = torch.tensor([len(i) for i in inputs], dtype=torch.long)
    padded_inputs = nn.utils.rnn.pad_sequence(inputs, batch_first=True, padding_value=0)
    attention_mask = (padded_inputs != 0).long()
    label_lengths = torch.tensor([len(l) for l in labels], dtype=torch.long)
    padded_labels = nn.utils.rnn.pad_sequence(labels, batch_first=True, padding_value=VOCAB_DICT[BLANK])
    return padded_inputs, attention_mask, input_lengths, padded_labels, label_lengths


# -------------- Augmentation ---------------- #

import torchaudio
import random
import torch

class SpeechAugmenter:
    def __init__(self, sample_rate=16000, intensity=0.0):
        """
        Args:
            intensity (float): 0.0 = no augmentation, 1.0 = strongest augmentation
        """
        self.sample_rate = sample_rate
        self.intensity = float(max(0.0, min(1.0, intensity)))  # clamp [0,1]

    def speed_perturb(self, waveform):
        # allow Â±10% speed change at max intensity
        max_factor = 0.1 * self.intensity
        rate = 1.0 + random.uniform(-max_factor, max_factor)
        if abs(rate - 1.0) < 1e-3:
            return waveform
        new_len = int(waveform.shape[-1] / rate)
        return torchaudio.functional.resample(
            waveform, self.sample_rate, int(self.sample_rate * rate)
        )[:, :new_len]

    def volume_perturb(self, waveform):
        # up to 3x louder or 0.3x quieter at max intensity
        low, high = 1.0 - 0.7 * self.intensity, 1.0 + 2.0 * self.intensity
        gain = random.uniform(low, high)
        return waveform * gain

    def spec_augment(self, features):
        # increase mask length with intensity
        tmask = int(10 + 40 * self.intensity)
        fmask = int(5 + 20 * self.intensity)
        if random.random() < self.intensity:  # apply more often at higher intensity
            features = torchaudio.transforms.TimeMasking(time_mask_param=tmask)(features)
        if random.random() < self.intensity:
            features = torchaudio.transforms.FrequencyMasking(freq_mask_param=fmask)(features)
        return features

    def waveform_pertubation(self, waveform):
        if random.random() < 0.5 * self.intensity:
            waveform = self.speed_perturb(waveform)
        if random.random() < 0.5 * self.intensity:
            waveform = self.volume_perturb(waveform)
        return waveform
    

# -------------- Training and Validation ---------------- #

def decode_predictions(logits, blank_id=VOCAB_DICT[BLANK]):
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
        prev = None
        for s in seq:
            if s != prev and s != blank_id:
                dedup.append(s)
            prev = s
        decoded.append(dedup)
    return decoded

def train_epoch(model, dataloader, optimizer, criterion, device):
    model.train()
    total_loss = 0
    total_edits = 0
    total_length = 0
    pbar = tqdm(dataloader, desc="Training", leave=False)
    for batch in pbar:
        if batch is None:   # skip empty batches from collate_fn
            continue

        # Unpack batch
        inputs, attention_mask, input_lengths, labels, label_lengths = batch

        inputs = inputs.to(device)
        attention_mask = attention_mask.to(device)
        labels = labels.to(device)

        optimizer.zero_grad()
        logits = model(inputs, attention_mask=attention_mask)
        log_probs = nn.functional.log_softmax(logits, dim=-1)

        input_lengths = torch.full(size=(inputs.size(0),), fill_value=logits.size(1), dtype=torch.long)
        loss = criterion(log_probs.transpose(0, 1), labels, input_lengths, label_lengths)
        loss.backward()
        optimizer.step()

        total_loss += loss.item()

        # Decode predictions and compute PER
        preds = decode_predictions(logits, blank_id=VOCAB_DICT[BLANK])
        labels_np = [label[:length].cpu().numpy().tolist() for label, length in zip(labels, label_lengths)]

        for pred, target in zip(preds, labels_np):
            dist = editdistance.eval(target, pred)
            total_edits += dist
            total_length += len(target)

        pbar.set_postfix(loss=loss.item())

    avg_loss = total_loss / len(dataloader)
    avg_per = total_edits / total_length if total_length > 0 else 0
    return avg_loss, avg_per

def val_epoch(model, dataloader, criterion, device):
    model.eval()
    total_loss = 0
    total_edits = 0
    total_length = 0
    pbar = tqdm(dataloader, desc="Validation", leave=False)
    with torch.no_grad():
        for batch in pbar:
            if batch is None:   # skip empty batches from collate_fn
                continue

            # Unpack batch
            inputs, attention_mask, input_lengths, labels, label_lengths = batch
            inputs = inputs.to(device)
            attention_mask = attention_mask.to(device)
            labels = labels.to(device)

            logits = model(inputs, attention_mask=attention_mask)
            log_probs = nn.functional.log_softmax(logits, dim=-1)
            input_lengths = torch.full(size=(inputs.size(0),), fill_value=logits.size(1), dtype=torch.long)
            loss = criterion(log_probs.transpose(0, 1), labels, input_lengths, label_lengths)

            total_loss += loss.item()

            preds = decode_predictions(logits, blank_id=VOCAB_DICT[BLANK])
            labels_np = [label[:length].cpu().numpy() for label, length in zip(labels, label_lengths)]

            for pred, target in zip(preds, labels_np):
                dist = editdistance.eval(target, pred)
                total_edits += dist
                total_length += len(target)

            pbar.set_postfix(loss=loss.item())

    avg_loss = total_loss / len(dataloader)
    avg_per = total_edits / total_length if total_length > 0 else 0
    return avg_loss, avg_per


# -------------- Main Training Loop ---------------- #
def main():
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(device)

    max_epochs = 50
    early_stopping_patience = 5
    augmentation_intensity = 0.2

    for model_desc in config.get("models"):
        for frozen_encoder, initial_learning_rate in zip(config["meta"]["frozen_encoder"], config["meta"]["initial_learning_rate"]):
            print(f"\n\n--- Training model: {model_desc['model_name']} (frozen encoder: {frozen_encoder}, learning rate: {initial_learning_rate}) ---")
            
            # define dataset
            train_dataset = CustomDataset(config["dataset"]["train"], feature_extractor_name=model_desc["model_name"], augment=True, intensity=augmentation_intensity)
            test_dataset = CustomDataset(config["dataset"]["test"], feature_extractor_name=model_desc["model_name"], augment=False)
            train_loader = DataLoader(train_dataset, batch_size=2, shuffle=True, collate_fn=collate_fn)
            test_loader = DataLoader(test_dataset, batch_size=2, shuffle=False, collate_fn=collate_fn)
            
            # define model, optimizer, and loss function
            model = TransformerCTC(
                model_desc["model_class"],
                model_desc["model_name"],
                num_classes=len(VOCAB),
                vocab=VOCAB,
                blank_token=BLANK,
                pretrained_weights=model_desc.get("checkpoint", None)
            ).to(device)

            # Freeze encoder if needed
            if frozen_encoder:
                for param in model.encoder.parameters():
                    param.requires_grad = False

            optimizer = optim.AdamW(model.parameters(), lr=initial_learning_rate)
            criterion = nn.CTCLoss(blank=VOCAB_DICT[BLANK], zero_infinity=True)

            best_val_per = float('inf')
            counter = 0

            # Store stats for plotting
            train_losses, val_losses = [], []
            train_pers, val_pers = [], []

            for epoch in range(max_epochs):
                train_loss, train_per = train_epoch(model, train_loader, optimizer, criterion, device)
                val_loss, val_per = val_epoch(model, test_loader, criterion, device)

                train_losses.append(train_loss)
                val_losses.append(val_loss)
                train_pers.append(train_per)
                val_pers.append(val_per)

                print(f"Epoch {epoch+1}: Train Loss = {train_loss:.4f}, Train PER = {train_per:.4f}, Val Loss = {val_loss:.4f}, Val PER = {val_per:.4f}")

                if val_per < best_val_per:
                    best_val_per = val_per
                    counter = 0
                    torch.save(
                        {
                            "model_state_dict": model.state_dict(),
                            "vocab": VOCAB,
                            "model_name": model_desc["model_name"],
                            "model_class": model_desc["model_class"].__name__
                        },
                        f"checkpoint_torgo_{model_desc['model_name'].rsplit('/', 1)[-1]}_{'frozen' if frozen_encoder else 'unfrozen'}_encoder_augmentation_{augmentation_intensity}.pth"
                    )
                else:
                    counter += 1
                    if counter >= early_stopping_patience:
                        print(f"Early stopping at epoch {epoch+1}")
                        break

            print(f"Finished training model: {model_desc['model_name']} (frozen encoder: {frozen_encoder}) with best validation PER: {best_val_per:.4f}")

            # ---------- Plot and save PER curve ---------- #
            """
            plt.figure(figsize=(8, 5))
            plt.plot(range(1, len(train_pers)+1), train_pers, label="Train PER", marker='o')
            plt.plot(range(1, len(val_pers)+1), val_pers, label="Validation PER", marker='s')
            plt.xlabel("Epoch")
            plt.ylabel("Phoneme Error Rate")
            plt.title(f"PER Curve â€” {model_desc['model_name'].split('/')[-1]} ({'frozen' if frozen_encoder else 'unfrozen'})")
            plt.legend()
            plt.grid(True)
            plt.tight_layout()

            # File name for the plot
            plot_filename = f"PER_curve_{model_desc['model_name'].rsplit('/',1)[-1]}_{'frozen' if frozen_encoder else 'unfrozen'}_aug{augmentation_intensity}.png"
            plt.savefig(plot_filename)
            plt.close()

            print(f"Saved PER curve to {plot_filename}")
            """

            # ---------- Save PER stats as JSON ---------- #
            stats = {
                "train_losses": train_losses,
                "val_losses": val_losses,
                "train_pers": train_pers,
                "val_pers": val_pers,
                "best_val_per": best_val_per,
                "augmentation_intensity": augmentation_intensity,
                "frozen_encoder": frozen_encoder,
                "learning_rate": initial_learning_rate
            }

            json_filename = f"PER_stats_{model_desc['model_name'].rsplit('/',1)[-1]}_{'frozen' if frozen_encoder else 'unfrozen'}_aug{augmentation_intensity}.json"
            with open(json_filename, "w", encoding="utf-8") as f:
                json.dump(stats, f, indent=4)

            print(f"Saved PER stats to {json_filename}")

if __name__ == "__main__":
    main()
