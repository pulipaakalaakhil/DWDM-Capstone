from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.api.endpoints import (
    dataset, preprocessing, analytics, mining, 
    prediction, hotspots, olap, schema, reports, websocket, auth
)
from app.database.connection import init_db

# Initialize database tables
try:
    init_db()
except Exception as e:
    print(f"DB init warning: {e}")

app = FastAPI(
    title="Traffic Pattern Analysis API",
    description="Smart City Traffic Intelligence Backend",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(dataset.router, prefix="/api/dataset", tags=["Dataset"])
app.include_router(preprocessing.router, prefix="/api/preprocessing", tags=["Preprocessing"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])
app.include_router(mining.router, prefix="/api/mining", tags=["Data Mining"])
app.include_router(prediction.router, prefix="/api/prediction", tags=["ML Prediction"])
app.include_router(hotspots.router, prefix="/api/hotspots", tags=["Hotspots"])
app.include_router(olap.router, prefix="/api/olap", tags=["OLAP"])
app.include_router(schema.router, prefix="/api/schema", tags=["Schema"])
app.include_router(reports.router, prefix="/api/reports", tags=["Reports"])
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(websocket.router, prefix="/ws", tags=["WebSocket"])

@app.get("/")
async def root():
    return {
        "message": "Traffic Pattern Analysis API",
        "version": "1.0.0",
        "docs": "/api/docs"
    }

@app.get("/api/health")
async def health():
    return {"status": "healthy", "service": "Traffic Intelligence API"}
