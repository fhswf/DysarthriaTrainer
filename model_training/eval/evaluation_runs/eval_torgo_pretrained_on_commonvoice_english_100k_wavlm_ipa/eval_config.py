from transformers import WavLMModel

config = {
    "models" : [
        {
            "alias": "wavlm_on_torgo_pretrained_on_commonvoice_english_100k",
            "encoder": "microsoft/wavlm-large",
            "model_class": WavLMModel,
            "checkpoint": "checkpoints/commonvoice/checkpoint_commonvoice-english-100k_wavlm-large_unfrozen_encoder.pth"
        }
    ]
}