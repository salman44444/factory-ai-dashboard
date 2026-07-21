from typing import List
from uuid import UUID
from sqlalchemy.orm import Session
from app.crud.base import CRUDBase
from app.models.alert import Alert
from app.schemas.alert import AlertCreate, AlertUpdate

class CRUDAlert(CRUDBase[Alert, AlertCreate, AlertUpdate]):
    def get_by_machine(
        self, db: Session, *, machine_id: UUID, skip: int = 0, limit: int = 100
    ) -> List[Alert]:
        return (
            db.query(self.model)
            .filter(self.model.machine_id == machine_id)
            .order_by(self.model.timestamp.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

alert = CRUDAlert(Alert)
