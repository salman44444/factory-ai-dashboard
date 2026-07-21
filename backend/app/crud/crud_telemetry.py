from typing import List
from sqlalchemy.orm import Session
from app.crud.base import CRUDBase
from app.models.telemetry import TelemetryLog
from app.schemas.telemetry import TelemetryLogCreate

class CRUDTelemetry(CRUDBase[TelemetryLog, TelemetryLogCreate, TelemetryLogCreate]):
    def get_by_machine(
        self, db: Session, *, machine_id: str, skip: int = 0, limit: int = 100
    ) -> List[TelemetryLog]:
        return (
            db.query(self.model)
            .filter(self.model.machine_id == machine_id)
            .order_by(self.model.timestamp.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

telemetry = CRUDTelemetry(TelemetryLog)
