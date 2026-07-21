# Training & Model Evaluation

This readme describes how to set up your environment and prepare datasets and checkpoints to train and evaluate transformer-based phoneme recognition models.

## License
The source code for training and evaluating phoneme recognition models is licensed under the MIT License (see [LICENSE](LICENSE)).
Pretrained model checkpoints are **not** covered by the MIT License. They are subject to the respective licenses and terms of use of underlying datasets.

## Setup
1. Install Python 3.10 and Conda

2. Set up conda environment with required Python 3.10 modules (Note: newer Python versions will likely not work due to sentencepiece build errors):
    ```
    # bash
    conda create -n phoneme_recognition python=3.10 -c conda-forge
    conda activate phoneme_recognition
    pip install torch==2.6.0 torchaudio==2.6.0 --index-url https://download.pytorch.org/whl/cu118
    set PYTHONUTF8=1
    pip install -r requirements.txt*
    ```

3. Download and unzip Timit and Torgo datasets. If you want to train on CommonVoice (english or german), download the dataset and follow the preparation steps in [training/datasets/prep](training/datasets/prep) to create phoneme labels for CommonVoice data. 

    Adapt the dataset pathes in [training/settings.py](training/settings.py) and [eval/config.py](eval/config.py).

4. If you want to reuse pretrained model checkpoints, download them first:

    | Model | Trained on | Pretrained on | Link |
    |---|---|---|---|
    | WavLM | CommonVoice (English, 100k) | — | [Download](https://fh-swf.sciebo.de/s/TcTaZqTMKLf3RDT) |
    | WavLM | CommonVoice (German, 100k) | — | [Download](https://fh-swf.sciebo.de/s/E4ZHoYsiHyPi8eH) |
    | WavLM | Torgo | CommonVoice, Timit | [Download](https://fh-swf.sciebo.de/s/ZWNRSzFXAeRHcQt) |
    | WavLM | Torgo | Timit | [Download](https://fh-swf.sciebo.de/s/89B7AZGPLLW454y) |
    | WavLM | Torgo | Timit | [Download](https://fh-swf.sciebo.de/s/XLJ38WMp5JJ5YMY) |
    | WavLM | Timit | — | [Download](https://fh-swf.sciebo.de/s/Yqr6Be492bKm4Tx) |
    | WavLM | Timit | — | [Download](https://fh-swf.sciebo.de/s/aNjPAg7yQYjEcQY) |

    Then place the checkpoints under [training/trainable_models/transformers_ctc/checkpoints](training/trainable_models/transformers_ctc/checkpoints) and [eval/checkpoints](eval/checkpoints), or create symlinks from the checkpoint location to these locations.
    
    **Remark**: Note that not all model checkpoints referenced in the training and evaluation run configs have been made available, i.e. only WavLM checkpoints are linked in the table above. Please check and adjust your training or evaluation configs accordingly, or retrain for other model architectures.

5. To train transformer models, use [training/training_runs](training/training_runs) as a basis and create your own training configurations.
    
    If you need the model implementation details, see [training/trainable_models/transformers_ctc](training/trainable_models/transformers_ctc).

6. To evaluate the trained transformer models, use the scripts under [eval/evaluation_runs](eval/evaluation_runs) as a basis and create your own evaluation configurations.