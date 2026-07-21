"""
Seed script for exercise system data.

Populates the database with sample categories, exercises, and items
for development and testing purposes.

Usage:
    docker compose exec backend python backend/scripts/seed_exercises.py
    
Related:
    - Issue #94: Speech Exercise System Implementation
"""

import asyncio
import sys
from pathlib import Path

# Add backend src to path
backend_path = Path(__file__).parent.parent / "src"
sys.path.insert(0, str(backend_path))

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy import select
import os

from src.infrastructure.persistence.sqla.models.exercise import (
    ExerciseCategoryModel,
    ExerciseModel,
    ExerciseItemModel,
    ExerciseItemContentModel,
    ExerciseInstructionModel,
)


# Database configuration
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://postgres:postgres@postgres_timescale_pg_vector:5432/demodb"
)


async def clear_existing_data(session: AsyncSession):
    """Clear existing exercise data (for clean re-seeding)."""
    print("🗑️  Clearing existing exercise data...")
    
    # Delete in order of dependencies (child → parent)
    await session.execute("DELETE FROM exercise_item_contents")
    await session.execute("DELETE FROM exercise_instructions")
    await session.execute("DELETE FROM exercise_items")
    await session.execute("DELETE FROM exercises")
    await session.execute("DELETE FROM exercise_categories")
    
    await session.commit()
    print("✅ Existing data cleared")


async def seed_categories(session: AsyncSession) -> dict:
    """Seed exercise categories."""
    print("\n📦 Seeding categories...")
    
    categories_data = [
        {
            "name": "Lippen-Übungen",
            "slug": "lippen-uebungen",
            "description": "Übungen zur Stärkung und Beweglichkeit der Lippen",
            "display_order": 1,
        },
        {
            "name": "Zungen-Übungen",
            "slug": "zungen-uebungen",
            "description": "Übungen zur Verbesserung der Zungenbeweglichkeit",
            "display_order": 2,
        },
        {
            "name": "Kiefer-Übungen",
            "slug": "kiefer-uebungen",
            "description": "Übungen zur Kiefermobilität und -kontrolle",
            "display_order": 3,
        },
        {
            "name": "Artikulation",
            "slug": "artikulation",
            "description": "Übungen zur Verbesserung der Artikulation und Aussprache",
            "display_order": 4,
        },
        {
            "name": "Atmung und Stimme",
            "slug": "atmung-stimme",
            "description": "Übungen zur Atemkontrolle und Stimmbildung",
            "display_order": 5,
        },
    ]
    
    categories = {}
    for cat_data in categories_data:
        category = ExerciseCategoryModel(**cat_data)
        session.add(category)
        categories[cat_data["slug"]] = category
    
    await session.flush()
    print(f"✅ Created {len(categories)} categories")
    
    return categories


async def seed_exercises(session: AsyncSession, categories: dict) -> dict:
    """Seed exercises."""
    print("\n📝 Seeding exercises...")
    
    exercises_data = [
        # Lip exercises
        {
            "category": "lippen-uebungen",
            "code": "LIP-001",
            "title": "Lippen zusammenpressen",
            "subtitle": "Grundübung für Lippenkraft",
            "scope": "Stärkung der Lippenmuskulatur durch wiederholtes Zusammenpressen",
            "difficulty_level": "beginner",
            "estimated_duration_minutes": 5,
            "display_order": 1,
        },
        {
            "category": "lippen-uebungen",
            "code": "LIP-002",
            "title": "Lippenvibration",
            "subtitle": "Brummübung für lockere Lippen",
            "scope": "Lockerung und Aktivierung der Lippenmuskulatur",
            "difficulty_level": "beginner",
            "estimated_duration_minutes": 3,
            "display_order": 2,
        },
        {
            "category": "lippen-uebungen",
            "code": "LIP-003",
            "title": "Lippenkreisen",
            "subtitle": "Mobilisationsübung",
            "scope": "Verbesserung der Lippenbeweglichkeit in alle Richtungen",
            "difficulty_level": "intermediate",
            "estimated_duration_minutes": 5,
            "display_order": 3,
        },
        
        # Tongue exercises
        {
            "category": "zungen-uebungen",
            "code": "TNG-001",
            "title": "Zungenspitze zum Gaumen",
            "subtitle": "Grundposition für Zungenübungen",
            "scope": "Kräftigung der Zungenmuskulatur und Verbesserung der Zungenposition",
            "difficulty_level": "beginner",
            "estimated_duration_minutes": 5,
            "display_order": 1,
        },
        {
            "category": "zungen-uebungen",
            "code": "TNG-002",
            "title": "Zunge strecken",
            "subtitle": "Mobilisation der Zunge",
            "scope": "Verbesserung der Zungenbeweglichkeit nach vorne",
            "difficulty_level": "beginner",
            "estimated_duration_minutes": 3,
            "display_order": 2,
        },
        {
            "category": "zungen-uebungen",
            "code": "TNG-003",
            "title": "Zungenrollen",
            "subtitle": "R-Laut Übung",
            "scope": "Training des gerollten R-Lauts",
            "difficulty_level": "advanced",
            "estimated_duration_minutes": 8,
            "display_order": 3,
        },
        
        # Jaw exercises
        {
            "category": "kiefer-uebungen",
            "code": "JAW-001",
            "title": "Kiefer öffnen und schließen",
            "subtitle": "Basismobilisation",
            "scope": "Verbesserung der Kieferbeweglichkeit",
            "difficulty_level": "beginner",
            "estimated_duration_minutes": 5,
            "display_order": 1,
        },
        {
            "category": "kiefer-uebungen",
            "code": "JAW-002",
            "title": "Seitliche Kieferbewegungen",
            "subtitle": "Erweiterte Mobilisation",
            "scope": "Training der seitlichen Kieferbeweglichkeit",
            "difficulty_level": "intermediate",
            "estimated_duration_minutes": 5,
            "display_order": 2,
        },
        
        # Articulation exercises
        {
            "category": "artikulation",
            "code": "ART-001",
            "title": "Vokale dehnen",
            "subtitle": "A-E-I-O-U Training",
            "scope": "Deutliche Aussprache der Grundvokale",
            "difficulty_level": "beginner",
            "estimated_duration_minutes": 5,
            "display_order": 1,
        },
        {
            "category": "artikulation",
            "code": "ART-002",
            "title": "Konsonanten-Präzision",
            "subtitle": "Harte und weiche Konsonanten",
            "scope": "Verbesserung der Konsonantenartikulation",
            "difficulty_level": "intermediate",
            "estimated_duration_minutes": 10,
            "display_order": 2,
        },
        {
            "category": "artikulation",
            "code": "ART-003",
            "title": "Zungenbrecher",
            "subtitle": "Komplexe Lautfolgen",
            "scope": "Training schneller und präziser Artikulation",
            "difficulty_level": "advanced",
            "estimated_duration_minutes": 10,
            "display_order": 3,
        },
        
        # Breathing and voice exercises
        {
            "category": "atmung-stimme",
            "code": "BRV-001",
            "title": "Bauchatmung",
            "subtitle": "Grundlage für gesunde Stimme",
            "scope": "Erlernen der tiefen Bauchatmung",
            "difficulty_level": "beginner",
            "estimated_duration_minutes": 8,
            "display_order": 1,
        },
        {
            "category": "atmung-stimme",
            "code": "BRV-002",
            "title": "Stimmumfang erweitern",
            "subtitle": "Tonleiter-Übungen",
            "scope": "Erweiterung des Stimmumfangs durch Tonleitern",
            "difficulty_level": "intermediate",
            "estimated_duration_minutes": 10,
            "display_order": 2,
        },
    ]
    
    exercises = {}
    for ex_data in exercises_data:
        category_slug = ex_data.pop("category")
        exercise = ExerciseModel(
            category_id=categories[category_slug].id,
            version=1,
            is_active=True,
            created_by="seed_script",
            **ex_data
        )
        session.add(exercise)
        exercises[ex_data["code"]] = exercise
    
    await session.flush()
    print(f"✅ Created {len(exercises)} exercises")
    
    return exercises


async def seed_exercise_items(session: AsyncSession, exercises: dict):
    """Seed exercise items."""
    print("\n🔢 Seeding exercise items...")
    
    items_data = [
        # LIP-001 items
        {
            "exercise_code": "LIP-001",
            "item_type": "information",
            "display_order": 1,
            "metadata": {
                "text": "Diese Übung stärkt Ihre Lippenmuskulatur und verbessert die Lippenkontrolle."
            },
            "content_de": {
                "text_content": "Diese Übung stärkt Ihre Lippenmuskulatur.",
                "info_type": "introduction",
            },
        },
        {
            "exercise_code": "LIP-001",
            "item_type": "movement",
            "display_order": 2,
            "repetitions": 10,
            "duration_seconds": 5,
            "metadata": {
                "text": "Pressen Sie Ihre Lippen fest zusammen und halten Sie die Spannung."
            },
            "content_de": {
                "text_content": "Pressen Sie Ihre Lippen fest zusammen und halten Sie 5 Sekunden.",
            },
        },
        {
            "exercise_code": "LIP-001",
            "item_type": "speech_practice",
            "display_order": 3,
            "repetitions": 5,
            "metadata": {
                "text": "Sprechen Sie 'Mmmm' mit geschlossenen Lippen."
            },
            "content_de": {
                "text_content": "Sprechen Sie 'Mmmm' mit geschlossenen Lippen.",
                "phonetic_transcription": "/mː/",
            },
        },
        
        # TNG-001 items
        {
            "exercise_code": "TNG-001",
            "item_type": "information",
            "display_order": 1,
            "metadata": {
                "text": "Die Zungenspitze am Gaumen ist eine wichtige Ausgangsposition."
            },
            "content_de": {
                "text_content": "Die Zungenspitze am Gaumen ist eine wichtige Grundposition.",
                "info_type": "introduction",
            },
        },
        {
            "exercise_code": "TNG-001",
            "item_type": "movement",
            "display_order": 2,
            "repetitions": 15,
            "duration_seconds": 3,
            "metadata": {
                "text": "Berühren Sie mit der Zungenspitze den Gaumen hinter den Zähnen."
            },
            "content_de": {
                "text_content": "Berühren Sie mit der Zungenspitze den Gaumen hinter den Schneidezähnen.",
            },
        },
        
        # ART-001 items (Vowels)
        {
            "exercise_code": "ART-001",
            "item_type": "speech_practice",
            "display_order": 1,
            "repetitions": 5,
            "metadata": {
                "text": "Sprechen Sie laut und deutlich: Aaaaaaa"
            },
            "content_de": {
                "text_content": "Sprechen Sie laut und deutlich: Aaaaaaa",
                "phonetic_transcription": "/aː/",
            },
        },
        {
            "exercise_code": "ART-001",
            "item_type": "speech_practice",
            "display_order": 2,
            "repetitions": 5,
            "metadata": {
                "text": "Sprechen Sie laut und deutlich: Eeeeeee"
            },
            "content_de": {
                "text_content": "Sprechen Sie laut und deutlich: Eeeeeee",
                "phonetic_transcription": "/eː/",
            },
        },
        {
            "exercise_code": "ART-001",
            "item_type": "speech_practice",
            "display_order": 3,
            "repetitions": 5,
            "metadata": {
                "text": "Sprechen Sie laut und deutlich: Iiiiiii"
            },
            "content_de": {
                "text_content": "Sprechen Sie laut und deutlich: Iiiiiii",
                "phonetic_transcription": "/iː/",
            },
        },
        
        # ART-003 items (Tongue twisters)
        {
            "exercise_code": "ART-003",
            "item_type": "speech_practice",
            "display_order": 1,
            "repetitions": 3,
            "metadata": {
                "text": "Fischers Fritze fischt frische Fische"
            },
            "content_de": {
                "text_content": "Fischers Fritze fischt frische Fische",
                "difficulty": "advanced",
            },
        },
        {
            "exercise_code": "ART-003",
            "item_type": "speech_practice",
            "display_order": 2,
            "repetitions": 3,
            "metadata": {
                "text": "Blaukraut bleibt Blaukraut und Brautkleid bleibt Brautkleid"
            },
            "content_de": {
                "text_content": "Blaukraut bleibt Blaukraut und Brautkleid bleibt Brautkleid",
                "difficulty": "advanced",
            },
        },
        
        # BRV-001 items (Breathing)
        {
            "exercise_code": "BRV-001",
            "item_type": "information",
            "display_order": 1,
            "metadata": {
                "text": "Die Bauchatmung ist die Grundlage für eine gesunde Stimme."
            },
            "content_de": {
                "text_content": "Die Bauchatmung ist die Basis für gesunde Stimmgebung.",
                "info_type": "introduction",
            },
        },
        {
            "exercise_code": "BRV-001",
            "item_type": "movement",
            "display_order": 2,
            "repetitions": 10,
            "duration_seconds": 8,
            "metadata": {
                "text": "Atmen Sie tief in den Bauch ein, halten Sie kurz und atmen Sie langsam aus."
            },
            "content_de": {
                "text_content": "Atmen Sie tief in den Bauch ein (4 Sek.), halten (2 Sek.), langsam ausatmen (6 Sek.)",
            },
        },
    ]
    
    items_count = 0
    for item_data in items_data:
        exercise_code = item_data.pop("exercise_code")
        content_de = item_data.pop("content_de", None)
        metadata = item_data.pop("metadata", {})
        
        # Create item
        item = ExerciseItemModel(
            exercise_id=exercises[exercise_code].id,
            item_metadata=metadata,
            **item_data
        )
        session.add(item)
        await session.flush()
        
        # Add German content if provided
        if content_de:
            content = ExerciseItemContentModel(
                item_id=item.id,
                language="de",
                **content_de
            )
            session.add(content)
        
        items_count += 1
    
    await session.flush()
    print(f"✅ Created {items_count} exercise items")


async def seed_instructions(session: AsyncSession, exercises: dict):
    """Seed exercise instructions."""
    print("\n📋 Seeding instructions...")
    
    instructions_data = [
        {
            "exercise_code": "LIP-001",
            "language": "de",
            "hint_text": "Achten Sie darauf, die Spannung in den Lippen zu spüren.",
            "explanation_text": "Diese Übung kräftigt die Ringmuskulatur der Lippen und verbessert die Lippenkontrolle.",
            "safety_notes": "Bei Schmerzen die Übung abbrechen.",
        },
        {
            "exercise_code": "TNG-001",
            "language": "de",
            "hint_text": "Die Zungenspitze sollte den harten Gaumen direkt hinter den Schneidezähnen berühren.",
            "explanation_text": "Die korrekte Zungenposition ist wichtig für viele Sprachlaute.",
            "safety_notes": None,
        },
        {
            "exercise_code": "ART-001",
            "language": "de",
            "hint_text": "Übertreiben Sie die Mundöffnung für jeden Vokal.",
            "explanation_text": "Deutliche Vokalartikulation ist die Grundlage für verständliche Sprache.",
            "safety_notes": None,
        },
        {
            "exercise_code": "ART-003",
            "language": "de",
            "hint_text": "Beginnen Sie langsam und steigern Sie allmählich das Tempo.",
            "explanation_text": "Zungenbrecher trainieren schnelle und präzise Artikulation.",
            "safety_notes": "Nicht zu schnell beginnen, um Frustration zu vermeiden.",
        },
        {
            "exercise_code": "BRV-001",
            "language": "de",
            "hint_text": "Legen Sie eine Hand auf den Bauch, um die Bewegung zu spüren.",
            "explanation_text": "Die Bauchatmung ermöglicht eine tiefere, entspanntere Atmung und bessere Stimmkontrolle.",
            "safety_notes": "Bei Schwindel die Übung pausieren.",
        },
    ]
    
    instructions_count = 0
    for instr_data in instructions_data:
        exercise_code = instr_data.pop("exercise_code")
        instruction = ExerciseInstructionModel(
            exercise_id=exercises[exercise_code].id,
            **instr_data
        )
        session.add(instruction)
        instructions_count += 1
    
    await session.flush()
    print(f"✅ Created {instructions_count} instructions")


async def verify_seeded_data(session: AsyncSession):
    """Verify seeded data."""
    print("\n🔍 Verifying seeded data...")
    
    # Count categories
    result = await session.execute(select(ExerciseCategoryModel))
    categories = result.scalars().all()
    print(f"  Categories: {len(categories)}")
    
    # Count exercises
    result = await session.execute(select(ExerciseModel))
    exercises = result.scalars().all()
    print(f"  Exercises: {len(exercises)}")
    
    # Count items
    result = await session.execute(select(ExerciseItemModel))
    items = result.scalars().all()
    print(f"  Items: {len(items)}")
    
    # Count instructions
    result = await session.execute(select(ExerciseInstructionModel))
    instructions = result.scalars().all()
    print(f"  Instructions: {len(instructions)}")
    
    print("\n✅ Data verification complete!")


async def main():
    """Main seeding function."""
    print("="*70)
    print("🌱 Exercise System Data Seeding")
    print("="*70)
    
    # Create async engine and session
    engine = create_async_engine(DATABASE_URL, echo=False)
    async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        try:
            # Clear existing data
            await clear_existing_data(session)
            
            # Seed data
            categories = await seed_categories(session)
            exercises = await seed_exercises(session, categories)
            await seed_exercise_items(session, exercises)
            await seed_instructions(session, exercises)
            
            # Commit all changes
            await session.commit()
            print("\n💾 All changes committed to database")
            
            # Verify
            await verify_seeded_data(session)
            
            print("\n" + "="*70)
            print("✅ Seeding completed successfully!")
            print("="*70)
            
        except Exception as e:
            print(f"\n❌ Error during seeding: {e}")
            await session.rollback()
            raise
        
        finally:
            await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
