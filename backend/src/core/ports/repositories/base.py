from abc import abstractmethod,ABC
from typing import TypeVar
from typing import Protocol, runtime_checkable
from uuid import UUID

T = TypeVar('T')


class IRepository[T](ABC):
    """Base interface for all repositories with async operations."""

    @abstractmethod
    async def get_by_id(self, _id: UUID) -> T | None:
        """Retrieve an entity by its ID.
        
        Args:
            _id: UUID of the entity to retrieve
            
        Returns:
            Entity if found, None otherwise
        """
        ...

    @abstractmethod
    async def get_all(self) -> list[T]:
        """Retrieve all entities.
        
        Returns:
            List of all entities
        """
        ...

    @abstractmethod
    async def add(self, entity: T) -> T:
        """Add a new entity.
        
        Args:
            entity: Entity to add
            
        Returns:
            The added entity
        """
        ...

    @abstractmethod
    async def update(self, entity: T) -> T:
        """Update an existing entity.
        
        Args:
            entity: Entity to update
            
        Returns:
            The updated entity
        """
        ...

    @abstractmethod
    async def delete(self, _id: UUID) -> bool:
        """Delete an entity by ID.
        
        Args:
            _id: UUID of the entity to delete
            
        Returns:
            True if deleted, False if not found
        """
        ...

    @abstractmethod
    async def exists(self, _id: UUID) -> bool:
        """Check if an entity exists.
        
        Args:
            _id: UUID of the entity to check
            
        Returns:
            True if exists, False otherwise
        """
        ...
