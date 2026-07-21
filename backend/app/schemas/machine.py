from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict

class MachineBase(BaseModel):
    name: str
    type: str
    status: Optional[str] = "OFFLINE"

class MachineCreate(MachineBase):
    id: str  # The product ID string to be used as primary key

class MachineUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    status: Optional[str] = None

class MachineInDBBase(MachineBase):
    id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class MachineResponse(MachineInDBBase):
    pass
