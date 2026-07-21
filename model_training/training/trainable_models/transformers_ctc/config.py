from transformers import HubertModel, Wav2Vec2Model, WavLMModel, Data2VecAudioModel

# Timit checkpoints
"""
CHECKPOINTS = {
    "hubert_ctc": "checkpoints/timit/checkpoint_hubert-large-ls960-ft_unfrozen_encoder.pth",
    "wav2vec2_ctc": "checkpoints/timit/checkpoint_wav2vec2-large-lv60_unfrozen_encoder.pth",
    "wav2vec2_xlsr_ctc": "checkpoints/timit/checkpoint_wav2vec2-large-xlsr-53_unfrozen_encoder.pth",
    "wavlm_ctc": "checkpoints/timit/checkpoint_wavlm-large_unfrozen_encoder.pth"
}
"""

# Finetuned Torgo checkpoints
CHECKPOINTS = {
    "hubert_ctc": "checkpoints/torgo/checkpoint_torgo_hubert-large-ls960-ft_frozen_encoder.pth",
    "wav2vec2_ctc": "checkpoints/torgo/checkpoint_torgo_wav2vec2-large-lv60_frozen_encoder.pth",
    "wav2vec2_xlsr_ctc": "checkpoints/torgo/checkpoint_torgo_wav2vec2-large-xlsr-53_frozen_encoder.pth",
    #"wavlm_ctc": "checkpoints/torgo/checkpoint_torgo_wavlm-large_frozen_encoder.pth",
    "wavlm_ctc": "checkpoints/timit/checkpoint_wavlm-large_unfrozen_encoder.pth",
    "hubert_ctc_commonvoice": "checkpoints/commonvoice/checkpoint_commonvoice_hubert-large-ls960-ft_unfrozen_encoder.pth"
}

# Model Classes
MODEL_CLASSES = {
    "HubertModel": HubertModel,
    "Wav2Vec2Model": Wav2Vec2Model,
    "WavLMModel": WavLMModel,
    "Data2VecAudioModel": Data2VecAudioModel
}
