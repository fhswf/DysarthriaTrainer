import os
import editdistance
from collections import defaultdict
import json

from framework.utils import align_sequences, plot_confusion_matrix, plot_phoneme_per_vs_count


class CustomEvaluator:
    def __init__(self, output_dir, model, dataset):
        self.model = model
        self.dataset = dataset
        self.output_dir = output_dir
        os.makedirs(output_dir, exist_ok=True)

    def evaluate(self, verbose=False, max_samples=None):        
        print(f"Evaluating model {self.model.get_name()} on dataset: {self.dataset.get_name()}")

        total_edits = 0
        total_length = 0
        evaluation_data = {
            "phoneme_sequence_gt": [],
            "phoneme_sequence_pred": []
        }

        # per-phoneme statistics
        phoneme_stats = defaultdict(lambda: {
            "correct": 0,
            "substitution": 0,
            "deletion": 0,
            "insertion": 0
        })

        # get audio files and phoneme sequences
        audio_files, phoneme_sequences = zip(*self.dataset.samples)

        if max_samples is not None:
            audio_files = audio_files[:max_samples]
            phoneme_sequences = phoneme_sequences[:max_samples]

        # loop over data samples            
        for i, (audio_file, phoneme_sequence) in enumerate(zip(audio_files, phoneme_sequences)):
            print(f"Processing {audio_file} ({i+1}/{len(audio_files)})...")

            phoneme_sequence = self.dataset.vocabulary_alignment(phoneme_sequence)
            
            # run inference
            predicted, confidences = self.model.predict_from_file(audio_file)
            if len(predicted) == 0:
                print(f" - {self.model.get_name()} failed to process {audio_file}")
                continue

            predicted = self.dataset.vocabulary_alignment(predicted)

            if verbose:
                print(f" - Predicted: {predicted}")
                print(f" - Confidences: {confidences}")
                print(f" - Groundtruth: {phoneme_sequence}")

            # accumulate edit distance for weighted PER
            total_edits += editdistance.eval(phoneme_sequence, predicted)
            total_length += len(phoneme_sequence)

            # alignment (must return same length sequences, with gaps as "-")
            aligned_ref, aligned_pred = align_sequences(phoneme_sequence, predicted)

            evaluation_data["phoneme_sequence_gt"].extend(aligned_ref)
            evaluation_data["phoneme_sequence_pred"].extend(aligned_pred)

            # accumulate phoneme-level stats
            for ref_ph, pred_ph in zip(aligned_ref, aligned_pred):
                if ref_ph == pred_ph:
                    phoneme_stats[ref_ph]["correct"] += 1
                elif ref_ph == "-":   # insertion
                    phoneme_stats[pred_ph]["insertion"] += 1
                elif pred_ph == "-":  # deletion
                    phoneme_stats[ref_ph]["deletion"] += 1
                else:                 # substitution
                    phoneme_stats[ref_ph]["substitution"] += 1

        # === Summary ===
        print("\nEvaluation Summary:")
        if total_length > 0:
            avg_error_rate = total_edits / total_length
            print(f" - Average error rate for {self.model.get_name()} on {self.dataset.get_name()}: {avg_error_rate:.2f}")
        else:
            avg_error_rate = 0.0
            print(f" - No predictions for {self.model.get_name()} on {self.dataset.get_name()}")

        # confusion matrix
        phoneme_sequence_gt = evaluation_data["phoneme_sequence_gt"]
        phoneme_sequence_pred = evaluation_data["phoneme_sequence_pred"]
        labels = sorted(set(phoneme_sequence_gt + phoneme_sequence_pred))
        plot_name = f"{self.model.get_name()}_{self.dataset.get_name()}_confusion_matrix.png"
        export_path = os.path.join(self.output_dir, plot_name)
        plot_confusion_matrix(phoneme_sequence_gt, phoneme_sequence_pred, labels=labels, save_as=export_path)

        # compute per-phoneme PER
        phoneme_per_results = {}
        for ph, stats in phoneme_stats.items():
            total_ref = stats["correct"] + stats["substitution"] + stats["deletion"]
            if total_ref > 0:
                per = (stats["substitution"] + stats["deletion"] + stats["insertion"]) / total_ref
            else:
                per = 0.0
            phoneme_per_results[ph] = {
                **stats,
                "PER": per
            }

        # plot per-phoneme error rates over count
        plot_name = f"{self.model.get_name()}_{self.dataset.get_name()}_per_over_count.png"
        export_path = os.path.join(self.output_dir, plot_name)
        plot_phoneme_per_vs_count(phoneme_per_results, save_as=export_path)

        # store everything in evaluation_data
        evaluation_data["error_rate"] = avg_error_rate
        evaluation_data["phoneme_stats"] = phoneme_per_results

        # drop temporary lists to keep memory low
        del evaluation_data["phoneme_sequence_gt"]
        del evaluation_data["phoneme_sequence_pred"]

        save_name = f"{self.model.get_name()}_{self.dataset.get_name()}_evaluation.json"
        save_path = os.path.join(self.output_dir, save_name)

        with open(save_path, "w", encoding="utf-8") as f:
            json.dump(evaluation_data, f, indent=4, ensure_ascii=False)
            
        return evaluation_data
        