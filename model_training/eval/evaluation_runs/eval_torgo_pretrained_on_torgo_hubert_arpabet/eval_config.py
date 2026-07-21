from transformers import WavLMModel, HubertModel

config = {
    "models" : [
        {
            "alias": "hubert_on_torgo_pretrained_on_torgo",
            "encoder": "facebook/hubert-large-ls960-ft",
            "model_class": HubertModel,
            "checkpoint": "checkpoints/torgo/checkpoint_torgo_hubert-large-ls960-ft_frozen_encoder.pth"
        }
    ]
}