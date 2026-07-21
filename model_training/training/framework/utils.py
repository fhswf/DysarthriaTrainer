import editdistance
import unicodedata
import pandas as pd
from sklearn.metrics import confusion_matrix
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import seaborn as sns
from difflib import SequenceMatcher


# ARPABet to IPA Phoneme Mapping (source: ChatGPT)
ARPABET_TO_IPA = {
    "aa": "ɑ",
    "aa0": "ɑ",
    "aa1": "ɑ",
    "aa2": "ɑ",

    "ae": "æ",
    "ae0": "æ",
    "ae1": "æ",
    "ae2": "æ",

    "ah": "ʌ",
    "ah0": "ə",        # unstressed schwa variant
    "ah1": "ʌ",
    "ah2": "ʌ",

    "ao": "ɔ",
    "ao0": "ɔ",
    "ao1": "ɔ",
    "ao2": "ɔ",

    "aw": "aʊ",
    "aw0": "aʊ",
    "aw1": "aʊ",
    "aw2": "aʊ",

    "ax": "ə",
    "ax0": "ə",
    "ax1": "ə",
    "ax2": "ə",

    "axr": "ɚ",
    "axr0": "ɚ",
    "axr1": "ɚ",
    "axr2": "ɚ",

    "ay": "aɪ",
    "ay0": "aɪ",
    "ay1": "aɪ",
    "ay2": "aɪ",

    "b": "b",
    "ch": "tʃ",
    "tS": "tʃ",          # same as ch, affricate

    "d": "d",
    "dh": "ð",
    "dx": "ɾ",

    "eh": "ɛ",
    "eh0": "ɛ",
    "eh1": "ɛ",
    "eh2": "ɛ",

    "el": "l̩",
    "em": "m̩",
    "en": "n̩",
    "eng": "ŋ̍",

    "er": "ɝ",
    "er0": "ɚ",          # unstressed variant
    "er1": "ɝ",
    "er2": "ɚ",

    "ey": "eɪ",
    "ey0": "eɪ",
    "ey1": "eɪ",
    "ey2": "eɪ",

    "f": "f",
    "g": "ɡ",
    "hh": "h",
    "hv": "ɦ",
    "ih": "ɪ",
    "ih0": "ɪ",
    "ih1": "ɪ",
    "ih2": "ɪ",

    "ix": "ɨ",
    "iy": "i",
    "iy0": "i",
    "iy1": "i",
    "iy2": "i",

    "jh": "dʒ",
    "d3": "dʒ",       # same as jh, affricate

    "k": "k",
    "kcl": "̥k",
    "l": "l",
    "m": "m",
    "n": "n",
    "ng": "ŋ",
    "ngcl": "̥ŋ",
    "ow": "oʊ",
    "ow0": "oʊ",
    "ow1": "oʊ",
    "ow2": "oʊ",

    "oy": "ɔɪ",
    "oy0": "ɔɪ",
    "oy1": "ɔɪ",
    "oy2": "ɔɪ",

    "p": "p",
    "pcl": "̥p",
    "q": "ʔ",
    "r": "ɹ",
    "s": "s",
    "sh": "ʃ",
    "zh": "ʒ",
    "t": "t",
    "tcl": "̥t",
    "th": "θ",
    "uh": "ʊ",
    "uh0": "ʊ",
    "uh1": "ʊ",
    "uh2": "ʊ",

    "uw": "u",
    "uw0": "u",
    "uw1": "u",
    "uw2": "u",

    "ux": "ʉ",
    "v": "v",
    "w": "w",
    "y": "j",
    "z": "z",

    "bcl": "̥b",    # voiceless bilabial closure (stop) — rare, closure only
    "dcl": "̥d",    # voiceless alveolar closure (stop)
    "gcl": "̥ɡ",    # voiceless velar closure (stop)
    "epi": "ʔ",     # epiglottal stop or glottal stop (used as a catch-all glottal stop)
    "ax-h": "ə̥",   # voiceless schwa (an unstressed, voiceless vowel)
    "nx": "ŋ̥"     # voiceless velar nasal
}

TIMIT_61_TO_39 = {
    "aa": "aa", "ae": "ae", "ah": "ah", "ah0": "ax", "ao": "aa", "aw": "aw", "ax": "ax", "ax-h": "ax", "axr": "er",
    "ay": "ay", "b": "b", "bcl": "b", "ch": "ch", "d": "d", "dcl": "d", "dh": "dh", "dx": "dx",
    "eh": "eh", "el": "l", "em": "m", "en": "n", "eng": "ng", "epi": "sil", "er": "er", "ey": "ey",
    "f": "f", "g": "g", "gcl": "g", "h#": "sil", "hh": "hh", "hv": "hh", "ih": "ih", "ix": "ax",
    "iy": "iy", "jh": "jh", "k": "k", "kcl": "k", "l": "l", "m": "m", "n": "n", "ng": "ng",
    "nx": "n", "ow": "ow", "oy": "oy", "p": "p", "pau": "sil", "pcl": "p", "q": "sil", "r": "r",
    "s": "s", "sh": "sh", "t": "t", "tcl": "t", "th": "th", "uh": "uh", "uw": "uw", "ux": "uw",
    "v": "v", "vcl": "v", "w": "w", "y": "y", "z": "z", "zh": "sh", "clf": "sil"
}

def simplified_arpabet(phoneme):
    """Convert TIMIT 61 phoneme set to 39 phoneme set."""
    if isinstance(phoneme, str):
        return TIMIT_61_TO_39.get(phoneme.lower(), phoneme).upper()
    elif isinstance(phoneme, list):
        return [TIMIT_61_TO_39.get(ph.lower(), ph).upper() for ph in phoneme]
    
def arpabet2ipa(arpabet_phoneme):
    if isinstance(arpabet_phoneme, str):
        return ARPABET_TO_IPA.get(arpabet_phoneme.lower(), None)
    elif isinstance(arpabet_phoneme, list):
        phonemes = [ARPABET_TO_IPA.get(ph.lower(), None) for ph in arpabet_phoneme]
        return [ph for ph in phonemes if ph]

def ipa2arpabet(ipa_phoneme):
    ipa_to_arpabet = {}
    for k, v in ARPABET_TO_IPA.items():
        if v not in ipa_to_arpabet:
            ipa_to_arpabet[v] = k

    if isinstance(ipa_phoneme, str):
        return ipa_to_arpabet.get(ipa_phoneme, None)
    elif isinstance(ipa_phoneme, list):
        arpabet_phonemes = [ipa_to_arpabet.get(ph, None) for ph in ipa_phoneme]
        return [ph for ph in arpabet_phonemes if ph]
    
def get_phoneme_sequence(output):
    phonemes =  [phoneme for phoneme, _, _ in output if phoneme]
    return normalize_ipa(phonemes)

def phoneme_error_rate(ref, hyp):
    dist = editdistance.eval(ref, hyp)
    per = dist / len(ref) if len(ref) > 0 else 0.0
    return per

def normalize_ipa(phonems, merge_diphthongs=True):
    normalized_phonems = []

    for ph in phonems:
        # Decompose characters into base + diacritics (NFD form)
        ph = unicodedata.normalize('NFD', ph)

        # Remove all diacritics (e.g., voiceless: ̥, syllabic: ̩)
        ph = ''.join(c for c in ph if unicodedata.category(c) != 'Mn')

        # Normalize vowel variants
        ph = ph.replace('ɨ', 'ɪ')  # centralized ɪ → regular ɪ
        ph = ph.replace('ʉ', 'u')  # barred u → u (if applicable)
        ph = ph.replace('ɔ', 'ɑ')  # open-mid back → open back
        #ph = ph.replace('o', 'oʊ') # TIMIT sometimes uses 'o' instead of 'ow' → match to diphthong

        ph = ph.replace('g', 'ɡ')
        ph = ph.replace('ɑɪ', 'aɪ')
        ph = ph.replace('ɒ', 'ɑ')
        ph = ph.replace('ɑʊ', 'aʊ')
        ph = ph.replace('ɦ', 'h')
        ph = ph.replace('iː', 'i')
        ph = ph.replace('uː', 'u')
        ph = ph.replace('eː', 'eɪ')
        ph = ph.replace('ɯ', 'u')

        # Normalize affricates and others if needed
        ph = ph.replace('ʤ', 'dʒ')  # safe, in case alt forms exist
        ph = ph.replace('ʧ', 'tʃ')

        # Final recompose characters (optional)
        ph = unicodedata.normalize('NFC', ph)
        normalized_phonems.append(ph)

    # Merge diphthongs split into vowels + glides
    if not merge_diphthongs:
        return normalized_phonems
    
    i = 0
    combined_phonems = []
    while i < len(normalized_phonems):
        if i+1 < len(normalized_phonems):
            pair = normalized_phonems[i] + normalized_phonems[i+1]
            if normalized_phonems[i] == 'a' and normalized_phonems[i+1] == 'j':
                combined_phonems.append('aɪ')
                i += 2
                continue
            elif normalized_phonems[i] == 'o' and normalized_phonems[i+1] != 'ʊ':
                combined_phonems.append('oʊ')
                i += 1
                continue
            elif normalized_phonems[i] == 'e' and normalized_phonems[i+1] != 'ɪ':
                combined_phonems.append('eɪ')
                i += 1
                continue
            elif normalized_phonems[i] == 'a' and normalized_phonems[i+1] == 'w':
                combined_phonems.append('aʊ')
                i += 2
                continue
        # Remove aspiration
        ph = normalized_phonems[i].replace('tʰ', 't').replace('pʰ', 'p').replace('kʰ', 'k')
        combined_phonems.append(ph)
        i += 1

    return combined_phonems

def align_sequences(ref, hyp):
    matcher = SequenceMatcher(None, ref, hyp)
    aligned_ref, aligned_hyp = [], []

    for tag, i1, i2, j1, j2 in matcher.get_opcodes():
        if tag == 'equal':
            aligned_ref.extend(ref[i1:i2])
            aligned_hyp.extend(hyp[j1:j2])
        elif tag == 'replace':
            for r, h in zip(ref[i1:i2], hyp[j1:j2]):
                aligned_ref.append(r)
                aligned_hyp.append(h)
        elif tag == 'delete':
            aligned_ref.extend(ref[i1:i2])
            aligned_hyp.extend(['-'] * (i2 - i1))
        elif tag == 'insert':
            aligned_ref.extend(['-'] * (j2 - j1))
            aligned_hyp.extend(hyp[j1:j2])

    return aligned_ref, aligned_hyp

def plot_confusion_matrix(y_true, y_pred, labels=None, save_as=None):
    cm = confusion_matrix(y_true, y_pred, labels=labels)
    df_cm = pd.DataFrame(cm, index=labels, columns=labels)
    plt.figure(figsize=(14, 12))
    sns.heatmap(df_cm, annot=True, fmt='d', cmap='Blues', annot_kws={"size":6})
    plt.xlabel("Predicted")
    plt.ylabel("Ground Truth")
    plt.title("Phoneme Confusion Matrix")
    plt.xticks(rotation=45)
    plt.xticks(fontsize=6)
    plt.yticks(rotation=0)
    plt.yticks(fontsize=6)

    if save_as:
        plt.savefig(save_as, bbox_inches='tight', dpi=300)
    else:
        plt.show()