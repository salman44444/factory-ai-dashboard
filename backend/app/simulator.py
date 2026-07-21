import os
import time
import json
import asyncio
import datetime
import urllib.request
import urllib.error
import pandas as pd
from app.models.machine import Machine
from app.models.telemetry import TelemetryLog
from app.models.alert import Alert
from app.core.db import SessionLocal

def get_failure_reason(row) -> str | None:
    is_failure = bool(row.get("Machine failure", 0))
    if not is_failure:
        return None
    reasons = []
    if row.get("TWF", 0):
        reasons.append("Tool Wear Failure")
    if row.get("HDF", 0):
        reasons.append("Heat Dissipation Failure")
    if row.get("PWF", 0):
        reasons.append("Power Failure")
    if row.get("OSF", 0):
        reasons.append("Overstrain Failure")
    if row.get("RNF", 0):
        reasons.append("Random Failure")
    return ", ".join(reasons) if reasons else "Unknown Failure"

def row_to_json(row):
    is_failure = bool(row.get("Machine failure", 0))
    return {
        "product_id": str(row["Product ID"]),
        "type": str(row["Type"]),
        "air_temp_k": float(row["Air temperature [K]"]),
        "process_temp_k": float(row["Process temperature [K]"]),
        "rpm": int(row["Rotational speed [rpm]"]),
        "torque_nm": float(row["Torque [Nm]"]),
        "tool_wear_min": int(row["Tool wear [min]"]),
        "is_failure": is_failure,
        "failure_reason": get_failure_reason(row)
    }

def find_csv_path() -> str:
    candidates = ["ai4i2020.csv", "/app/ai4i2020.csv", "../ai4i2020.csv", "backend/ai4i2020.csv"]
    for path in candidates:
        if os.path.exists(path):
            return path
    raise FileNotFoundError("ai4i2020.csv not found in any standard locations")

def load_csv(path: str):
    df = pd.read_csv(path)
    records = [row_to_json(row) for _, row in df.iterrows()]
    return records

class SimulatorManager:
    def __init__(self):
        self.is_running = False
        self.task = None
        self.records = []
        self.current_index = 0

    def _ensure_records_loaded(self):
        if not self.records:
            csv_path = find_csv_path()
            self.records = load_csv(csv_path)

    async def _stream_loop(self, db_session=None, websocket_manager=None):
        """The actual loop reading CSV rows and broadcasting them."""
        self._ensure_records_loaded()
        
        while self.is_running and self.records:
            # 1. Fetch next row from CSV / DataFrame
            record = self.records[self.current_index]
            self.current_index = (self.current_index + 1) % len(self.records)

            # 2. Add current timestamp
            current_time = datetime.datetime.utcnow()

            # Create or use active session
            active_session = db_session if db_session is not None else SessionLocal()
            try:
                # 3. Ensure Machine exists
                machine = active_session.query(Machine).filter(Machine.id == record["product_id"]).first()
                if not machine:
                    machine = Machine(
                        id=record["product_id"],
                        name=f"Machine {record['product_id']}",
                        type=record.get("type", "M"),
                        status="OFFLINE"
                    )
                    active_session.add(machine)
                    active_session.commit()

                # Anomaly detection and machine status update
                status_to_set = "RUNNING"
                has_alert = False
                alert_severity = None
                alert_reason = None

                if record["is_failure"]:
                    status_to_set = "FAULT"
                    has_alert = True
                    alert_severity = "CRITICAL"
                    alert_reason = record["failure_reason"] or "Generic Machine Failure Detected"
                elif record["torque_nm"] > 60:
                    status_to_set = "WARNING"
                    has_alert = True
                    alert_severity = "MEDIUM"
                    alert_reason = f"High Torque Anomaly: {record['torque_nm']:.1f} Nm exceeds threshold of 60.0 Nm"
                elif record["tool_wear_min"] > 200:
                    status_to_set = "WARNING"
                    has_alert = True
                    alert_severity = "LOW"
                    alert_reason = f"Tool Wear Warning: {record['tool_wear_min']} min exceeds threshold of 200 min"

                # Update machine status if it changed
                if machine.status != status_to_set:
                    machine.status = status_to_set
                    active_session.add(machine)
                    active_session.commit()

                # 4. Save telemetry log to DB
                db_obj = TelemetryLog(
                    product_id=record["product_id"],
                    air_temp_k=record["air_temp_k"],
                    process_temp_k=record["process_temp_k"],
                    rpm=record["rpm"],
                    torque_nm=record["torque_nm"],
                    tool_wear_min=record["tool_wear_min"],
                    is_failure=record["is_failure"],
                    failure_reason=record["failure_reason"],
                    timestamp=current_time
                )
                active_session.add(db_obj)
                active_session.commit()
                active_session.refresh(db_obj)

                # Save alert to DB if triggered
                alert_obj = None
                if has_alert:
                    alert_obj = Alert(
                        machine_id=record["product_id"],
                        timestamp=current_time,
                        severity=alert_severity,
                        reason=alert_reason,
                        resolved=False
                    )
                    active_session.add(alert_obj)
                    active_session.commit()
                    active_session.refresh(alert_obj)

                # 5. Broadcast via WebSocket if available
                if websocket_manager:
                    # Broadcast telemetry event
                    telemetry_payload = {
                        "event_type": "telemetry",
                        "data": {
                            "id": str(db_obj.id),
                            "product_id": db_obj.product_id,
                            "air_temp_k": db_obj.air_temp_k,
                            "process_temp_k": db_obj.process_temp_k,
                            "rpm": db_obj.rpm,
                            "torque_nm": db_obj.torque_nm,
                            "tool_wear_min": db_obj.tool_wear_min,
                            "is_failure": db_obj.is_failure,
                            "failure_reason": db_obj.failure_reason,
                            "timestamp": db_obj.timestamp.isoformat() if db_obj.timestamp else None
                        }
                    }
                    if hasattr(websocket_manager, "broadcast"):
                        await websocket_manager.broadcast(telemetry_payload)
                    elif hasattr(websocket_manager, "send_json"):
                        await websocket_manager.send_json(telemetry_payload)

                    # Broadcast alert event
                    if has_alert and alert_obj:
                        alert_payload = {
                            "event_type": "alert",
                            "data": {
                                "id": str(alert_obj.id),
                                "machine_id": alert_obj.machine_id,
                                "severity": alert_obj.severity,
                                "reason": alert_obj.reason,
                                "resolved": alert_obj.resolved,
                                "timestamp": alert_obj.timestamp.isoformat() if alert_obj.timestamp else None
                            }
                        }
                        if hasattr(websocket_manager, "broadcast"):
                            await websocket_manager.broadcast(alert_payload)
                        elif hasattr(websocket_manager, "send_json"):
                            await websocket_manager.send_json(alert_payload)
            except Exception as e:
                # Rollback session on error to avoid broken transactions
                try:
                    active_session.rollback()
                except Exception:
                    pass
                print(f"Simulator error in streaming loop: {e}")
            finally:
                # Close the session if we created it locally
                if db_session is None:
                    active_session.close()


            await asyncio.sleep(1.0)

    def start(self, db_session=None, websocket_manager=None):
        if not self.is_running:
            self.is_running = True
            # Spawn the async loop as a background task in FastAPI
            self.task = asyncio.create_task(self._stream_loop(db_session, websocket_manager))

    def stop(self):
        self.is_running = False
        if self.task:
            self.task.cancel()
            self.task = None

# Global instance to hold the simulator state
simulator_instance = SimulatorManager()

# Legacy CLI support function if needed
def stream_telemetry(csv_path: str = "ai4i2020.csv", api_url: str = "http://localhost:8000/api/v1/telemetry/", delay: float = 0.5, limit: int = None):
    records = load_csv(csv_path)
    if limit:
        records = records[:limit]
    
    print(f"Starting legacy simulation streaming {len(records)} records to {api_url}...")
    for idx, data in enumerate(records, 1):
        try:
            data["timestamp"] = datetime.datetime.utcnow().isoformat()
            req_data = json.dumps(data).encode("utf-8")
            req = urllib.request.Request(api_url, data=req_data, headers={"Content-Type": "application/json"})
            with urllib.request.urlopen(req) as response:
                print(f"[{idx}/{len(records)}] Sent product_id={data['product_id']} | Status: {response.status}")
        except urllib.error.HTTPError as e:
            print(f"[{idx}/{len(records)}] HTTP Error: {e.code}")
        except Exception as e:
            print(f"[{idx}/{len(records)}] Error sending record: {e}")
        time.sleep(delay)
