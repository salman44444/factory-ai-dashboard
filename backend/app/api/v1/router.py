from fastapi import APIRouter
from app.api.v1.endpoints import health, machines, telemetry, alerts

api_router = APIRouter()

api_router.include_router(health.router, tags=["Health"])
api_router.include_router(machines.router, prefix="/machines", tags=["Machines"])
api_router.include_router(telemetry.router, prefix="/telemetry", tags=["Telemetry"])
api_router.include_router(alerts.router, prefix="/alerts", tags=["Alerts"])
