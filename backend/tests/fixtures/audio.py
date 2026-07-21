"""
Audio Test Fixtures

Provides reusable test fixtures for audio-related tests.
"""

import io
from pathlib import Path
from typing import BinaryIO

import numpy as np
import pytest
import soundfile as sf


@pytest.fixture
def sample_rate() -> int:
    """Standard sample rate for test audio."""
    return 16000


@pytest.fixture
def audio_duration() -> float:
    """Standard duration for test audio in seconds."""
    return 2.0


@pytest.fixture
def clean_speech_audio(sample_rate: int, audio_duration: float) -> bytes:
    """
    Generate clean speech-like audio for testing.
    
    Simulates clean speech with good SNR, no clipping.
    """
    # Generate speech-like signal with harmonics
    t = np.linspace(0, audio_duration, int(sample_rate * audio_duration))
    
    # Fundamental frequency (typical male voice ~120 Hz)
    f0 = 120
    
    # Generate harmonics
    signal = np.zeros_like(t)
    for harmonic in range(1, 6):
        amplitude = 0.3 / harmonic  # Decreasing amplitude
        signal += amplitude * np.sin(2 * np.pi * f0 * harmonic * t)
    
    # Add amplitude modulation (speech envelope)
    envelope = 0.5 + 0.5 * np.sin(2 * np.pi * 3 * t)
    signal = signal * envelope
    
    # Normalize to reasonable level (-12 dB)
    signal = signal * 0.25
    
    # Convert to WAV bytes
    buffer = io.BytesIO()
    sf.write(buffer, signal, sample_rate, format='WAV', subtype='PCM_16')
    buffer.seek(0)
    return buffer.read()


@pytest.fixture
def clipped_speech_audio(sample_rate: int, audio_duration: float) -> bytes:
    """
    Generate clipped audio for testing.
    
    Simulates audio with clipping distortion (peaks at ±1.0).
    """
    t = np.linspace(0, audio_duration, int(sample_rate * audio_duration))
    
    # Generate signal that will clip
    signal = 1.5 * np.sin(2 * np.pi * 200 * t)
    
    # Clip signal
    signal = np.clip(signal, -1.0, 1.0)
    
    # Convert to WAV bytes
    buffer = io.BytesIO()
    sf.write(buffer, signal, sample_rate, format='WAV', subtype='PCM_16')
    buffer.seek(0)
    return buffer.read()


@pytest.fixture
def noisy_speech_audio(sample_rate: int, audio_duration: float) -> bytes:
    """
    Generate noisy speech audio for testing.
    
    Simulates speech with high background noise (low SNR ~5 dB).
    """
    t = np.linspace(0, audio_duration, int(sample_rate * audio_duration))
    
    # Generate speech signal
    signal = 0.2 * np.sin(2 * np.pi * 150 * t)
    
    # Add strong noise
    noise = np.random.normal(0, 0.15, len(t))
    signal = signal + noise
    
    # Normalize
    signal = signal / np.max(np.abs(signal)) * 0.8
    
    # Convert to WAV bytes
    buffer = io.BytesIO()
    sf.write(buffer, signal, sample_rate, format='WAV', subtype='PCM_16')
    buffer.seek(0)
    return buffer.read()


@pytest.fixture
def quiet_speech_audio(sample_rate: int, audio_duration: float) -> bytes:
    """
    Generate very quiet speech audio for testing.
    
    Simulates audio recorded too far from microphone (low RMS).
    """
    t = np.linspace(0, audio_duration, int(sample_rate * audio_duration))
    
    # Generate very quiet signal
    signal = 0.01 * np.sin(2 * np.pi * 150 * t)
    
    # Convert to WAV bytes
    buffer = io.BytesIO()
    sf.write(buffer, signal, sample_rate, format='WAV', subtype='PCM_16')
    buffer.seek(0)
    return buffer.read()


@pytest.fixture
def audio_numpy_clean(sample_rate: int, audio_duration: float) -> np.ndarray:
    """Clean audio as numpy array (float32)."""
    t = np.linspace(0, audio_duration, int(sample_rate * audio_duration))
    signal = 0.3 * np.sin(2 * np.pi * 150 * t)
    return signal.astype(np.float32)


@pytest.fixture
def audio_numpy_noisy(sample_rate: int, audio_duration: float) -> np.ndarray:
    """Noisy audio as numpy array (float32)."""
    t = np.linspace(0, audio_duration, int(sample_rate * audio_duration))
    signal = 0.2 * np.sin(2 * np.pi * 150 * t)
    noise = np.random.normal(0, 0.15, len(t))
    return (signal + noise).astype(np.float32)


@pytest.fixture
def test_audio_files_dir(tmp_path: Path) -> Path:
    """
    Create temporary directory with test audio files.
    
    Returns path to directory containing:
    - clean_speech.wav
    - clipped_speech.wav
    - noisy_speech.wav
    - quiet_speech.wav
    """
    audio_dir = tmp_path / "audio"
    audio_dir.mkdir()
    
    sample_rate = 16000
    duration = 2.0
    t = np.linspace(0, duration, int(sample_rate * duration))
    
    # Clean speech
    clean = 0.3 * np.sin(2 * np.pi * 150 * t)
    sf.write(audio_dir / "clean_speech.wav", clean, sample_rate)
    
    # Clipped speech
    clipped = np.clip(1.5 * np.sin(2 * np.pi * 200 * t), -1.0, 1.0)
    sf.write(audio_dir / "clipped_speech.wav", clipped, sample_rate)
    
    # Noisy speech
    signal = 0.2 * np.sin(2 * np.pi * 150 * t)
    noise = np.random.normal(0, 0.15, len(t))
    noisy = (signal + noise) / np.max(np.abs(signal + noise)) * 0.8
    sf.write(audio_dir / "noisy_speech.wav", noisy, sample_rate)
    
    # Quiet speech
    quiet = 0.01 * np.sin(2 * np.pi * 150 * t)
    sf.write(audio_dir / "quiet_speech.wav", quiet, sample_rate)
    
    return audio_dir
