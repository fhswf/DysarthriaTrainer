import os
import torch
import torch.nn as nn
import torch.optim as optim
import soundfile as sf
from torch.utils.data import Dataset, DataLoader
from transformers import Wav2Vec2FeatureExtractor
from glob import glob
from tqdm import tqdm
import editdistance
from transformers import HubertModel, Wav2Vec2Model, WavLMModel, Data2VecAudioModel
import matplotlib.pyplot as plt

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
            "model_class": HubertModel
        },
        {
            "model_name": "facebook/wav2vec2-large-lv60",
            "model_class": Wav2Vec2Model
        },
        {
            "model_name": "facebook/wav2vec2-large-xlsr-53",
            "model_class": Wav2Vec2Model
        },
        {
            "model_name": "microsoft/wavlm-large",
            "model_class": WavLMModel
        },
        {   
            "model_name": "facebook/data2vec-audio-large-960h",
            "model_class": Data2VecAudioModel
        }
    ],
    "meta" : {
        "frozen_encoder" : [True, False],
        "initial_learning_rate" : [1e-4, 3e-4]
    },
    "dataset": {
        "train": ["/path/to/Timit/data/TRAIN"],
        "test": ["/path/to/Timit/data/TEST"]
    },
}


# -------------- Dataset ---------------- #
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
    def __init__(self, data_paths, feature_extractor_name):
        self.samples = []
        for data_path in data_paths:
            for phn_path in glob(os.path.join(data_path, "**/*.PHN"), recursive=True):
                wav_path = phn_path.replace('.PHN', '.WAV')
                if not os.path.exists(wav_path):
                    continue
                with open(phn_path) as f:
                    phns = [line.strip().split()[-1] for line in f]
                phns_39 = [ARPABET_61_TO_39[p] for p in phns if p in ARPABET_61_TO_39]
                self.samples.append((wav_path, phns_39))
        self.feature_extractor = Wav2Vec2FeatureExtractor.from_pretrained(feature_extractor_name)

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        wav_path, phonemes = self.samples[idx]
        audio, sr = sf.read(wav_path)
        assert sr == 16000, f"Expected 16kHz audio, got {sr}"
        input_values = self.feature_extractor(audio, sampling_rate=16000, return_tensors="pt").input_values[0]
        # Convert phonemes to indices
        labels = torch.tensor([VOCAB_DICT[p] for p in phonemes], dtype=torch.long)
        return input_values, labels

    def get_longest_file(self):
        max_len = 0
        longest_file = None
        for wav_path, _ in self.samples:
            audio, sr = sf.read(wav_path)
            if len(audio) > max_len:
                max_len = len(audio)
                longest_file = wav_path
        return longest_file, max_len
    
def collate_fn(batch):
    inputs = [item[0] for item in batch]
    labels = [item[1] for item in batch]
    input_lengths = torch.tensor([len(i) for i in inputs], dtype=torch.long)
    padded_inputs = nn.utils.rnn.pad_sequence(inputs, batch_first=True, padding_value=0)
    attention_mask = (padded_inputs != 0).long()
    label_lengths = torch.tensor([len(l) for l in labels], dtype=torch.long)
    padded_labels = nn.utils.rnn.pad_sequence(labels, batch_first=True, padding_value=VOCAB_DICT[BLANK])
    return padded_inputs, attention_mask, input_lengths, padded_labels, label_lengths


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
    for inputs, attention_mask, input_lengths, labels, label_lengths in pbar:
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
        for inputs, attention_mask, input_lengths, labels, label_lengths in pbar:
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

    max_epochs = 25
    early_stopping_patience = 5

    for model_desc in config.get("models"):
        try:
            for frozen_encoder, initial_learning_rate in zip(
                config["meta"]["frozen_encoder"], config["meta"]["initial_learning_rate"]
            ):
                print(f"\n\n--- Training model: {model_desc['model_name']} "
                      f"(frozen encoder: {frozen_encoder}, learning rate: {initial_learning_rate}) ---")

                # define dataset
                train_dataset = CustomDataset(config["dataset"]["train"], feature_extractor_name=model_desc["model_name"])
                print(f"Longest file: {train_dataset.get_longest_file()}")
                test_dataset = CustomDataset(config["dataset"]["test"], feature_extractor_name=model_desc["model_name"])
                train_loader = DataLoader(train_dataset, batch_size=8, shuffle=True, collate_fn=collate_fn)
                test_loader = DataLoader(test_dataset, batch_size=8, shuffle=False, collate_fn=collate_fn)

                # define model, optimizer, and loss function
                model = TransformerCTC(
                    model_desc["model_class"],
                    model_desc["model_name"],
                    num_classes=len(VOCAB),
                    vocab=VOCAB,
                    blank_token=BLANK,
                    pretrained_weights=model_desc.get("pretrained_weights", None)
                ).to(device)

                # optionally freeze encoder
                if frozen_encoder:
                    for param in model.encoder.parameters():
                        param.requires_grad = False

                optimizer = optim.AdamW(model.parameters(), lr=initial_learning_rate)
                criterion = nn.CTCLoss(blank=VOCAB_DICT[BLANK], zero_infinity=True)

                best_val_per = float('inf')
                counter = 0

                # Track metrics
                train_pers, val_pers = [], []
                train_losses, val_losses = [], []

                for epoch in range(max_epochs):
                    train_loss, train_per = train_epoch(model, train_loader, optimizer, criterion, device)
                    val_loss, val_per = val_epoch(model, test_loader, criterion, device)

                    train_losses.append(train_loss)
                    val_losses.append(val_loss)
                    train_pers.append(train_per)
                    val_pers.append(val_per)

                    print(f"Epoch {epoch+1}: Train Loss = {train_loss:.4f}, Train PER = {train_per:.4f}, "
                          f"Val Loss = {val_loss:.4f}, Val PER = {val_per:.4f}")

                    if val_per < best_val_per:
                        best_val_per = val_per
                        counter = 0
                        torch.save(
                            {
                                "model_state_dict": model.state_dict(),
                                "vocab": VOCAB,
                                "model_name": model_desc["model_name"],
                                "model_class": model_desc["model_class"].__name__,
                            },
                            f"checkpoint_timit_{model_desc['model_name'].rsplit('/', 1)[-1]}_"
                            f"{'frozen' if frozen_encoder else 'unfrozen'}_encoder.pth",
                        )
                    else:
                        counter += 1
                        if counter >= early_stopping_patience:
                            print(f"Early stopping at epoch {epoch+1}")
                            break

                # ----- Plot and save PER curve -----
                plt.figure(figsize=(8, 5))
                plt.plot(train_pers, label="Train PER")
                plt.plot(val_pers, label="Validation PER")
                plt.title(f"Phoneme Error Rate - {model_desc['model_name']} "
                          f"({'frozen' if frozen_encoder else 'unfrozen'})")
                plt.xlabel("Epoch")
                plt.ylabel("Phoneme Error Rate")
                plt.legend()
                plt.grid(True)

                out_name = f"per_plot_{model_desc['model_name'].rsplit('/',1)[-1]}_" \
                           f"{'frozen' if frozen_encoder else 'unfrozen'}.png"
                plt.savefig(out_name)
                plt.close()

                print(f"Saved PER plot to {out_name}")
                print(f"Finished training model: {model_desc['model_name']} "
                      f"(frozen encoder: {frozen_encoder}) with best validation PER: {best_val_per:.4f}")

        except Exception as e:
            print(f"Error training model {model_desc['model_name']}: {e}")
            continue

if __name__ == "__main__":
    main()
