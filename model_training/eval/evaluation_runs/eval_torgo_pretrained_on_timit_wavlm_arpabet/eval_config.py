from transformers import WavLMModel

config = {
    "models" : [
        {
            "alias": "wavlm_on_torgo_pretrained_on_timit",
            "encoder": "microsoft/wavlm-large",
            "model_class": WavLMModel,
            "checkpoint": "checkpoints/timit/checkpoint_wavlm-large_unfrozen_encoder.pth"
        }
    ]
}