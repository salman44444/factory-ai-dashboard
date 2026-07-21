from sqlalchemy import Column, String, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.db import Base

class Machine(Base):
    __tablename__ = "machines"

    id = Column(String(50), primary_key=True)
    name = Column(String(255), nullable=False)
    type = Column(String(255), nullable=False)
    status = Column(String(50), nullable=False, default="OFFLINE")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    telemetry_logs = relationship("TelemetryLog", back_populates="machine", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="machine", cascade="all, delete-orphan")
