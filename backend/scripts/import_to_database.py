"""
Import transformed exercise data into the database.

Usage:
    docker compose exec backend python /app/scripts/import_to_database.py
"""

import json
import sys
import asyncio
from pathlib import Path
from uuid import UUID

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select

from src.configurations.settings import get_settings
from src.infrastructure.persistence.sqla.models.exercise_category_model import ExerciseCategoryModel
from src.infrastructure.persistence.sqla.models.exercise_model import ExerciseModel
from src.infrastructure.persistence.sqla.models.exercise_instructions_model import ExerciseInstructionsModel
from src.infrastructure.persistence.sqla.models.exercise_item_model import ExerciseItemModel
from src.infrastructure.persistence.sqla.models.exercise_item_content_model import ExerciseItemContentModel


async def import_exercises(json_file_path: str, clear_existing: bool = False):
    """
    Import exercises from transformed JSON file into database.
    
    Args:
        json_file_path: Path to the transformed JSON file
        clear_existing: If True, clear existing data before import (DANGEROUS!)
    """
    
    # Load data
    print("📖 Loading transformed data...")
    with open(json_file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    print(f"✓ Loaded {len(data['categories'])} categories, {len(data['exercises'])} exercises")
    
    # Setup database connection
    settings = get_settings()
    engine = create_async_engine(settings.database_url, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        try:
            # Optional: Clear existing data
            if clear_existing:
                print("\n⚠️  CLEARING EXISTING DATA...")
                confirm = input("This will delete ALL exercises, categories, items, and instructions. Type 'YES' to confirm: ")
                if confirm == 'YES':
                    await session.execute("DELETE FROM exercise_item_contents")
                    await session.execute("DELETE FROM exercise_items")
                    await session.execute("DELETE FROM exercise_instructions")
                    await session.execute("DELETE FROM exercises")
                    await session.execute("DELETE FROM exercise_categories")
                    await session.commit()
                    print("✓ Existing data cleared")
                else:
                    print("❌ Import cancelled")
                    return
            
            # Check for existing categories
            result = await session.execute(select(ExerciseCategoryModel))
            existing_categories = result.scalars().all()
            if existing_categories:
                print(f"\n⚠️  Found {len(existing_categories)} existing categories in database")
                print("Existing categories:")
                for cat in existing_categories:
                    print(f"  - {cat.name} ({cat.slug})")
                
                proceed = input("\nProceed with import? This may create duplicates. (yes/no): ")
                if proceed.lower() != 'yes':
                    print("❌ Import cancelled")
                    return
            
            # Import categories
            print("\n📁 Importing categories...")
            category_map = {}
            for cat_data in data['categories']:
                category = ExerciseCategoryModel(
                    id=UUID(cat_data['id']),
                    name=cat_data['name'],
                    slug=cat_data['slug'],
                    description=cat_data['description'],
                    icon_url=cat_data['icon_url'],
                    display_order=cat_data['display_order'],
                )
                session.add(category)
                category_map[cat_data['id']] = category
                print(f"  ✓ {category.name} ({category.slug})")
            
            await session.flush()
            print(f"✓ Imported {len(category_map)} categories")
            
            # Import exercises with their related data
            print("\n📝 Importing exercises...")
            imported_exercises = 0
            imported_instructions = 0
            imported_items = 0
            imported_contents = 0
            
            for ex_data in data['exercises']:
                # Create exercise
                exercise = ExerciseModel(
                    id=UUID(ex_data['id']),
                    category_id=UUID(ex_data['category_id']),
                    code=ex_data['code'],
                    title=ex_data['title'],
                    subtitle=ex_data['subtitle'],
                    scope=ex_data['scope'],
                    difficulty_level=ex_data['difficulty_level'],
                    estimated_duration_minutes=ex_data['estimated_duration_minutes'],
                    display_order=ex_data['display_order'],
                    version=ex_data['version'],
                    is_active=ex_data['is_active'],
                )
                session.add(exercise)
                imported_exercises += 1
                
                # Import instructions for this exercise
                for inst_data in ex_data['instructions']:
                    instruction = ExerciseInstructionsModel(
                        id=UUID(inst_data['id']),
                        exercise_id=UUID(inst_data['exercise_id']),
                        language=inst_data['language'],
                        hint_text=inst_data['hint_text'],
                        explanation_text=inst_data['explanation_text'],
                        safety_notes=inst_data['safety_notes'],
                        audio_instruction_url=inst_data['audio_instruction_url'],
                        image_url=inst_data['image_url'],
                    )
                    session.add(instruction)
                    imported_instructions += 1
                
                # Import items for this exercise
                for item_data in ex_data['items']:
                    item = ExerciseItemModel(
                        id=UUID(item_data['id']),
                        exercise_id=UUID(item_data['exercise_id']),
                        item_type=item_data['item_type'],
                        display_order=item_data['display_order'],
                        repetitions=item_data['repetitions'],
                        duration_seconds=item_data['duration_seconds'],
                        item_metadata=item_data['item_metadata'],
                    )
                    session.add(item)
                    imported_items += 1
                    
                    # Import contents for this item
                    for content_data in item_data['contents']:
                        content = ExerciseItemContentModel(
                            id=UUID(content_data['id']),
                            item_id=UUID(content_data['item_id']),
                            language=content_data['language'],
                            text_content=content_data['text_content'],
                            demonstration_video_url=content_data['demonstration_video_url'],
                            image_url=content_data['image_url'],
                            phonetic_transcription=content_data['phonetic_transcription'],
                            audio_example_url=content_data['audio_example_url'],
                            difficulty=content_data['difficulty'],
                            info_type=content_data['info_type'],
                        )
                        session.add(content)
                        imported_contents += 1
                
                # Commit every 10 exercises to avoid huge transactions
                if imported_exercises % 10 == 0:
                    await session.flush()
                    print(f"  ✓ Imported {imported_exercises} exercises...")
            
            # Final commit
            await session.commit()
            
            print("\n" + "=" * 80)
            print("✅ IMPORT COMPLETE!")
            print("=" * 80)
            print(f"Categories:           {len(category_map)}")
            print(f"Exercises:            {imported_exercises}")
            print(f"Instructions:         {imported_instructions}")
            print(f"Exercise Items:       {imported_items}")
            print(f"Item Contents:        {imported_contents}")
            print("=" * 80)
            
        except Exception as e:
            print(f"\n❌ Error during import: {e}")
            await session.rollback()
            raise
        finally:
            await session.close()
            await engine.dispose()


async def main():
    """Main import function."""
    
    # Path to transformed JSON
    json_file = Path(__file__).parent.parent.parent / 'data' / 'exercises_transformed.json'
    
    if not json_file.exists():
        print(f"❌ Error: Transformed JSON file not found at {json_file}")
        print("Please run import_exercises.py first to generate the transformed data.")
        return
    
    print("=" * 80)
    print("EXERCISE DATABASE IMPORT")
    print("=" * 80)
    print(f"Source: {json_file}")
    print()
    
    # Ask if user wants to clear existing data
    clear = input("Clear existing exercise data before import? (yes/no): ")
    clear_existing = clear.lower() == 'yes'
    
    print("\nStarting import...")
    await import_exercises(str(json_file), clear_existing=clear_existing)


if __name__ == '__main__':
    asyncio.run(main())
