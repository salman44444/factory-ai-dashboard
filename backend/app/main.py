from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.router import api_router
from app.core.websocket import manager as websocket_manager

tags_metadata = [
    {
        "name": "Health",
        "description": "System health and status check endpoints.",
    },
    {
        "name": "Machines",
        "description": "Industrial machine inventory and operational status management.",
    },
    {
        "name": "Telemetry",
        "description": "Real-time telemetry log ingestion and query operations.",
    },
    {
        "name": "Alerts",
        "description": "Predictive maintenance warning and anomaly alerts.",
    },
    {
        "name": "Simulator",
        "description": "Real-time data streaming simulator configuration and control.",
    },
    {
        "name": "Chat",
        "description": "AI-powered diagnostic copilot and crash analysis endpoints.",
    },
]

app = FastAPI(
    title=settings.PROJECT_NAME,
    description=settings.PROJECT_DESCRIPTION,
    version=settings.VERSION,
    openapi_tags=tags_metadata,
    docs_url=settings.DOCS_URL,
    redoc_url=settings.REDOC_URL,
    openapi_url=settings.OPENAPI_URL,
)

# Enable CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Router
app.include_router(api_router, prefix=settings.API_V1_STR)

from fastapi import Depends
from sqlalchemy.orm import Session
from app.api.deps import get_db_session
from app.schemas.chat import DiagnoseRequest, DiagnoseResponse
from app.services.diagnostic_service import run_ai_diagnosis

@app.post("/api/chat/diagnose", response_model=DiagnoseResponse, tags=["Chat"], summary="Diagnose machine failure with AI (Direct path)")
def diagnose_machine_direct(
    payload: DiagnoseRequest,
    db: Session = Depends(get_db_session)
):
    """Direct POST /api/chat/diagnose route."""
    return run_ai_diagnosis(db, machine_id=payload.machine_id)


@app.websocket("/ws/live-data")
async def websocket_endpoint(websocket: WebSocket):
    await websocket_manager.connect(websocket)
    try:
        while True:
            # Wait for any message from the client to keep connection open
            await websocket.receive_text()
    except WebSocketDisconnect:
        websocket_manager.disconnect(websocket)
    except Exception:
        websocket_manager.disconnect(websocket)

@app.get("/", summary="API Root Info", tags=["Health"])
def read_root():
    return {
        "message": f"Welcome to {settings.PROJECT_NAME}",
        "version": settings.VERSION,
        "docs_url": settings.DOCS_URL,
        "redoc_url": settings.REDOC_URL,
        "api_v1": settings.API_V1_STR,
    }

