"""add_display_order_to_instructions

Revision ID: 2608e24ab885
Revises: d27cb28e357b
Create Date: 2026-01-07 11:56:35.600242

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '2608e24ab885'
down_revision: Union[str, Sequence[str], None] = 'd27cb28e357b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add display_order column to exercise_instructions table.
    
    This enables sequential presentation of instructions and exercise items
    by allowing instructions to have a position in the overall exercise sequence.
    
    Default value of 0 maintains backward compatibility for existing data.
    """
    # Add display_order column with default value
    op.add_column(
        'exercise_instructions',
        sa.Column('display_order', sa.Integer(), nullable=False, server_default='0')
    )
    
    # Add index for efficient ordering queries
    op.create_index(
        op.f('ix_exercise_instructions_display_order'),
        'exercise_instructions',
        ['display_order'],
        unique=False
    )


def downgrade() -> None:
    """Remove display_order column from exercise_instructions table."""
    # Drop index first
    op.drop_index(
        op.f('ix_exercise_instructions_display_order'),
        table_name='exercise_instructions'
    )
    
    # Drop column
    op.drop_column('exercise_instructions', 'display_order')
