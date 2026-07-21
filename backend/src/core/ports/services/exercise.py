from abc import abstractmethod
from typing import Protocol, runtime_checkable
from uuid import UUID

from src.core.entities.exercise import Exercise


@runtime_checkable
class IExerciseService(Protocol):

    @abstractmethod
    async def create_exercise(self, name: str) -> Exercise: ...

    @abstractmethod
    async def get_exercise_by_id(self, exercise_id: UUID) -> Exercise | None: ...

    @abstractmethod
    async def get_exercises(self) -> list[Exercise]: ...
