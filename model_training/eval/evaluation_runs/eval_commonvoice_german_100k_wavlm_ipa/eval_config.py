from transformers import WavLMModel

config = {
    "models" : [
        {
            "alias": "wavlm_on_commonvoice_german_100k",
            "encoder": "microsoft/wavlm-large",
            "model_class": WavLMModel,
            "checkpoint": "checkpoints/commonvoice/checkpoint_commonvoice-german-100k_wavlm-large_unfrozen_encoder.pth"
        }
    ]
}