from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.api.deps import get_db_session
from app.schemas.chat import DiagnoseRequest, DiagnoseResponse
from app.services.diagnostic_service import run_ai_diagnosis

router = APIRouter()

@router.post("/diagnose", response_model=DiagnoseResponse, status_code=status.HTTP_200_OK, summary="Diagnose machine failure with AI")
def diagnose_machine(
    payload: DiagnoseRequest,
    db: Session = Depends(get_db_session)
):
    """
    Accepts machine_id and queries PostgreSQL for the exact telemetry row that caused the crash,
    extracting metrics (RPM, Torque, Temps, Tool Wear) and failure type to return AI diagnosis context.
    """
    return run_ai_diagnosis(db, machine_id=payload.machine_id)
