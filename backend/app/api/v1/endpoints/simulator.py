import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.simulator import simulator_instance
from app.core.websocket import manager as websocket_manager
from app.api.deps import get_db_session
from app.models.machine import Machine
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
    """Bulk-loads the entire CSV dataset (10,000 records) into the database, creating machines as needed."""
    # Ensure data is loaded from CSV
    simulator_instance._ensure_records_loaded()
    
    # 1. Extract unique machine IDs and types
    unique_machines = {}
    for record in simulator_instance.records:
        pid = record["product_id"]
        mtype = record.get("type", "M")
        if pid not in unique_machines:
            unique_machines[pid] = mtype

    # 2. Query existing machine IDs
    existing_machine_ids = {m[0] for m in db.query(Machine.id).filter(Machine.id.in_(list(unique_machines.keys()))).all()}
    
    # 3. Prepare new machines list and bulk insert them
    new_machines_mappings = []
    for pid, mtype in unique_machines.items():
        if pid not in existing_machine_ids:
            new_machines_mappings.append({
                "id": pid,
                "name": f"Machine {pid}",
                "type": mtype,
                "status": "OFFLINE"
            })
            
    if new_machines_mappings:
        db.bulk_insert_mappings(Machine, new_machines_mappings)
        db.commit()

    # 4. Prepare telemetry logs mapping and bulk insert them
    current_time = datetime.datetime.utcnow()
    telemetry_mappings = []
    for record in simulator_instance.records:
        telemetry_mappings.append({
            "product_id": record["product_id"],
            "air_temp_k": record["air_temp_k"],
            "process_temp_k": record["process_temp_k"],
            "rpm": record["rpm"],
            "torque_nm": record["torque_nm"],
            "tool_wear_min": record["tool_wear_min"],
            "is_failure": record["is_failure"],
            "failure_reason": record["failure_reason"],
            "timestamp": current_time
        })
    
    # Perform ultra-fast bulk insert for telemetry
    db.bulk_insert_mappings(TelemetryLog, telemetry_mappings)
    db.commit()
    
    return {
        "status": "Success",
        "message": f"Successfully created/verified machines and loaded all {len(telemetry_mappings)} telemetry records."
    }
