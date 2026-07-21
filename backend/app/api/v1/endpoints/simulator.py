from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.simulator import simulator_instance
from app.core.websocket import manager as websocket_manager
from app.api.deps import get_db_session
from app.models.telemetry import TelemetryLog

router = APIRouter()

@router.post("/start", summary="Start Simulator")
async def start_simulator():
    """Starts the real-time simulation background task."""
    simulator_instance.start(websocket_manager=websocket_manager)
    return {"status": "Simulator started"}

@router.post("/stop", summary="Stop Simulator")
async def stop_simulator():
    """Stops the real-time simulation background task."""
    simulator_instance.stop()
    return {"status": "Simulator paused"}

@router.get("/status", summary="Get Simulator Status")
async def get_simulator_status():
    """Checks whether the simulator background task is currently active."""
    return {"is_running": simulator_instance.is_running}

@router.delete("/reset", summary="Reset Simulator Data")
async def reset_simulator_data(db: Session = Depends(get_db_session)):
    """Stops the simulator (if running), resets index to 0, and deletes all telemetry logs."""
    # Stop the running background task safely first
    simulator_instance.stop()
    simulator_instance.current_index = 0
    
    # Delete all telemetry logs from database
    num_deleted = db.query(TelemetryLog).delete()
    db.commit()
    
    return {
        "status": "Simulator reset successful",
        "deleted_records_count": num_deleted
    }
