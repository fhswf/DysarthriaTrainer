from dataclasses import dataclass
from typing import TypedDict
from collections import OrderedDict
import torch

@dataclass
class Checkpoint:
    model_state_dict: OrderedDict[str, torch.Tensor]
    vocab: list[str]
    model_name: str
    model_class: str