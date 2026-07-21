from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict

class AlertBase(BaseModel):
    machine_id: UUID
    timestamp: datetime
    severity: str
    reason: Optional[str] = None
    resolved: bool = False

class AlertCreate(AlertBase):
    pass

class AlertUpdate(BaseModel):
    severity: Optional[str] = None
    reason: Optional[str] = None
    resolved: Optional[bool] = None

class AlertInDBBase(AlertBase):
    id: UUID

    model_config = ConfigDict(from_attributes=True)

class AlertResponse(AlertInDBBase):
    pass
