"""add_instruction_id_to_exercise_items

Revision ID: d27cb28e357b
Revises: a4449e20b7b6
Create Date: 2025-12-17 15:23:49.243715

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd27cb28e357b'
down_revision: Union[str, Sequence[str], None] = 'a4449e20b7b6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add instruction_id column to exercise_items
    op.add_column(
        'exercise_items',
        sa.Column('instruction_id', sa.UUID(), nullable=True)
    )
    
    # Add foreign key constraint
    op.create_foreign_key(
        'fk_exercise_items_instruction_id',
        'exercise_items',
        'exercise_instructions',
        ['instruction_id'],
        ['id'],
        ondelete='SET NULL'
    )
    
    # Add index for better query performance
    op.create_index(
        'ix_exercise_items_instruction_id',
        'exercise_items',
        ['instruction_id'],
        unique=False
    )


def downgrade() -> None:
    """Downgrade schema."""
    # Drop index
    op.drop_index('ix_exercise_items_instruction_id', table_name='exercise_items')
    
    # Drop foreign key
    op.drop_constraint(
        'fk_exercise_items_instruction_id',
        'exercise_items',
        type_='foreignkey'
    )
    
    # Drop column
    op.drop_column('exercise_items', 'instruction_id')
