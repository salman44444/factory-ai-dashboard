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

    def get_failure_context(
        self, db: Session, *, machine_id: str, limit: int = 20
    ) -> List[TelemetryLog]:
        # Find the latest failure for this machine
        latest_failure = (
            db.query(self.model)
            .filter(self.model.machine_id == machine_id, self.model.is_failure == True)
            .order_by(self.model.timestamp.desc())
            .first()
        )
        if latest_failure:
            # Get up to 'limit' logs preceding (and including) this failure
            logs = (
                db.query(self.model)
                .filter(self.model.machine_id == machine_id, self.model.timestamp <= latest_failure.timestamp)
                .order_by(self.model.timestamp.desc())
                .limit(limit)
                .all()
            )
            # Return chronological order (oldest to newest)
            return list(reversed(logs))
        
        # If no failure, return the latest 'limit' logs in chronological order
        logs = (
            db.query(self.model)
            .filter(self.model.machine_id == machine_id)
            .order_by(self.model.timestamp.desc())
            .limit(limit)
            .all()
        )
        return list(reversed(logs))

telemetry = CRUDTelemetry(TelemetryLog)
