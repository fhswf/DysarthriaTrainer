"""
Exercise-related enums for speech therapy system.
"""

from enum import Enum


class DifficultyLevel(str, Enum):
    """Difficulty levels for exercises."""
    
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"


class ExerciseItemType(str, Enum):
    """Types of exercise items."""
    
    # Speech practice types
    MINIMAL_PAIR = "minimal_pair"        # Minimal pair exercises (e.g., /b/ vs /p/)
    WORD = "word"                         # Single word practice
    SENTENCE = "sentence"                 # Sentence-level practice
    
    # Voice and breathing types
    BREATHING = "breathing"               # Breathing exercises
    VOCALIZATION = "vocalization"         # Voice production exercises
    ARTICULATION = "articulation"         # Articulation exercises
    RHYTHM = "rhythm"                     # Rhythm and timing exercises
    INTONATION = "intonation"            # Intonation pattern exercises
    
    # Physical and informational types
    MOVEMENT = "movement"                 # Physical movement instruction
    SPEECH_PRACTICE = "speech_practice"   # General speech practice (legacy)
    INFORMATION = "information"           # Context, explanations, notes


class MediaFileType(str, Enum):
    """Types of media files."""
    
    IMAGE = "image"
    AUDIO = "audio"
    VIDEO = "video"


class InformationType(str, Enum):
    """Types of informational content."""
    
    CONTEXT = "context"            # Background information
    SAFETY = "safety"              # Safety warnings/notes
    TIP = "tip"                    # Helpful tips
    EXPLANATION = "explanation"    # How-to explanations
