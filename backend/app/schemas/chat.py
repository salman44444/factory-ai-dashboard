from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict

class DiagnoseRequest(BaseModel):
    machine_id: str
    user_query: str = "Diagnose the current machine state and give me a fix plan."

class DiagnoseTelemetryDetails(BaseModel):
    id: Optional[int] = None
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

    model_config = ConfigDict(from_attributes=True)

class DiagnoseResponse(BaseModel):
    machine_id: str
    has_failure: bool
    failure_reason: Optional[str] = None
    telemetry: Optional[DiagnoseTelemetryDetails] = None
    summary: str
    diagnosis: str
    root_cause: str
    recommendations: List[str] = []
    confidence_score: float = 0.95
    timestamp: Optional[datetime] = None
