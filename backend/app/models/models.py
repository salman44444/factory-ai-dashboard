import uuid
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.db import Base

class Machine(Base):
    __tablename__ = "machines"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    type = Column(String(255), nullable=False)
    status = Column(String(50), nullable=False, default="OFFLINE")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    telemetry_logs = relationship("TelemetryLog", back_populates="machine", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="machine", cascade="all, delete-orphan")

class TelemetryLog(Base):
    __tablename__ = "telemetry_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    machine_id = Column(UUID(as_uuid=True), ForeignKey("machines.id", ondelete="CASCADE"), nullable=False)
    timestamp = Column(DateTime(timezone=True), nullable=False)
    air_temp_k = Column(Float, nullable=True)
    process_temp_k = Column(Float, nullable=True)
    rpm = Column(Integer, nullable=True)
    torque_nm = Column(Float, nullable=True)
    tool_wear_min = Column(Integer, nullable=True)

    machine = relationship("Machine", back_populates="telemetry_logs")

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    machine_id = Column(UUID(as_uuid=True), ForeignKey("machines.id", ondelete="CASCADE"), nullable=False)
    timestamp = Column(DateTime(timezone=True), nullable=False)
    severity = Column(String(50), nullable=False)
    reason = Column(Text, nullable=True)
    resolved = Column(Boolean, nullable=False, default=False)

    machine = relationship("Machine", back_populates="alerts")
