from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict

class MachineBase(BaseModel):
    name: str
    type: str
    status: Optional[str] = "OFFLINE"

class MachineCreate(MachineBase):
    pass

class MachineUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    status: Optional[str] = None

class MachineInDBBase(MachineBase):
    id: UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class MachineResponse(MachineInDBBase):
    pass
