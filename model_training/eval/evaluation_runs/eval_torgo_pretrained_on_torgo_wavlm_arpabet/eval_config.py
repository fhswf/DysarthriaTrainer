from transformers import WavLMModel

config = {
    "models" : [
        {
            "alias": "wavlm_on_torgo_pretrained_on_torgo",
            "encoder": "microsoft/wavlm-large",
            "model_class": WavLMModel,
            "checkpoint": "checkpoints/torgo/checkpoint_torgo_wavlm-large_frozen_encoder.pth"
            #"checkpoint": "checkpoints/torgo/checkpoint_torgo_wavlm-large_unfrozen_encoder.pth"
        }
    ]
}