from app.schemas.machine import MachineCreate, MachineUpdate, MachineResponse
from app.schemas.telemetry import TelemetryLogCreate, TelemetryLogResponse
from app.schemas.alert import AlertCreate, AlertUpdate, AlertResponse
from app.schemas.chat import DiagnoseRequest, DiagnoseResponse, DiagnoseTelemetryDetails

__all__ = [
    "MachineCreate",
    "MachineUpdate",
    "MachineResponse",
    "TelemetryLogCreate",
    "TelemetryLogResponse",
    "AlertCreate",
    "AlertUpdate",
    "AlertResponse",
    "DiagnoseRequest",
    "DiagnoseResponse",
    "DiagnoseTelemetryDetails",
]

