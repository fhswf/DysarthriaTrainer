from transformers import HubertModel

config = {
    "models" : [
        {
            "alias": "hubert_on_commonvoice_german",
            "encoder": "facebook/hubert-large-ls960-ft",
            "model_class": HubertModel,
            "checkpoint": "checkpoints/commonvoice/hubert_on_commonvoice_german.pth"
        }
    ]
}