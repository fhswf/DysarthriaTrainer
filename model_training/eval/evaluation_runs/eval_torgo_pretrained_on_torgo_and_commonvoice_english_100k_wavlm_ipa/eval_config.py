from transformers import WavLMModel

config = {
    "models" : [
        {
            "alias": "wavlm_on_torgo_pretrained_on_torgo_and_commonvoice_english_100k",
            "encoder": "microsoft/wavlm-large",
            "model_class": WavLMModel,
            "checkpoint": "checkpoints/torgo/checkpoint_torgo_wavlm_pretrained-on-commonvoice_unfrozen-encoder.pth"
        }
    ]
}