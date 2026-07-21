"""update_telemetry_log_schema

Revision ID: a0effed9fa94
Revises: '001_initial_schema'
Create Date: 2026-07-21 05:43:27.815773

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'a0effed9fa94'
down_revision: Union[str, None] = '001_initial_schema'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("DROP TABLE IF EXISTS telemetry_logs CASCADE")
    op.create_table(
        'telemetry_logs',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('product_id', sa.String(), nullable=False),
        sa.Column('air_temp_k', sa.Float(), nullable=True),
        sa.Column('process_temp_k', sa.Float(), nullable=True),
        sa.Column('rpm', sa.Integer(), nullable=True),
        sa.Column('torque_nm', sa.Float(), nullable=True),
        sa.Column('tool_wear_min', sa.Integer(), nullable=True),
        sa.Column('is_failure', sa.Boolean(), server_default=sa.text('false'), nullable=True),
        sa.Column('failure_reason', sa.String(), nullable=True),
        sa.Column('timestamp', sa.DateTime(), nullable=True)
    )


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS telemetry_logs CASCADE")
    op.create_table(
        'telemetry_logs',
        sa.Column('id', sa.UUID(), primary_key=True),
        sa.Column('machine_id', sa.UUID(), sa.ForeignKey('machines.id', ondelete='CASCADE'), nullable=False),
        sa.Column('timestamp', sa.DateTime(timezone=True), nullable=False),
        sa.Column('air_temp_k', sa.Float(), nullable=True),
        sa.Column('process_temp_k', sa.Float(), nullable=True),
        sa.Column('rpm', sa.Integer(), nullable=True),
        sa.Column('torque_nm', sa.Float(), nullable=True),
        sa.Column('tool_wear_min', sa.Integer(), nullable=True)
    )
