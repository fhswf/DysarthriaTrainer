import uuid
from uuid import UUID
from src.core.ports.utils.entity_id_generator import IEntityIdGenerator


class UUIDEntityIdGenerator(IEntityIdGenerator):
    def __call__(self) -> UUID:
        return uuid.uuid4()
