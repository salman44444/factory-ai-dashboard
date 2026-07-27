from typing import TypedDict, List, Optional, Any
from datetime import datetime
from sqlalchemy.orm import Session
from langgraph.graph import StateGraph, END
from app.models.telemetry import TelemetryLog
from app.schemas.chat import DiagnoseResponse, DiagnoseTelemetryDetails

class DiagnosticState(TypedDict):
    db: Any
    machine_id: str
    telemetry_logs: List[Any]
    latest_log: Optional[Any]
    has_failure: bool
    failure_reason: Optional[str]
    summary: str
    diagnosis: str
    root_cause: str
    recommendations: List[str]
    confidence_score: float
    timestamp: Optional[datetime]

def fetch_sql_context(state: DiagnosticState) -> dict:
    """
    Node 1: Queries PostgreSQL for the latest 20 telemetry logs of the specified machine.
    """
    db: Session = state["db"]
    machine_id: str = state["machine_id"]

    logs = (
        db.query(TelemetryLog)
        .filter(TelemetryLog.machine_id == machine_id)
        .order_by(TelemetryLog.timestamp.desc())
        .limit(20)
        .all()
    )

    if not logs:
        return {
            "telemetry_logs": [],
            "latest_log": None,
            "has_failure": False,
            "failure_reason": "No Telemetry Data Available",
            "summary": f"No telemetry logs found in database for machine {machine_id}.",
            "diagnosis": "Node 1 (SQL Context): Unable to run diagnosis as no telemetry logs exist.",
            "root_cause": "Database query returned 0 records.",
            "recommendations": [],
            "confidence_score": 0.0,
            "timestamp": datetime.utcnow()
        }

    latest_log = logs[0]
    has_failure = any(log.is_failure for log in logs)
    failure_log = next((log for log in logs if log.is_failure), None)
    failure_reason = (failure_log.failure_reason if failure_log else None) or latest_log.failure_reason

    return {
        "telemetry_logs": logs,
        "latest_log": latest_log,
        "has_failure": has_failure,
        "failure_reason": failure_reason,
        "summary": f"Retrieved {len(logs)} latest telemetry rows for machine {machine_id}.",
        "diagnosis": f"Node 1 (SQL Context): Fetched {len(logs)} telemetry records leading up to {latest_log.timestamp}.",
        "root_cause": f"Primary telemetry point at RPM={latest_log.rpm}, Torque={latest_log.torque_nm} Nm.",
        "recommendations": [],
        "confidence_score": 1.0,
        "timestamp": latest_log.timestamp
    }

# Build LangGraph workflow
builder = StateGraph(DiagnosticState)
builder.add_node("fetch_sql_context", fetch_sql_context)
builder.set_entry_point("fetch_sql_context")
builder.add_edge("fetch_sql_context", END)
graph = builder.compile()

def run_ai_diagnosis(db: Session, machine_id: str) -> DiagnoseResponse:
    """
    Runs the LangGraph diagnostic workflow for the given machine_id.
    """
    initial_state: DiagnosticState = {
        "db": db,
        "machine_id": machine_id,
        "telemetry_logs": [],
        "latest_log": None,
        "has_failure": False,
        "failure_reason": None,
        "summary": "",
        "diagnosis": "",
        "root_cause": "",
        "recommendations": [],
        "confidence_score": 0.0,
        "timestamp": None
    }

    final_state = graph.invoke(initial_state)

    telemetry_details = (
        DiagnoseTelemetryDetails.model_validate(final_state["latest_log"])
        if final_state.get("latest_log") else None
    )

    return DiagnoseResponse(
        machine_id=final_state["machine_id"],
        has_failure=final_state["has_failure"],
        failure_reason=final_state["failure_reason"],
        telemetry=telemetry_details,
        summary=final_state["summary"],
        diagnosis=final_state["diagnosis"],
        root_cause=final_state["root_cause"],
        recommendations=final_state["recommendations"],
        confidence_score=final_state["confidence_score"],
        timestamp=final_state["timestamp"]
    )
