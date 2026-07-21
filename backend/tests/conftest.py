"""
Root conftest.py for pytest test suite.

Provides core fixtures for test database setup, isolation, and cleanup.
Implements shared container strategy with multiple test databases.

Related:
- Issue #93: Test Database Infrastructure
- Documentation: backend/.github/docs/test-database-strategy.md
"""

import os
import pytest
import pytest_asyncio
from typing import AsyncGenerator
from sqlalchemy import create_engine, text
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.pool import NullPool
from alembic import command
from alembic.config import Config

from src.infrastructure.persistence.sqla.database import Database

# Import test fixtures
pytest_plugins = [
    "tests.fixtures.audio",
    "tests.fixtures.auth",
    "tests.fixtures.users",
    "tests.fixtures.roles",
    "tests.fixtures.exercises",
]

# ============================================================================
# Database Configuration and Safety Checks
# ============================================================================

# Get database credentials from environment (from .env file)
POSTGRES_HOST = os.getenv("POSTGRES_HOST", "postgres_timescale_pg_vector")
POSTGRES_PORT = os.getenv("POSTGRES_PORT", "5432")
POSTGRES_USER = os.getenv("POSTGRES_USER", "postgres")
POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD")
DEV_DB = os.getenv("POSTGRES_DB", "demodb")

# Test database naming
TEST_DB_MAIN = "test_db_main"
TEST_DB_PREFIX = "test_db_"

# CRITICAL: Safety checks to prevent accidental use of development database
assert TEST_DB_MAIN != DEV_DB, (
    f"❌ CRITICAL: Test database '{TEST_DB_MAIN}' must differ from dev database '{DEV_DB}'!"
)
assert TEST_DB_MAIN.startswith(TEST_DB_PREFIX), (
    f"❌ CRITICAL: Test database must start with '{TEST_DB_PREFIX}' prefix!"
)

print(f"\n{'='*70}")
print(f"🔒 Test Database Safety Checks PASSED")
print(f"   Development DB: {DEV_DB} (will NOT be touched)")
print(f"   Test DB: {TEST_DB_MAIN} (will be created/used)")
print(f"{'='*70}\n")


def get_admin_database_url() -> str:
    """
    Get admin database URL for database creation/deletion.
    
    Connects to 'postgres' database (not dev database) to perform
    administrative operations like CREATE DATABASE and DROP DATABASE.
    """
    return (
        f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@"
        f"{POSTGRES_HOST}:{POSTGRES_PORT}/postgres"
    )


def get_test_database_url(db_name: str = TEST_DB_MAIN) -> str:
    """
    Get async database URL for tests with safety checks.
    
    Args:
        db_name: Name of test database (must start with 'test_db_')
    
    Returns:
        Async PostgreSQL connection string
        
    Raises:
        ValueError: If database name doesn't meet safety requirements
    """
    # Safety validation
    if not db_name.startswith(TEST_DB_PREFIX):
        raise ValueError(
            f"❌ Test database must start with '{TEST_DB_PREFIX}', got: {db_name}"
        )
    if db_name == DEV_DB:
        raise ValueError(
            f"❌ Cannot use dev database '{DEV_DB}' for tests!"
        )
    
    return (
        f"postgresql+asyncpg://{POSTGRES_USER}:{POSTGRES_PASSWORD}@"
        f"{POSTGRES_HOST}:{POSTGRES_PORT}/{db_name}"
    )


# ============================================================================
# Session-Scoped Fixtures (Setup Once Per Test Session)
# ============================================================================

@pytest.fixture(scope="session")
def event_loop():
    """
    Create event loop for async tests.
    
    Session-scoped to allow async session-scoped fixtures.
    """
    import asyncio
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="session", autouse=True)
def create_test_database():
    """
    Create test database in existing PostgreSQL container.
    
    This fixture runs once at the start of the test session and:
    1. Drops existing test database (if any) for fresh start
    2. Creates fresh test database
    3. Applies all Alembic migrations
    
    The database is left intact after tests for debugging purposes.
    To manually drop: 
        docker compose exec postgres_timescale_pg_vector dropdb -U postgres test_db_main
    
    Safety:
    - Never touches development database (demodb)
    - Validates test database naming convention
    - Provides clear logging of operations
    """
    print(f"\n{'='*70}")
    print(f"🚀 Setting up test database: {TEST_DB_MAIN}")
    print(f"   Development database: {DEV_DB} (protected, will NOT be touched)")
    print(f"{'='*70}\n")
    
    # Connect to postgres database (not dev database) with sync engine for admin ops
    admin_url = get_admin_database_url()
    engine = create_engine(admin_url, isolation_level="AUTOCOMMIT")
    
    try:
        with engine.connect() as conn:
            # Drop if exists (for fresh start)
            print(f"🗑️  Dropping existing database '{TEST_DB_MAIN}' if exists...")
            conn.execute(text(f"DROP DATABASE IF EXISTS {TEST_DB_MAIN}"))
            
            # Create test database
            print(f"📦 Creating database '{TEST_DB_MAIN}'...")
            conn.execute(text(f"CREATE DATABASE {TEST_DB_MAIN}"))
            print(f"✅ Database '{TEST_DB_MAIN}' created successfully!\n")
    finally:
        engine.dispose()
    
    # Apply migrations to test database
    print(f"🔄 Applying migrations to '{TEST_DB_MAIN}'...")
    test_db_url = get_test_database_url()
    
    # Set DATABASE_URL environment variable for Alembic
    # (alembic env.py reads from environment)
    original_db_url = os.environ.get("DATABASE_URL")
    os.environ["DATABASE_URL"] = test_db_url
    
    alembic_cfg = Config("alembic.ini")
    
    try:
        command.upgrade(alembic_cfg, "head")
        print(f"✅ Migrations applied successfully!\n")
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        raise
    finally:
        # Restore original DATABASE_URL
        if original_db_url:
            os.environ["DATABASE_URL"] = original_db_url
        else:
            os.environ.pop("DATABASE_URL", None)
    
    print(f"{'='*70}")
    print(f"✅ Test database '{TEST_DB_MAIN}' is ready for testing!")
    print(f"{'='*70}\n")
    
    yield
    
    # Optional: Keep database for debugging (comment out to auto-drop)
    print(f"\n{'='*70}")
    print(f"ℹ️  Test database '{TEST_DB_MAIN}' preserved for debugging.")
    print(f"   To inspect: docker compose exec postgres_timescale_pg_vector psql -U postgres -d {TEST_DB_MAIN}")
    print(f"   To drop manually: docker compose exec postgres_timescale_pg_vector dropdb -U postgres {TEST_DB_MAIN}")
    print(f"{'='*70}\n")


@pytest_asyncio.fixture(scope="session")
async def test_engine(create_test_database):
    """
    Create async SQLAlchemy engine (session-scoped).
    
    Creates async SQLAlchemy engine connected to test database.
    Configured for optimal test performance with connection pooling.
    
    Args:
        create_test_database: Ensures database is created before engine
    
    Yields:
        AsyncEngine: SQLAlchemy async engine for test database
    """
    engine = create_async_engine(
        get_test_database_url(),
        echo=False,  # Set to True for SQL query debugging
        pool_pre_ping=False,  # Disable for tests to avoid event loop issues
        poolclass=NullPool,  # Use NullPool for tests to avoid connection reuse
    )
    
    yield engine
    
    # Cleanup
    await engine.dispose()


@pytest_asyncio.fixture(scope="session")
async def test_session_factory(test_engine):
    """
    Create session factory (session-scoped).
    
    Factory for creating database sessions throughout tests.
    Configured for test isolation with no auto-flush or auto-commit.
    
    Args:
        test_engine: SQLAlchemy async engine
    
    Returns:
        async_sessionmaker: Factory for creating async sessions
    """
    return async_sessionmaker(
        test_engine,
        class_=AsyncSession,
        expire_on_commit=False,  # Don't expire objects after commit (useful for testing)
        autoflush=False,  # Manual flushing for better control
    )


# ============================================================================
# Function-Scoped Fixtures (Fresh Isolation Per Test)
# ============================================================================

@pytest_asyncio.fixture
async def db_session(test_engine, test_session_factory) -> AsyncGenerator[AsyncSession, None]:
    """
    Provide database session with automatic rollback for test isolation.
    
    Each test gets a fresh transaction that is automatically rolled back
    after the test completes. This ensures complete test isolation.
    
    Important: Repositories should use flush() not commit(). The transaction
    will be rolled back automatically after the test, discarding all changes.
    
    Pattern:
    1. Create connection from engine
    2. Begin transaction
    3. Create session bound to connection
    4. Yield session for test
    5. Rollback transaction (discards all changes)
    
    This ensures:
    - All database changes are visible within the test
    - Changes from flush() are visible but not committed
    - Everything rolls back after test completion
    - Each test starts with clean state
    
    Usage:
        async def test_create_user(db_session):
            user_repo = UserRepository(db_session)
            user = User(email="test@example.com")
            created_user = await user_repo.create(user)  # calls flush()
            # Data visible in test but rolled back after
    
    Args:
        test_engine: SQLAlchemy async engine
        test_session_factory: Session factory from session-scoped fixture
    
    Yields:
        AsyncSession: Database session with transaction
    """
    # Create connection and start transaction
    async with test_engine.connect() as connection:
        # Begin transaction (will be rolled back automatically)
        async with connection.begin() as transaction:
            # Create session bound to this connection
            session = test_session_factory(bind=connection)
            
            try:
                yield session
            finally:
                # Clean up session
                await session.close()
                # Explicitly rollback the transaction
                await transaction.rollback()
                # Note: rollback also happens automatically when context exits


@pytest_asyncio.fixture
async def db(test_engine) -> Database:
    """
    Provide Database instance for tests.
    
    Creates Database wrapper with test engine. Useful for tests that
    need the Database class interface rather than direct sessions.
    
    Args:
        test_engine: SQLAlchemy async engine
    
    Returns:
        Database: Database instance configured for testing
    """
    return Database(
        db_url=get_test_database_url(),
        logger=None  # No logger for cleaner test output
    )


# ============================================================================
# Test Utilities
# ============================================================================

@pytest.fixture
def db_url():
    """Provide test database URL for configuration."""
    return get_test_database_url()


@pytest.fixture
def dev_db_name():
    """Provide development database name (for safety checks in tests)."""
    return DEV_DB


@pytest.fixture
def test_db_name():
    """Provide test database name."""
    return TEST_DB_MAIN
