import uuid
from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.db import Base

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
