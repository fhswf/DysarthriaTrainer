#!/usr/bin/env python3
"""
Seed script for creating test users.

This script creates test users with different roles for manual testing.
Run this after running seed_rbac.py to ensure roles exist.

Usage:
    docker compose exec backend python scripts/seed_test_users.py
"""
import asyncio
import sys
from pathlib import Path
from uuid import uuid4

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select
from datetime import datetime, timezone

from src.configurations.settings import settings
from src.infrastructure.persistence.sqla.models import User, Role, user_roles
from src.infrastructure.security.password_hasher import BcryptPasswordHasher


# Test users to create
TEST_USERS = [
    {
        "username": "admin",
        "email": "admin@example.com",
        "password": "Admin123!",
        "full_name": "Admin User",
        "email_verified": True,
        "role": "admin",
    },
    {
        "username": "therapist",
        "email": "therapist@example.com",
        "password": "Therapist123!",
        "full_name": "Therapist User",
        "email_verified": True,
        "role": "therapist",
    },
    {
        "username": "user",
        "email": "user@example.com",
        "password": "User123!",
        "full_name": "Regular User",
        "email_verified": True,
        "role": "user",
    },
]


async def seed_test_users():
    """Seed test users into the database."""
    # Create password hasher
    password_hasher = BcryptPasswordHasher()
    
    # Create async engine
    engine = create_async_engine(str(settings.database_url), echo=True)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        try:
            print("\n" + "="*60)
            print("Starting Test Users Seed Script")
            print("="*60 + "\n")
            
            # Get all roles
            result = await session.execute(select(Role))
            roles = {role.name: role for role in result.scalars().all()}
            
            if not roles:
                print("❌ No roles found! Please run seed_rbac.py first.")
                return
            
            print(f"✓ Found {len(roles)} roles: {', '.join(roles.keys())}\n")
            
            # Create test users
            created_count = 0
            skipped_count = 0
            
            for user_data in TEST_USERS:
                print(f"Processing user: {user_data['email']}")
                
                # Check if user already exists
                result = await session.execute(
                    select(User).where(User.email == user_data["email"])
                )
                existing_user = result.scalar_one_or_none()
                
                if existing_user:
                    print(f"  ⚠️  User already exists (ID: {existing_user.id})")
                    skipped_count += 1
                    continue
                
                # Create new user
                user = User(
                    id=uuid4(),
                    username=user_data["username"],
                    email=user_data["email"],
                    full_name=user_data["full_name"],
                    hashed_password=password_hasher.hash_password(user_data["password"]),
                    email_verified=user_data["email_verified"],
                    disabled=False,
                    created_at=datetime.now(timezone.utc),
                )
                session.add(user)
                await session.flush()
                
                # Assign role
                role_name = user_data["role"]
                if role_name in roles:
                    await session.execute(
                        user_roles.insert().values(
                            user_id=user.id,
                            role_id=roles[role_name].id,
                            assigned_at=datetime.now(timezone.utc),
                        )
                    )
                    print(f"  ✓ Created user with role '{role_name}' (ID: {user.id})")
                    created_count += 1
                else:
                    print(f"  ⚠️  Role '{role_name}' not found, user created without role")
                
                print()
            
            # Commit all changes
            await session.commit()
            
            print("="*60)
            print("✅ Test Users Seed Complete!")
            print("="*60)
            print(f"\nSummary:")
            print(f"  - Created: {created_count} users")
            print(f"  - Skipped: {skipped_count} users (already exist)")
            print(f"\nTest Credentials:")
            print("-" * 60)
            for user_data in TEST_USERS:
                print(f"  {user_data['role'].upper()}: {user_data['email']} / {user_data['password']}")
            print("-" * 60)
            print()
            
        except Exception as e:
            await session.rollback()
            print(f"\n❌ Error seeding test users: {e}")
            import traceback
            traceback.print_exc()
            raise
        finally:
            await engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed_test_users())
