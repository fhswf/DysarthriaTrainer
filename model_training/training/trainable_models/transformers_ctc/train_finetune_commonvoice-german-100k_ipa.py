import os
import torch
import torch.nn as nn
import torch.optim as optim
import soundfile as sf
from torch.utils.data import Dataset, DataLoader
from transformers import Wav2Vec2FeatureExtractor
from tqdm import tqdm
import editdistance
from transformers import HubertModel, Wav2Vec2Model, WavLMModel
import json

from transformers_ctc import TransformerCTC


# -------------- Training Configuration ---------------- #
config = {
    "models" : [
        {
            "model_name": "microsoft/wavlm-large",
            "model_class": WavLMModel,
            "checkpoint": "checkpoints/timit/checkpoint_wavlm-large_unfrozen_encoder.pth"
        }
    ],
    "meta" : {
        "frozen_encoder" : [False], #[True],
        "initial_learning_rate" : [1e-5] #[1e-4]
    },
    "dataset": {
        "train": ["/path/to/CommonVoice/cv-corpus-22.0-2025-06-20/de/data/train"],
        "test": ["/path/to/CommonVoice/cv-corpus-22.0-2025-06-20/de/data/test"]
    }
}


# -------------- Dataset ---------------- #
IPA_PHONEMES = [
    "a", "aj", "aw", "aː", "b", "c", "cʰ", "d", "eː", "f", "h", "iː", "j", "k", "kʰ",
    "l", "l̩", "m", "m̩", "n", "n̩", "oː", "p", "pf", "pʰ", "s", "spn", "t", "ts", "tʃ",
    "tʰ", "uː", "v", "x", "yː", "z", "ç", "øː", "ŋ", "œ", "ɐ", "ɔ", "ɔʏ", "ə", "ɛ",
    "ɟ", "ɡ", "ɪ", "ɲ", "ʁ", "ʃ", "ʊ", "ʏ"
]

BLANK = "<blank>"
VOCAB = [BLANK] + IPA_PHONEMES
VOCAB_DICT = {p: i for i, p in enumerate(VOCAB)}

class CustomDataset(Dataset):
    def __init__(self, data_paths, feature_extractor_name="facebook/hubert-large-ls960-ft"):
        self.samples = []
        self.feature_extractor = Wav2Vec2FeatureExtractor.from_pretrained(feature_extractor_name)
        
        # Load samples
        for root_dir in data_paths:
            for root, _, files in os.walk(root_dir):
                for phn_file in files:
                    if not phn_file.lower().endswith(".txt"):
                        continue

                    phn_path = os.path.join(root, phn_file)
                    wav_path = os.path.splitext(phn_path)[0] + ".wav"

                    if not os.path.exists(wav_path):
                        continue

                    # read phonemes from space-separated line
                    with open(phn_path, "r", encoding="utf-8") as f:
                        content = f.read().strip()
                        phonemes = content.split()
                    
                    # optional: keep only valid IPA phonemes
                    for phoneme in phonemes:
                        if phoneme not in IPA_PHONEMES:
                            print(f"[WARN] Unknown phoneme '{phoneme}' in file {phn_path}") 

                    phonemes = [p for p in phonemes if p in IPA_PHONEMES]

                    self.samples.append((wav_path, phonemes))

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        wav_path, phonemes = self.samples[idx]
        try:
            audio, sr = sf.read(wav_path)
        except RuntimeError:
            return None

        if len(audio) > 124000: #or len(audio) < 16000:
            return None

        assert sr == 16000, f"Expected 16kHz audio, got {sr}"
        audio = torch.tensor(audio).unsqueeze(0)  # (1, T)

        # Feature extraction
        input_values = self.feature_extractor(audio.squeeze(0).numpy(), sampling_rate=16000, return_tensors="pt").input_values[0]

        # Convert phonemes to indices
        labels = torch.tensor([VOCAB_DICT[p] for p in phonemes], dtype=torch.long)

        return input_values, labels

    def get_longest_file(self):
        max_len = 0
        counter = 0
        overall_count = 0

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

"""
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
"""
def collate_fn(batch):
    batch = [b for b in batch if b is not None]
    if len(batch) == 0:
        return None  # tell DataLoader to skip this batch

    MIN_SAMPLES = 16000  # 1 second at 16kHz

    inputs = []
    labels = []

    for audio, label in batch:
        # Pad audio to at least 1 second
        if audio.size(0) < MIN_SAMPLES:
            pad_len = MIN_SAMPLES - audio.size(0)
            audio = torch.cat([audio, torch.zeros(pad_len, dtype=audio.dtype, device=audio.device)])
        inputs.append(audio)
        labels.append(label)

    input_lengths = torch.tensor([i.size(0) for i in inputs], dtype=torch.long)
    padded_inputs = nn.utils.rnn.pad_sequence(inputs, batch_first=True, padding_value=0)

    # Safer attention mask
    attention_mask = torch.zeros_like(padded_inputs, dtype=torch.long)
    for i, l in enumerate(input_lengths):
        attention_mask[i, :l] = 1

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

    for batch in pbar:
        if batch is None:
            continue

        # Unpack batch
        inputs, attention_mask, input_lengths, labels, label_lengths = batch
        inputs = inputs.to(device)
        attention_mask = attention_mask.to(device)
        labels = labels.to(device)

        optimizer.zero_grad()
        logits = model(inputs, attention_mask=attention_mask)
        log_probs = nn.functional.log_softmax(logits, dim=-1)

        # CTC requires the actual length of input sequence
        input_lengths_ctc = torch.full(
            size=(inputs.size(0),), fill_value=logits.size(1), dtype=torch.long
        )

        # Compute loss
        loss = criterion(
            log_probs.transpose(0, 1),  # (T, B, C)
            labels,
            input_lengths_ctc,
            label_lengths
        )
        loss.backward()
        optimizer.step()
        total_loss += loss.item()

        # --- Decode predictions ---
        preds = decode_predictions(logits, blank_id=VOCAB_DICT[BLANK])

        labels_np = [label[:length].cpu().numpy().tolist() for label, length in zip(labels, label_lengths)]

        # Compute PER
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
            if batch is None:
                continue

            # Unpack batch
            inputs, attention_mask, input_lengths, labels, label_lengths = batch
            inputs = inputs.to(device)
            attention_mask = attention_mask.to(device)
            labels = labels.to(device)

            # Forward pass
            logits = model(inputs, attention_mask=attention_mask)
            log_probs = nn.functional.log_softmax(logits, dim=-1)

            # CTC requires the actual length of input sequence
            input_lengths_ctc = torch.full(
                size=(inputs.size(0),), fill_value=logits.size(1), dtype=torch.long
            )

            # Compute loss
            loss = criterion(
                log_probs.transpose(0, 1),  # (T, B, C)
                labels,
                input_lengths_ctc,
                label_lengths
            )
            total_loss += loss.item()

            # --- Decode predictions ---
            preds = decode_predictions(logits, blank_id=VOCAB_DICT[BLANK])

            # --- Remove blanks from labels for PER calculation ---
            labels_np = [label[:length].cpu().numpy().tolist() for label, length in zip(labels, label_lengths)]

            # Compute PER
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

    for model_desc in config.get("models"):
        for frozen_encoder, initial_learning_rate in zip(config["meta"]["frozen_encoder"], config["meta"]["initial_learning_rate"]):
            print(f"\n\n--- Training model: {model_desc['model_name']} (frozen encoder: {frozen_encoder}, learning rate: {initial_learning_rate}) ---")
            
            # define dataset
            train_dataset = CustomDataset(config["dataset"]["train"], feature_extractor_name=model_desc["model_name"])
            test_dataset = CustomDataset(config["dataset"]["test"], feature_extractor_name=model_desc["model_name"])
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

            json_filename = f"PER_stats_{model_desc['model_name'].rsplit('/',1)[-1]}_{'frozen' if frozen_encoder else 'unfrozen'}.json"

            for epoch in range(max_epochs):
                train_loss, train_per = train_epoch(model, train_loader, optimizer, criterion, device)
                val_loss, val_per = val_epoch(model, test_loader, criterion, device)

                train_losses.append(train_loss)
                val_losses.append(val_loss)
                train_pers.append(train_per)
                val_pers.append(val_per)

                print(f"Epoch {epoch+1}: Train Loss = {train_loss:.4f}, Train PER = {train_per:.4f}, Val Loss = {val_loss:.4f}, Val PER = {val_per:.4f}")
                
                # ---------- Save PER stats as JSON ---------- #
                stats = {
                    "train_losses": train_losses,
                    "val_losses": val_losses,
                    "train_pers": train_pers,
                    "val_pers": val_pers,
                    "best_val_per": best_val_per,
                    "frozen_encoder": frozen_encoder,
                    "learning_rate": initial_learning_rate
                }

                with open(json_filename, "w", encoding="utf-8") as f:
                    json.dump(stats, f, indent=4)

                # ---------- Early Stopping and Checkpointing ---------- #    
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
                        f"checkpoint_commonvoice-german-100k_{model_desc['model_name'].rsplit('/', 1)[-1]}_{'frozen' if frozen_encoder else 'unfrozen'}_encoder.pth"
                    )
                else:
                    counter += 1
                    if counter >= early_stopping_patience:
                        print(f"Early stopping at epoch {epoch+1}")
                        break
                
            print(f"Finished training model: {model_desc['model_name']} (frozen encoder: {frozen_encoder}) with best validation PER: {best_val_per:.4f}")


if __name__ == "__main__":
    main()