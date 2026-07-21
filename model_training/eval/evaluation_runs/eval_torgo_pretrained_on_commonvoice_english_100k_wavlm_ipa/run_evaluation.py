import torch
import os

from framework.evaluation import CustomEvaluator
from framework.transformers_ctc import TransformerCTC
from datasets.torgo_ipa import TorgoIpaDataset

from evaluation_runs.eval_torgo_pretrained_on_commonvoice_english_100k_wavlm_ipa.eval_config import config


# define output directory
current_file_path = os.path.abspath(__file__)
current_dir = os.path.dirname(current_file_path)
output_dir = os.path.join(current_dir, "results")

# define device
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# load dataset and model
model_desc = config["models"][0]
dataset = TorgoIpaDataset(encoder=model_desc["encoder"], usecase="test")

model = TransformerCTC(
                model_desc["alias"],
                model_desc["model_class"],
                model_desc["encoder"],
                num_classes=len(dataset.vocab),
                vocab=dataset.vocab,
                blank_token=dataset.blank,
                pretrained_weights=model_desc.get("checkpoint", None)
            ).to(device)

evaluator = CustomEvaluator(output_dir=output_dir, model=model, dataset=dataset)
evaluator.evaluate(verbose=True)   