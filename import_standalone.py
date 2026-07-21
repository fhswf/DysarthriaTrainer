#!/usr/bin/env python3
"""
Standalone import script for exercise data.
Must be run from outside the main app to avoid SQLAlchemy metadata conflicts.
"""
import json
import asyncio
import sys
import os
from uuid import UUID
from pathlib import Path

# Setup paths
sys.path.insert(0, "/app")
sys.path.insert(0, "/app/src")
os.chdir("/app")

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select

from src.configurations.settings import settings
from src.infrastructure.persistence.sqla.models.exercise_category_model import ExerciseCategoryModel
from src.infrastructure.persistence.sqla.models.exercise_model import ExerciseModel
from src.infrastructure.persistence.sqla.models.exercise_instructions_model import ExerciseInstructionsModel
from src.infrastructure.persistence.sqla.models.exercise_item_model import ExerciseItemModel
from src.infrastructure.persistence.sqla.models.exercise_item_content_model import ExerciseItemContentModel


async def import_exercises():
    """Import exercise data from JSON file into database."""
    
    # Load data
    json_path = Path("/tmp/exercises_transformed.json")
    print(f"📖 Loading data from {json_path}...")
    
    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    
    print(f"✓ Loaded {len(data['categories'])} categories, {len(data['exercises'])} exercises")
    
    # Setup database connection
    engine = create_async_engine(str(settings.database_url), echo=False)
    async_session_factory = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    
    async with async_session_factory() as session:
        try:
            # Check for existing data
            result = await session.execute(select(ExerciseCategoryModel))
            existing_categories = result.scalars().all()
            
            if existing_categories:
                print(f"⚠️  Found {len(existing_categories)} existing categories")
                response = input("Continue anyway? (y/N): ")
                if response.lower() != 'y':
                    print("❌ Import cancelled")
                    return
            
            # Import categories
            print("\n📁 Importing categories...")
            for cat_data in data['categories']:
                category = ExerciseCategoryModel(
                    id=UUID(cat_data['id']),
                    name=cat_data['name'],
                    slug=cat_data['slug'],
                    description=cat_data['description'],
                    icon_url=cat_data.get('icon_url'),
                    display_order=cat_data['display_order'],
                )
                session.add(category)
                print(f"  ✓ {category.name} (slug: {category.slug})")
            
            await session.flush()
            print(f"✓ Categories flushed to database")
            
            # Import exercises with nested data
            print("\n📝 Importing exercises...")
            total_items = 0
            total_instructions = 0
            
            for idx, ex_data in enumerate(data['exercises'], 1):
                # Create exercise
                exercise = ExerciseModel(
                    id=UUID(ex_data['id']),
                    category_id=UUID(ex_data['category_id']),
                    code=ex_data['code'],
                    title=ex_data['title'],
                    subtitle=ex_data.get('subtitle'),
                    scope=ex_data.get('scope'),
                    difficulty_level=ex_data['difficulty_level'],
                    estimated_duration_minutes=ex_data.get('estimated_duration_minutes'),
                    display_order=ex_data['display_order'],
                    version=ex_data['version'],
                    is_active=ex_data['is_active'],
                )
                session.add(exercise)
                
                # Create instructions
                for inst_data in ex_data['instructions']:
                    instruction = ExerciseInstructionsModel(
                        id=UUID(inst_data['id']),
                        exercise_id=UUID(inst_data['exercise_id']),
                        language=inst_data['language'],
                        hint_text=inst_data.get('hint_text'),
                        explanation_text=inst_data.get('explanation_text'),
                        safety_notes=inst_data.get('safety_notes'),
                    )
                    session.add(instruction)
                    total_instructions += 1
                
                # Create items with contents
                for item_data in ex_data['items']:
                    item = ExerciseItemModel(
                        id=UUID(item_data['id']),
                        exercise_id=UUID(item_data['exercise_id']),
                        item_type=item_data['item_type'],
                        display_order=item_data['display_order'],
                        repetitions=item_data.get('repetitions'),
                        duration_seconds=item_data.get('duration_seconds'),
                    )
                    session.add(item)
                    total_items += 1
                    
                    # Create contents for item
                    for content_data in item_data['contents']:
                        content = ExerciseItemContentModel(
                            id=UUID(content_data['id']),
                            item_id=UUID(content_data['item_id']),
                            language=content_data['language'],
                            text_content=content_data['text_content'],
                        )
                        session.add(content)
                
                # Batch flush every 10 exercises
                if idx % 10 == 0:
                    await session.flush()
                    print(f"  ✓ {idx} exercises processed...")
            
            # Final commit
            await session.commit()
            
            print(f"\n✅ Import complete!")
            print(f"   • Categories: {len(data['categories'])}")
            print(f"   • Exercises: {len(data['exercises'])}")
            print(f"   • Instructions: {total_instructions}")
            print(f"   • Items: {total_items}")
            
        except Exception as e:
            print(f"\n❌ Error during import: {e}")
            import traceback
            traceback.print_exc()
            await session.rollback()
            raise
        
        finally:
            await session.close()
            await engine.dispose()


if __name__ == "__main__":
    print("🚀 Starting exercise data import...")
    print("=" * 60)
    asyncio.run(import_exercises())
    print("=" * 60)
    print("✓ Done!")
