from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api.deps import get_db_session
from app import crud, schemas

router = APIRouter()

@router.get("/", response_model=List[schemas.AlertResponse], summary="List all alerts")
def read_alerts(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db_session)
):
    """Retrieve alerts with pagination."""
    return crud.alert.get_multi(db, skip=skip, limit=limit)

@router.post("/", response_model=schemas.AlertResponse, status_code=status.HTTP_201_CREATED, summary="Create an alert")
def create_alert(
    alert_in: schemas.AlertCreate,
    db: Session = Depends(get_db_session)
):
    """Create a new alert."""
    return crud.alert.create(db, obj_in=alert_in)

@router.patch("/{alert_id}", response_model=schemas.AlertResponse, summary="Update an alert")
def update_alert(
    alert_id: UUID,
    alert_in: schemas.AlertUpdate,
    db: Session = Depends(get_db_session)
):
    """Update alert resolution status or details."""
    alert_obj = crud.alert.get(db, id=alert_id)
    if not alert_obj:
        raise HTTPException(status_code=404, detail="Alert not found")
    return crud.alert.update(db, db_obj=alert_obj, obj_in=alert_in)
