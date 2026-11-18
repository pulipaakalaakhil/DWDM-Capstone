from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import asyncio
import json
import pandas as pd
import numpy as np
from app.services.data_service import load_dataset
import random

router = APIRouter()

class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def send_json(self, websocket: WebSocket, data: dict):
        await websocket.send_json(data)

manager = ConnectionManager()

@router.websocket("/traffic")
async def traffic_websocket(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        df = load_dataset()
        areas = df['Area Name'].unique().tolist()
        congestion_levels = ['Free Flow', 'Low', 'Moderate', 'High', 'Severe']
        
        idx = 0
        while True:
            try:
                # Send simulated live traffic data
                area = random.choice(areas)
                area_df = df[df['Area Name'] == area]
                sample = area_df.sample(1).iloc[0] if len(area_df) > 0 else df.sample(1).iloc[0]
                
                variation = random.uniform(0.85, 1.15)
                
                data = {
                    "type": "traffic_update",
                    "timestamp": pd.Timestamp.now().isoformat(),
                    "area": str(sample.get('Area Name', area)),
                    "road": str(sample.get('Road/Intersection Name', 'Unknown')),
                    "traffic_volume": int(float(sample.get('Traffic Volume', 1000)) * variation),
                    "avg_speed": round(float(sample.get('Average Speed (km/h)', 30)) * random.uniform(0.9, 1.1), 1),
                    "congestion_level": str(sample.get('Congestion Level', 'Moderate')),
                    "lat": float(sample.get('Latitude', 12.9716)),
                    "lng": float(sample.get('Longitude', 77.5946)),
                    "mode": "historical_playback"
                }
                
                await manager.send_json(websocket, data)
                await asyncio.sleep(2)  # Send update every 2 seconds
                idx += 1
                
            except WebSocketDisconnect:
                break
            except Exception as e:
                try:
                    await manager.send_json(websocket, {"type": "error", "message": str(e)})
                except:
                    break
    except WebSocketDisconnect:
        pass
    finally:
        manager.disconnect(websocket)

@router.websocket("/alerts")
async def alerts_websocket(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        df = load_dataset()
        severe_areas = df[df['Congestion Level'].isin(['High', 'Severe'])]['Area Name'].unique().tolist()
        
        while True:
            try:
                if random.random() < 0.3 and severe_areas:  # 30% chance of alert
                    area = random.choice(severe_areas)
                    severity = random.choice(['High', 'Severe'])
                    alert = {
                        "type": "alert",
                        "timestamp": pd.Timestamp.now().isoformat(),
                        "area": area,
                        "severity": severity,
                        "message": f"{severity} congestion detected at {area}",
                        "traffic_volume": random.randint(1500, 3000),
                        "avg_speed": random.randint(8, 25)
                    }
                    await manager.send_json(websocket, alert)
                
                await asyncio.sleep(5)
            except WebSocketDisconnect:
                break
    except WebSocketDisconnect:
        pass
    finally:
        manager.disconnect(websocket)
