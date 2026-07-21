from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict

class TelemetryLogBase(BaseModel):
    machine_id: str
    product_id: Optional[str] = None
    air_temp_k: Optional[float] = None
    process_temp_k: Optional[float] = None
    rpm: Optional[int] = None
    torque_nm: Optional[float] = None
    tool_wear_min: Optional[int] = None
    is_failure: bool = False
    failure_reason: Optional[str] = None
    timestamp: Optional[datetime] = None

class TelemetryLogCreate(TelemetryLogBase):
    pass

class TelemetryLogInDBBase(TelemetryLogBase):
    id: int
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)

class TelemetryLogResponse(TelemetryLogInDBBase):
    pass
