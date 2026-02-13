import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.core.config import settings
from src.api.routes import analyze, contradictions, root_cause, ingest

# Ensure litellm can see the API key
os.environ["GEMINI_API_KEY"] = settings.GEMINI_API_KEY

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Set all CORS enabled origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {"status": "operational", "service": settings.PROJECT_NAME}

# Include routers
app.include_router(analyze.router, prefix=f"{settings.API_V1_STR}/analyze", tags=["analysis"])
app.include_router(contradictions.router, prefix=f"{settings.API_V1_STR}/contradictions", tags=["contradictions"])
app.include_router(root_cause.router, prefix=f"{settings.API_V1_STR}/root-cause", tags=["quality-control"])
app.include_router(ingest.router, prefix=f"{settings.API_V1_STR}/ingest", tags=["ingestion"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
