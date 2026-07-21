from transformers import WavLMModel, HubertModel, Wav2Vec2Model

config = {
    "models" : [
        {
            "alias": "wav2vec2-xlsr_on_torgo_pretrained_on_torgo",
            "encoder": "facebook/wav2vec2-large-xlsr-53",
            "model_class": Wav2Vec2Model,
            "checkpoint": "checkpoints/torgo/checkpoint_torgo_wav2vec2-large-xlsr-53_frozen_encoder.pth"
        }
    ]
}