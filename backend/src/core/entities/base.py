from __future__ import annotations
from pydantic import BaseModel
from uuid import UUID


class Entity(BaseModel):
    id: UUID

    def __eq__(self, other: Entity) -> bool:
        return type(self) is type(other) and other.id == self.id

    def __hash__(self) -> int:
        return hash((type(self), self.id))
