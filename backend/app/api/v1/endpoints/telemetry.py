from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.api.deps import get_db_session
from app import crud, schemas

router = APIRouter()

@router.get("/machine/{machine_id}", response_model=List[schemas.TelemetryLogResponse], summary="Get telemetry by machine")
def read_telemetry_by_machine(
    machine_id: UUID,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db_session)
):
    """Retrieve telemetry logs for a specific machine."""
    return crud.telemetry.get_by_machine(db, machine_id=machine_id, skip=skip, limit=limit)

@router.post("/", response_model=schemas.TelemetryLogResponse, status_code=status.HTTP_201_CREATED, summary="Log telemetry data")
def create_telemetry_log(
    telemetry_in: schemas.TelemetryLogCreate,
    db: Session = Depends(get_db_session)
):
    """Record a new telemetry data point."""
    return crud.telemetry.create(db, obj_in=telemetry_in)
