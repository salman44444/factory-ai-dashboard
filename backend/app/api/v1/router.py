from fastapi import APIRouter
from app.api.v1.endpoints import health, machines, telemetry, alerts, simulator, chat

api_router = APIRouter()

api_router.include_router(health.router, tags=["Health"])
api_router.include_router(machines.router, prefix="/machines", tags=["Machines"])
api_router.include_router(telemetry.router, prefix="/telemetry", tags=["Telemetry"])
api_router.include_router(alerts.router, prefix="/alerts", tags=["Alerts"])
api_router.include_router(simulator.router, prefix="/simulator", tags=["Simulator"])
api_router.include_router(chat.router, prefix="/chat", tags=["Chat"])

