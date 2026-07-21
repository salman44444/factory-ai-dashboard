import uuid
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.db import Base

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    machine_id = Column(String(50), ForeignKey("machines.id", ondelete="CASCADE"), nullable=False)
    timestamp = Column(DateTime(timezone=True), nullable=False)
    severity = Column(String(50), nullable=False)
    reason = Column(Text, nullable=True)
    resolved = Column(Boolean, nullable=False, default=False)

    machine = relationship("Machine", back_populates="alerts")
