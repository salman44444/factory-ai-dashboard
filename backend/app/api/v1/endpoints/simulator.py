import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.simulator import simulator_instance, get_failure_reason
from app.core.websocket import manager as websocket_manager
from app.api.deps import get_db_session
from app.models.machine import Machine
from app.models.telemetry import TelemetryLog
from app.models.alert import Alert

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
    """Stops the simulator (if running), resets index to 0, and deletes all alerts, telemetry logs, and machines."""
    # Stop the running background task safely first
    simulator_instance.stop()
    simulator_instance.current_index = 0
    
    # Delete all alerts, telemetry logs, and machines from database
    num_alerts_deleted = db.query(Alert).delete()
    num_telemetry_deleted = db.query(TelemetryLog).delete()
    num_machines_deleted = db.query(Machine).delete()
    db.commit()
    
    return {
        "status": "Simulator reset successful",
        "deleted_records_count": num_telemetry_deleted,
        "deleted_machines_count": num_machines_deleted,
        "deleted_alerts_count": num_alerts_deleted
    }

@router.get("/data", summary="Fetch Simulator CSV Data")
async def fetch_simulator_data(skip: int = 0, limit: int = 100):
    """Fetches the raw simulator dataset loaded in memory (paginated)."""
    simulator_instance._ensure_records_loaded()
    return simulator_instance.records[skip : skip + limit]

@router.delete("/data", summary="Delete Telemetry Data")
async def delete_telemetry_data(db: Session = Depends(get_db_session)):
    """Deletes all telemetry logs in the database."""
    num_deleted = db.query(TelemetryLog).delete()
    db.commit()
    return {
        "status": "Deletion successful",
        "deleted_records_count": num_deleted
    }

@router.post("/load", summary="Bulk Load All CSV Data")
async def load_all_csv_data(db: Session = Depends(get_db_session)):
    """Bulk-loads the entire CSV dataset sliced across the 3 simulator machines into the database."""
    simulator_instance._ensure_data_loaded()
    
    # 1. Define the 3 simulator machines
    machines_to_create = [
        {"id": "CNC-01", "name": "CNC-01", "type": "M", "status": "OFFLINE"},
        {"id": "CNC-02", "name": "CNC-02", "type": "L", "status": "OFFLINE"},
        {"id": "CNC-03", "name": "CNC-03", "type": "H", "status": "OFFLINE"},
    ]
    
    # Create them if they don't exist
    for m_data in machines_to_create:
        existing = db.query(Machine).filter(Machine.id == m_data["id"]).first()
        if not existing:
            new_m = Machine(**m_data)
            db.add(new_m)
    db.commit()

    # 2. Slice and load the data
    current_time = datetime.datetime.utcnow()
    telemetry_mappings = []
    
    # We slice chunks exactly like in the simulator
    chunks = {
        "CNC-01": simulator_instance.chunks["CNC-01"],
        "CNC-02": simulator_instance.chunks["CNC-02"],
        "CNC-03": simulator_instance.chunks["CNC-03"]
    }
    
    for machine_id, chunk_df in chunks.items():
        for _, row in chunk_df.iterrows():
            telemetry_mappings.append({
                "machine_id": machine_id,
                "product_id": str(row["Product ID"]),
                "air_temp_k": float(row["Air temperature [K]"]),
                "process_temp_k": float(row["Process temperature [K]"]),
                "rpm": int(row["Rotational speed [rpm]"]),
                "torque_nm": float(row["Torque [Nm]"]),
                "tool_wear_min": int(row["Tool wear [min]"]),
                "is_failure": bool(row["Machine failure"] == 1),
                "failure_reason": get_failure_reason(row),
                "timestamp": current_time
            })
            
    # Perform bulk insert for telemetry
    if telemetry_mappings:
        db.bulk_insert_mappings(TelemetryLog, telemetry_mappings)
        db.commit()
        
    return {
        "status": "Success",
        "message": f"Successfully created/verified CNC machines and loaded all {len(telemetry_mappings)} telemetry records."
    }
