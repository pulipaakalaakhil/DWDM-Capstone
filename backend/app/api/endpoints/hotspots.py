from fastapi import APIRouter, HTTPException
import pandas as pd
import numpy as np
from app.services.data_service import load_dataset

router = APIRouter()

@router.get("/")
async def get_hotspots():
    try:
        from sklearn.cluster import KMeans
        from sklearn.preprocessing import StandardScaler
        
        df = load_dataset()
        congestion_map = {'Free Flow': 0, 'Low': 1, 'Moderate': 2, 'High': 3, 'Severe': 4}
        df['cong_num'] = df['Congestion Level'].map(congestion_map).fillna(2)
        
        area_stats = df.groupby(['Area Name', 'Road/Intersection Name']).agg({
            'Traffic Volume': 'mean',
            'Average Speed (km/h)': 'mean',
            'cong_num': 'mean',
            'Road Capacity Utilization (%)': 'mean',
            'Incident Reports': 'mean',
            'Latitude': 'mean',
            'Longitude': 'mean'
        }).reset_index()
        
        # Congestion score
        area_stats['congestion_score'] = (
            area_stats['cong_num'] * 0.4 +
            (area_stats['Traffic Volume'] / area_stats['Traffic Volume'].max()) * 0.3 +
            (1 - area_stats['Average Speed (km/h)'] / area_stats['Average Speed (km/h)'].max()) * 0.3
        )
        
        area_stats = area_stats.sort_values('congestion_score', ascending=False)
        top_10 = area_stats.head(10)
        
        hotspots = []
        for i, (_, row) in enumerate(top_10.iterrows()):
            hotspots.append({
                "rank": i + 1,
                "area": row['Area Name'],
                "road": row['Road/Intersection Name'],
                "avg_traffic": round(float(row['Traffic Volume']), 1),
                "avg_speed": round(float(row['Average Speed (km/h)']), 1),
                "congestion_index": round(float(row['cong_num']), 2),
                "congestion_score": round(float(row['congestion_score']), 3),
                "capacity_utilization": round(float(row['Road Capacity Utilization (%)']), 1),
                "incident_count": round(float(row['Incident Reports']), 1),
                "lat": float(row['Latitude']),
                "lng": float(row['Longitude']),
                "severity": "Severe" if row['congestion_score'] > 0.7 else "High" if row['congestion_score'] > 0.5 else "Moderate"
            })
        
        # Peak congestion times per hotspot area
        peak_times = []
        for area in top_10['Area Name'].unique()[:5]:
            area_df = df[df['Area Name'] == area]
            if 'hour' in area_df.columns:
                peak_hour = int(area_df.groupby('hour')['Traffic Volume'].mean().idxmax())
                peak_times.append({"area": area, "peak_hour": peak_hour, "peak_label": f"{peak_hour:02d}:00"})
        
        return {
            "success": True,
            "hotspots": hotspots,
            "peak_times": peak_times,
            "total_analyzed": len(area_stats)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/map")
async def get_hotspot_map_data():
    try:
        df = load_dataset()
        congestion_map = {'Free Flow': 0, 'Low': 1, 'Moderate': 2, 'High': 3, 'Severe': 4}
        df['cong_num'] = df['Congestion Level'].map(congestion_map).fillna(2)
        
        map_data = df.groupby(['Area Name', 'Road/Intersection Name']).agg({
            'Traffic Volume': 'mean',
            'cong_num': 'mean',
            'Average Speed (km/h)': 'mean',
            'Latitude': 'first',
            'Longitude': 'first'
        }).reset_index()
        
        color_map = {0: '#22C55E', 1: '#84CC16', 2: '#FACC15', 3: '#F97316', 4: '#EF4444'}
        
        result = [
            {
                "lat": float(row['Latitude']),
                "lng": float(row['Longitude']),
                "area": row['Area Name'],
                "road": row['Road/Intersection Name'],
                "intensity": round(float(row['cong_num']), 2),
                "traffic_volume": round(float(row['Traffic Volume']), 1),
                "avg_speed": round(float(row['Average Speed (km/h)']), 1),
                "color": color_map.get(min(4, max(0, round(row['cong_num']))), '#FACC15'),
                "congestion": 'Severe' if row['cong_num'] >= 3.5 else 'High' if row['cong_num'] >= 2.5 else 'Moderate' if row['cong_num'] >= 1.5 else 'Low' if row['cong_num'] >= 0.5 else 'Free Flow'
            }
            for _, row in map_data.iterrows()
        ]
        return {"success": True, "map_data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
