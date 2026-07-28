from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api.deps import get_db_session
from app.schemas.chat import DiagnoseRequest
from app.services.agent_workflow import build_diagnostic_graph

router = APIRouter()

@router.post("/diagnose", status_code=status.HTTP_200_OK, summary="Diagnose machine failure with AI")
async def diagnose_machine(
    request: DiagnoseRequest,
    db: Session = Depends(get_db_session)
):
    try:
        # Compile graph with DB session
        app_graph = build_diagnostic_graph(db)
        
        initial_state = {
            "machine_id": request.machine_id,
            "user_query": request.user_query,
            "failure_type": "",
            "telemetry_window": [],
            "haas_manual_context": "",
            "fanuc_alarm_context": "",
            "cnc_sop_context": "",
            "haas_query": "",
            "fanuc_query": "",
            "cnc_sop_query": "",
            "final_diagnosis": ""
        }
        
        # Execute the graph
        final_state = await app_graph.ainvoke(initial_state)
        
        return {
            "machine_id": request.machine_id,
            "failure_type": final_state["failure_type"],
            "diagnosis": final_state["final_diagnosis"],
            "sources_used": [
                "Haas VF Series Service Manual",
                "Fanuc Spindle Alarm List",
                "CNC Lathe Safe Operating Procedure"
            ],
            "agent_flow_details": {
                "telemetry_window": final_state.get("telemetry_window", []),
                "haas_manual_context": final_state.get("haas_manual_context", ""),
                "fanuc_alarm_context": final_state.get("fanuc_alarm_context", ""),
                "cnc_sop_context": final_state.get("cnc_sop_context", ""),
                "haas_query": final_state.get("haas_query", ""),
                "fanuc_query": final_state.get("fanuc_query", ""),
                "cnc_sop_query": final_state.get("cnc_sop_query", ""),
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
