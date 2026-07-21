from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict

class TelemetryLogBase(BaseModel):
    machine_id: UUID
    timestamp: datetime
    air_temp_k: Optional[float] = None
    process_temp_k: Optional[float] = None
    rpm: Optional[int] = None
    torque_nm: Optional[float] = None
    tool_wear_min: Optional[int] = None

class TelemetryLogCreate(TelemetryLogBase):
    pass

class TelemetryLogInDBBase(TelemetryLogBase):
    id: UUID

    model_config = ConfigDict(from_attributes=True)

class TelemetryLogResponse(TelemetryLogInDBBase):
    pass
