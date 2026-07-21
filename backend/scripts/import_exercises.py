"""
Script to import exercises from legacy JSON format to new database structure.

Usage:
    python3 backend/scripts/import_exercises.py
"""

import json
import sys
import re
from pathlib import Path
from uuid import uuid4
from datetime import datetime, timezone
from typing import Any

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))


def flatten_to_string(value: Any) -> str:
    """Flatten nested arrays and values to strings."""
    if isinstance(value, list):
        # Recursively flatten nested lists
        flattened = []
        for item in value:
            if isinstance(item, list):
                flattened.append(flatten_to_string(item))
            else:
                flattened.append(str(item))
        return ", ".join(flattened)
    return str(value)


def generate_slug(name: str) -> str:
    """Generate URL-friendly slug from name."""
    # Convert to lowercase and replace special chars
    slug = name.lower()
    slug = slug.replace('ä', 'ae').replace('ö', 'oe').replace('ü', 'ue').replace('ß', 'ss')
    slug = re.sub(r'[^a-z0-9]+', '-', slug)
    slug = slug.strip('-')
    return slug


def clean_json_manually(content: str) -> str:
    """Manually clean and fix the malformed JSON."""
    lines = content.split('\n')
    result_lines = []
    skip_until_bracket = 0
    
    i = 0
    while i < len(lines):
        line = lines[i]
        original_line = line
        
        # Remove // comments
        if '//' in line:
            comment_pos = line.find('//')
            before_comment = line[:comment_pos]
            # Only treat as comment if outside quotes
            if before_comment.count('"') % 2 == 0:
                line = before_comment.rstrip()
        
        stripped = line.strip()
        
        # Skip completely empty lines
        if not stripped:
            i += 1
            continue
        
        # Handle empty objects: { } or {  },
        if stripped in ['{', '{,']:
            # Look ahead to see if next non-empty is }
            lookahead = i + 1
            found_close = False
            while lookahead < len(lines) and lookahead < i + 10:
                next_stripped = lines[lookahead].strip().replace('//', '').strip()
                if next_stripped:
                    if next_stripped in ['}', '},']:
                        found_close = True
                        skip_until_bracket = lookahead
                        break
                    else:
                        break
                lookahead += 1
            
            if found_close:
                # Skip the empty object entirely
                i = skip_until_bracket + 1
                continue
        
        # Escape unescaped quotes within string values
        # Replace internal quotes with escaped quotes
        if '": "' in line:
            # Simple approach: find string values and escape internal quotes
            # Pattern: "key": "value with "nested" quotes"
            match = re.search(r'(":\s*")([^"]*)(".*")([^"]*")', line)
            if match and '"' in match.group(2)+match.group(3)+match.group(4):
                # There are nested quotes - we need to escape them
                # This is tricky, let's use a different approach
                # Find the value part after ": "
                parts = line.split('": "', 1)
                if len(parts) == 2:
                    key_part = parts[0] + '": "'
                    value_part = parts[1]
                    # Find the closing quote (last quote before , or end of line)
                    if value_part.rstrip().endswith('",') or value_part.rstrip().endswith('"'):
                        # Count quotes - if odd number, we have nested quotes
                        quote_count = value_part.count('"')
                        if quote_count > 1:  # More than just the closing quote
                            # Replace all quotes except the last one with escaped version
                            last_quote_pos = value_part.rfind('"')
                            before_last = value_part[:last_quote_pos]
                            after_last = value_part[last_quote_pos:]
                            # Escape all quotes in the middle part
                            before_last = before_last.replace('"', '\\"')
                            line = key_part + before_last + after_last
        
        # Fix: String followed by array needs comma
        # Pattern: "text"<whitespace>["array"] 
        if '"' in line and not line.strip().endswith(','):
            # Check if next line starts with [
            if i + 1 < len(lines):
                next_line = lines[i + 1].strip()
                if next_line.startswith('['):
                    # Add comma to current line if it ends with "
                    if line.rstrip().endswith('"'):
                        line = line.rstrip() + ','
        
        # Keep the line
        result_lines.append(line)
        i += 1
    
    result = '\n'.join(result_lines)
    
    # Fix missing commas between array elements
    # Pattern: ]<whitespace>[ without comma
    result = re.sub(r']\s*\n\s*\[', '],\n[', result)
    
    # Fix missing commas between array and string
    # Pattern: ]<whitespace>"string" without comma
    result = re.sub(r']\s*\n\s*"', '],\n"', result)
    
    # Fix trailing commas before closing brackets/braces
    result = re.sub(r',(\s*[}\]])', r'\1', result)
    
    # Fix multiple consecutive commas
    result = re.sub(r',\s*,', ',', result)
    
    return result


def transform_exercise_data(json_file_path: str) -> dict:
    """
    Transform legacy JSON exercise data to new database structure.
    
    Returns a dict with:
    - categories: List of exercise categories
    - exercises: List of exercises with nested instructions and items
    """
    
    with open(json_file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Clean the JSON
    print("Cleaning malformed JSON...")
    cleaned_content = clean_json_manually(content)
    
    # Save cleaned version for inspection
    debug_file = Path(json_file_path).parent / 'exercises_cleaned.json'
    with open(debug_file, 'w', encoding='utf-8') as f:
        f.write(cleaned_content)
    print(f"✓ Cleaned JSON saved to {debug_file}")
    
    try:
        data = json.loads(cleaned_content)
    except json.JSONDecodeError as e:
        print(f"❌ JSON parsing error at line {e.lineno}, column {e.colno}: {e.msg}")
        # Show context around error
        lines = cleaned_content.split('\n')
        start = max(0, e.lineno - 3)
        end = min(len(lines), e.lineno + 3)
        print("\nContext:")
        for i in range(start, end):
            marker = " >>> " if i == e.lineno - 1 else "     "
            print(f"{marker}{i+1:4d}: {lines[i]}")
        raise
    
    print(f"✓ JSON parsed successfully")
    
    categories = []
    exercises = []
    
    category_order = 0
    total_skipped = 0
    
    for bereich in data.get('bereiche', []):
        if not bereich:
            continue
            
        # Create category
        category_id = str(uuid4())
        category_name = bereich.get('name', 'Unnamed Category')
        category_slug = generate_slug(category_name)
        
        category = {
            'id': category_id,
            'name': category_name,
            'slug': category_slug,
            'description': f"Exercises for {category_name}",
            'icon_url': None,
            'display_order': category_order,
            'deleted_at': None,
            'deleted_by': None,
            'created_at': datetime.now(timezone.utc).isoformat(),
            'updated_at': datetime.now(timezone.utc).isoformat(),
        }
        categories.append(category)
        category_order += 1
        
        exercise_order = 0
        
        # Process exercises (uebungen)
        for uebung in bereich.get('uebungen', []):
            # Skip empty, null, or completely invalid exercises
            if not uebung or not isinstance(uebung, dict):
                total_skipped += 1
                continue
            
            # Skip if no ID and no title
            if not uebung.get('id') and not uebung.get('ueberschrift'):
                total_skipped += 1
                continue
                
            exercise_id = str(uuid4())
            
            # Extract basic info with fallbacks
            code = uebung.get('id', f"{bereich.get('id', 'UNK')}_{exercise_order:03d}")
            title = uebung.get('ueberschrift', 'Untitled Exercise')
            subtitle = uebung.get('umfang', '')
            
            # Determine difficulty from title/content (simplified logic)
            difficulty = 'beginner'  # Default
            title_lower = title.lower()
            if 'fortgeschritten' in title_lower or 'advanced' in title_lower:
                difficulty = 'advanced'
            elif 'mittel' in title_lower or 'intermediate' in title_lower:
                difficulty = 'intermediate'
            
            exercise = {
                'id': exercise_id,
                'category_id': category_id,
                'code': code,
                'title': title,
                'subtitle': subtitle if subtitle else None,
                'scope': None,
                'difficulty_level': difficulty,
                'estimated_duration_minutes': 10,  # Default estimate
                'display_order': exercise_order,
                'version': 1,
                'is_active': True,
                'superseded_by': None,
                'deleted_at': None,
                'deleted_by': None,
                'created_at': datetime.now(timezone.utc).isoformat(),
                'updated_at': datetime.now(timezone.utc).isoformat(),
                'created_by': None,
                'instructions': [],
                'items': [],
            }
            
            # Process beschreibung -> instructions
            beschreibung = uebung.get('beschreibung')
            if beschreibung and isinstance(beschreibung, dict):
                instruction_id = str(uuid4())
                
                hint = beschreibung.get('hinweis', '')
                explanation = beschreibung.get('erklaerung', '')
                
                # Only create instruction if we have content
                if hint or explanation:
                    instruction = {
                        'id': instruction_id,
                        'exercise_id': exercise_id,
                        'language': 'de',
                        'hint_text': hint if hint else None,
                        'explanation_text': explanation if explanation else None,
                        'safety_notes': None,
                        'audio_instruction_url': None,  # Ignoring mp3 for now
                        'image_url': None,  # Ignoring grafik for now
                        'created_at': datetime.now(timezone.utc).isoformat(),
                        'updated_at': datetime.now(timezone.utc).isoformat(),
                    }
                    exercise['instructions'].append(instruction)
            
            # Process aktion -> exercise items
            aktionen = uebung.get('aktion', [])
            if aktionen and isinstance(aktionen, list):
                for item_order, aktion in enumerate(aktionen):
                    # Skip empty/null actions
                    if not aktion:
                        continue
                    
                    item_id = str(uuid4())
                    content_id = str(uuid4())
                    
                    # Flatten any nested arrays to string
                    text_content = flatten_to_string(aktion)
                    
                    # Skip if content is empty after flattening
                    if not text_content or text_content.strip() == '':
                        continue
                    
                    # Determine item type based on content
                    item_type = 'speech_practice'  # Default
                    text_lower = text_content.lower()
                    
                    if any(word in text_lower for word in ['bewegen', 'bewegung', 'drücken', 'massage', 'kreisen', 'ziehen']):
                        item_type = 'movement'
                    elif any(word in text_lower for word in ['sprechen sie', 'sagen sie', 'flüstern', 'tönen', 'rufen']):
                        item_type = 'speech_practice'
                    elif any(word in text_lower for word in ['atmen', 'luft', 'nase', 'mund']):
                        item_type = 'breathing'
                    
                    # Further classify speech practice
                    if item_type == 'speech_practice':
                        # Check for minimal pairs (short with dash)
                        if len(text_content) < 20 and '-' in text_content:
                            item_type = 'minimal_pair'
                        # Check for single words or short phrases
                        elif len(text_content.split()) <= 5 and not '.' in text_content:
                            item_type = 'word'
                        # Otherwise it's a sentence
                        else:
                            item_type = 'sentence'
                    
                    item = {
                        'id': item_id,
                        'exercise_id': exercise_id,
                        'item_type': item_type,
                        'display_order': item_order,
                        'repetitions': 5,  # Default from "5-mal wiederholen"
                        'duration_seconds': None,
                        'item_metadata': None,
                        'created_at': datetime.now(timezone.utc).isoformat(),
                        'updated_at': datetime.now(timezone.utc).isoformat(),
                        'contents': []
                    }
                    
                    # Create content for the item
                    content = {
                        'id': content_id,
                        'item_id': item_id,
                        'language': 'de',
                        'text_content': text_content,
                        'demonstration_video_url': None,
                        'image_url': None,
                        'phonetic_transcription': None,
                        'audio_example_url': None,
                        'difficulty': None,
                        'info_type': None,
                        'created_at': datetime.now(timezone.utc).isoformat(),
                        'updated_at': datetime.now(timezone.utc).isoformat(),
                    }
                    
                    item['contents'].append(content)
                    exercise['items'].append(item)
            
            # Only add exercise if it has at least one item or instruction
            if exercise['items'] or exercise['instructions']:
                exercises.append(exercise)
                exercise_order += 1
            else:
                total_skipped += 1
    
    print(f"✓ Transformation complete")
    if total_skipped > 0:
        print(f"  ⚠ Skipped {total_skipped} invalid/empty exercises")
    
    return {
        'categories': categories,
        'exercises': exercises,
    }


def main():
    """Main import function."""
    
    # Path to source JSON
    json_file = Path(__file__).parent.parent.parent / 'data' / 'Aufgaben-Uebungen_komplett_20251109.json'
    
    if not json_file.exists():
        print(f"Error: JSON file not found at {json_file}")
        return
    
    print("Transforming exercise data...")
    transformed_data = transform_exercise_data(str(json_file))
    
    # Output to new JSON file
    output_file = Path(__file__).parent.parent.parent / 'data' / 'exercises_transformed.json'
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(transformed_data, f, ensure_ascii=False, indent=2)
    
    print(f"\n✅ Transformation complete!")
    print(f"📊 Statistics:")
    print(f"   - Categories: {len(transformed_data['categories'])}")
    print(f"   - Exercises: {len(transformed_data['exercises'])}")
    
    total_items = sum(len(ex['items']) for ex in transformed_data['exercises'])
    print(f"   - Exercise Items: {total_items}")
    print(f"\n📄 Output saved to: {output_file}")
    
    # Show sample
    if transformed_data['exercises']:
        sample_ex = transformed_data['exercises'][0]
        print(f"\n📝 Sample Exercise:")
        print(f"   Code: {sample_ex['code']}")
        print(f"   Title: {sample_ex['title']}")
        print(f"   Items: {len(sample_ex['items'])}")
        print(f"   Instructions: {len(sample_ex['instructions'])}")


if __name__ == '__main__':
    main()
