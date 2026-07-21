"""update_machine_id_to_string_and_fkey

Revision ID: 66ac22c63174
Revises: 'a0effed9fa94'
Create Date: 2026-07-21 20:20:10.469748

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '66ac22c63174'
down_revision: Union[str, None] = 'a0effed9fa94'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Drop existing tables with foreign keys first
    op.execute("DROP TABLE IF EXISTS alerts CASCADE")
    op.execute("DROP TABLE IF EXISTS telemetry_logs CASCADE")
    op.execute("DROP TABLE IF EXISTS machines CASCADE")

    # Create machines table with String primary key
    op.create_table(
        'machines',
        sa.Column('id', sa.String(length=50), primary_key=True),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('type', sa.String(length=255), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=False, server_default='OFFLINE'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True)
    )

    # Create telemetry_logs table with ForeignKey pointing to machines
    op.create_table(
        'telemetry_logs',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('product_id', sa.String(length=50), sa.ForeignKey('machines.id', ondelete='CASCADE'), nullable=False),
        sa.Column('air_temp_k', sa.Float(), nullable=True),
        sa.Column('process_temp_k', sa.Float(), nullable=True),
        sa.Column('rpm', sa.Integer(), nullable=True),
        sa.Column('torque_nm', sa.Float(), nullable=True),
        sa.Column('tool_wear_min', sa.Integer(), nullable=True),
        sa.Column('is_failure', sa.Boolean(), server_default=sa.text('false'), nullable=True),
        sa.Column('failure_reason', sa.String(), nullable=True),
        sa.Column('timestamp', sa.DateTime(), nullable=True)
    )

    # Create alerts table with String foreign key pointing to machines
    op.create_table(
        'alerts',
        sa.Column('id', sa.UUID(), primary_key=True),
        sa.Column('machine_id', sa.String(length=50), sa.ForeignKey('machines.id', ondelete='CASCADE'), nullable=False),
        sa.Column('timestamp', sa.DateTime(timezone=True), nullable=False),
        sa.Column('severity', sa.String(length=50), nullable=False),
        sa.Column('reason', sa.Text(), nullable=True),
        sa.Column('resolved', sa.Boolean(), server_default=sa.text('false'), nullable=False)
    )


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS alerts CASCADE")
    op.execute("DROP TABLE IF EXISTS telemetry_logs CASCADE")
    op.execute("DROP TABLE IF EXISTS machines CASCADE")

    op.create_table(
        'machines',
        sa.Column('id', sa.UUID(), primary_key=True),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('type', sa.String(length=255), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=False, server_default='OFFLINE'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True)
    )

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

    op.create_table(
        'alerts',
        sa.Column('id', sa.UUID(), primary_key=True),
        sa.Column('machine_id', sa.UUID(), sa.ForeignKey('machines.id', ondelete='CASCADE'), nullable=False),
        sa.Column('timestamp', sa.DateTime(timezone=True), nullable=False),
        sa.Column('severity', sa.String(length=50), nullable=False),
        sa.Column('reason', sa.Text(), nullable=True),
        sa.Column('resolved', sa.Boolean(), server_default=sa.text('false'), nullable=False)
    )
