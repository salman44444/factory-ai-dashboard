from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.router import api_router

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

@app.get("/", summary="API Root Info", tags=["Health"])
def read_root():
    return {
        "message": f"Welcome to {settings.PROJECT_NAME}",
        "version": settings.VERSION,
        "docs_url": settings.DOCS_URL,
        "redoc_url": settings.REDOC_URL,
        "api_v1": settings.API_V1_STR,
    }
