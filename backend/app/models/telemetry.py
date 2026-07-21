from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime
from app.core.db import Base

class TelemetryLog(Base):
    __tablename__ = "telemetry_logs"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(String, nullable=False)
    air_temp_k = Column(Float, nullable=True)
    process_temp_k = Column(Float, nullable=True)
    rpm = Column(Integer, nullable=True)
    torque_nm = Column(Float, nullable=True)
    tool_wear_min = Column(Integer, nullable=True)
    is_failure = Column(Boolean, default=False)
    failure_reason = Column(String, nullable=True)  # e.g., "Overstrain Failure"
    timestamp = Column(DateTime, default=datetime.utcnow)
