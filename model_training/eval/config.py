datasets = {
    "timit": {
        "train_dir": ["/path/to/Timit/data/TRAIN"],
        "test_dir": ["/path/to/Timit/data/TEST"]
    },
    "torgo_ipa": {
        "train_dir": ["/path/to/Torgo/F/F01",
                    "/path/to/Torgo/F/F03",
                    "/path/to/Torgo/M/M01",
                    "/path/to/Torgo/M/M02",
                    "/path/to/Torgo/M/M03",
                    "/path/to/Torgo/M/M04"],
        "test_dir": ["/path/to/Torgo/F/F04",
                 "/path/to/Torgo/M/M05"],
        "vocabulary": [
            'h', 'aw', 'n', 'v', 'i', 'ŋ', 'm', 'b', 'ɒː', 'ɪ', 'ʃ', 'ɑː', 'ɲ', 
            'ɛ', 'ʉ', 'g', 'o', 'w', 'z', 'l', 'ɹ', 'θ', 'spn', 'ɛː', 'a', 'æ', 
            'ɜ', 'aj', 'd', 'ʉː', 'tʃ', 'ə', 'eː', 'ð', 'aː', 'ʊ', 'oː', 'p', 
            'u', 'k', 'oj', 'ɡ', 't', 'iː', 'dʒ', 'ɑ', 'ɒ', 'ɜː', 's', 'e', 'f', 
            'uː', 'ɫ', 'j', 'ɔ', 'ʒ'
        ]
    },
    "torgo_arpabet": {
        "train_dir": ["/path/to/Torgo/F/F01",
                    "/path/to/Torgo/F/F03",
                    "/path/to/Torgo/M/M01",
                    "/path/to/Torgo/M/M02",
                    "/path/to/Torgo/M/M03",
                    "/path/to/Torgo/M/M04"],
        "test_dir": ["/path/to/Torgo/F/F04",
                 "/path/to/Torgo/M/M05"],
        "vocabulary": ['aa', 'ae', 'ah', 'aw', 'ax', 'ay', 'b', 'ch', 'd', 'dh',
                       'dx', 'eh', 'er', 'ey', 'f', 'g', 'hh', 'ih', 'iy', 'jh', 
                       'k', 'l', 'm', 'n', 'ng', 'ow', 'oy', 'p', 'r', 's', 'sh', 
                       'sil', 't', 'th', 'uh', 'uw', 'v', 'w', 'y', 'z'
        ]
    },
    "commonvoice_german_100k": {
        "train_dir": ["/path/to/CommonVoice/cv-corpus-22.0-2025-06-20/de/data/train"],
        "test_dir": ["/path/to/CommonVoice/cv-corpus-22.0-2025-06-20/de/data/test"],
        "vocabulary": [
            "a", "aj", "aw", "aː", "b", "c", "cʰ", "d", "eː", "f", "h", "iː", "j", "k", "kʰ",
            "l", "l̩", "m", "m̩", "n", "n̩", "oː", "p", "pf", "pʰ", "s", "spn", "t", "ts", "tʃ",
            "tʰ", "uː", "v", "x", "yː", "z", "ç", "øː", "ŋ", "œ", "ɐ", "ɔ", "ɔʏ", "ə", "ɛ",
            "ɟ", "ɡ", "ɪ", "ɲ", "ʁ", "ʃ", "ʊ", "ʏ"
        ]
    },
    "commonvoice_english_100k": {
        "train_dir": ["/path/to/CommonVoice/mcv-scripted-en-v23.0/cv-corpus-23.0-2025-09-05/en/data/train"],
        "test_dir": ["/path/to/CommonVoice/mcv-scripted-en-v23.0/cv-corpus-23.0-2025-09-05/en/data/test"],
        "vocabulary": [
            'h', 'aw', 'n', 'v', 'i', 'ŋ', 'm', 'b', 'ɒː', 'ɪ', 'ʃ', 'ɑː', 'ɲ', 
            'ɛ', 'ʉ', 'g', 'o', 'w', 'z', 'l', 'ɹ', 'θ', 'spn', 'ɛː', 'a', 'æ', 
            'ɜ', 'aj', 'd', 'ʉː', 'tʃ', 'ə', 'eː', 'ð', 'aː', 'ʊ', 'oː', 'p', 
            'u', 'k', 'oj', 'ɡ', 't', 'iː', 'dʒ', 'ɑ', 'ɒ', 'ɜː', 's', 'e', 'f', 
            'uː', 'ɫ', 'j', 'ɔ', 'ʒ'
        ]
    }
}