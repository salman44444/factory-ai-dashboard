from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api.deps import get_db_session
from app import crud, schemas

router = APIRouter()

@router.get("/", response_model=List[schemas.MachineResponse], summary="List all machines")
def read_machines(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db_session)
):
    """Retrieve machines with pagination."""
    return crud.machine.get_multi(db, skip=skip, limit=limit)

@router.post("/", response_model=schemas.MachineResponse, status_code=status.HTTP_201_CREATED, summary="Create a machine")
def create_machine(
    machine_in: schemas.MachineCreate,
    db: Session = Depends(get_db_session)
):
    """Create a new machine record."""
    return crud.machine.create(db, obj_in=machine_in)

@router.get("/{machine_id}", response_model=schemas.MachineResponse, summary="Get machine by ID")
def read_machine(
    machine_id: UUID,
    db: Session = Depends(get_db_session)
):
    """Get details of a specific machine."""
    machine = crud.machine.get(db, id=machine_id)
    if not machine:
        raise HTTPException(status_code=404, detail="Machine not found")
    return machine
