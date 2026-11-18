from fastapi import APIRouter, HTTPException, Query
import pandas as pd
import numpy as np
from app.services.data_service import load_dataset

router = APIRouter()

def safe_list(lst):
    """Convert numpy types to Python native for JSON serialization."""
    result = []
    for item in lst:
        if isinstance(item, (np.integer,)):
            result.append(int(item))
        elif isinstance(item, (np.floating,)):
            result.append(float(item))
        elif isinstance(item, (np.bool_,)):
            result.append(bool(item))
        else:
            result.append(item)
    return result

@router.get("/traffic")
async def get_traffic_analytics(
    area: str = Query(None),
    congestion: str = Query(None),
    start_date: str = Query(None),
    end_date: str = Query(None),
    granularity: str = Query("hourly")
):
    try:
        df = load_dataset()
        
        if area:
            df = df[df['Area Name'] == area]
        if congestion:
            df = df[df['Congestion Level'] == congestion]
        if start_date:
            df = df[df['Date'] >= start_date]
        if end_date:
            df = df[df['Date'] <= end_date]
        
        # Time series traffic volume
        if granularity == "hourly" and 'hour' in df.columns:
            grouped = df.groupby('hour').agg({
                'Traffic Volume': 'mean',
                'Average Speed (km/h)': 'mean'
            }).reset_index()
            time_series = [
                {
                    "period": f"{int(row['hour']):02d}:00",
                    "traffic_volume": round(float(row['Traffic Volume']), 1),
                    "avg_speed": round(float(row['Average Speed (km/h)']), 1)
                }
                for _, row in grouped.iterrows()
            ]
        elif granularity == "daily" and 'day_name' in df.columns:
            order = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
            grouped = df.groupby('day_name').agg({
                'Traffic Volume': 'mean',
                'Average Speed (km/h)': 'mean'
            }).reset_index()
            grouped['day_order'] = grouped['day_name'].map({d: i for i, d in enumerate(order)})
            grouped = grouped.sort_values('day_order')
            time_series = [
                {
                    "period": row['day_name'],
                    "traffic_volume": round(float(row['Traffic Volume']), 1),
                    "avg_speed": round(float(row['Average Speed (km/h)']), 1)
                }
                for _, row in grouped.iterrows()
            ]
        elif granularity == "monthly" and 'month' in df.columns:
            month_names = {1:'Jan',2:'Feb',3:'Mar',4:'Apr',5:'May',6:'Jun',
                          7:'Jul',8:'Aug',9:'Sep',10:'Oct',11:'Nov',12:'Dec'}
            grouped = df.groupby('month').agg({
                'Traffic Volume': 'mean',
                'Average Speed (km/h)': 'mean'
            }).reset_index()
            time_series = [
                {
                    "period": month_names.get(int(row['month']), str(row['month'])),
                    "traffic_volume": round(float(row['Traffic Volume']), 1),
                    "avg_speed": round(float(row['Average Speed (km/h)']), 1)
                }
                for _, row in grouped.iterrows()
            ]
        else:
            grouped = df.groupby('hour').agg({'Traffic Volume': 'mean', 'Average Speed (km/h)': 'mean'}).reset_index()
            time_series = [{"period": str(row['hour']), "traffic_volume": float(row['Traffic Volume']), "avg_speed": float(row['Average Speed (km/h)'])} for _, row in grouped.iterrows()]
        
        # Congestion distribution
        congestion_dist = df['Congestion Level'].value_counts().to_dict()
        congestion_dist = {k: int(v) for k, v in congestion_dist.items()}
        
        # Area traffic
        area_traffic = df.groupby('Area Name').agg({
            'Traffic Volume': 'mean',
            'Average Speed (km/h)': 'mean',
            'Road Capacity Utilization (%)': 'mean'
        }).reset_index().sort_values('Traffic Volume', ascending=False)
        
        area_data = [
            {
                "area": row['Area Name'],
                "traffic_volume": round(float(row['Traffic Volume']), 1),
                "avg_speed": round(float(row['Average Speed (km/h)']), 1),
                "capacity_utilization": round(float(row['Road Capacity Utilization (%)']), 1)
            }
            for _, row in area_traffic.iterrows()
        ]
        
        # Weekday vs Weekend
        if 'is_weekend' in df.columns:
            weekday_df = df[~df['is_weekend']]
            weekend_df = df[df['is_weekend']]
            weekday_hourly = weekday_df.groupby('hour')['Traffic Volume'].mean().reset_index()
            weekend_hourly = weekend_df.groupby('hour')['Traffic Volume'].mean().reset_index()
            weekday_weekend = [
                {
                    "hour": int(row['hour']),
                    "weekday": round(float(row['Traffic Volume']), 1),
                    "weekend": round(float(weekend_hourly[weekend_hourly['hour'] == row['hour']]['Traffic Volume'].values[0]), 1) if len(weekend_hourly[weekend_hourly['hour'] == row['hour']]) > 0 else 0
                }
                for _, row in weekday_hourly.iterrows()
            ]
        else:
            weekday_weekend = []
        
        # Weather analysis
        weather_data = []
        if 'Weather Conditions' in df.columns:
            weather_grp = df.groupby('Weather Conditions').agg({'Traffic Volume': 'mean', 'Average Speed (km/h)': 'mean'}).reset_index()
            weather_data = [{"weather": row['Weather Conditions'], "traffic_volume": round(float(row['Traffic Volume']),1), "avg_speed": round(float(row['Average Speed (km/h)']),1)} for _, row in weather_grp.iterrows()]
        
        return {
            "success": True,
            "time_series": time_series,
            "congestion_distribution": congestion_dist,
            "area_data": area_data,
            "weekday_weekend": weekday_weekend,
            "weather_data": weather_data,
            "total_records": len(df)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/congestion")
async def get_congestion_analytics():
    try:
        df = load_dataset()
        congestion_map = {'Free Flow': 0, 'Low': 1, 'Moderate': 2, 'High': 3, 'Severe': 4}
        df['cong_num'] = df['Congestion Level'].map(congestion_map).fillna(2)
        
        # Congestion by hour
        hourly = df.groupby('hour').agg({
            'cong_num': 'mean',
            'Traffic Volume': 'mean',
            'Average Speed (km/h)': 'mean'
        }).reset_index()
        
        hourly_data = [
            {
                "hour": int(row['hour']),
                "congestion_index": round(float(row['cong_num']), 3),
                "traffic_volume": round(float(row['Traffic Volume']), 1),
                "avg_speed": round(float(row['Average Speed (km/h)']), 1)
            }
            for _, row in hourly.iterrows()
        ]
        
        # Top congested areas
        area_cong = df.groupby('Area Name').agg({'cong_num': 'mean', 'Traffic Volume': 'mean'}).reset_index()
        area_cong = area_cong.sort_values('cong_num', ascending=False)
        top_areas = [
            {"area": row['Area Name'], "congestion_index": round(float(row['cong_num']), 3), "traffic_volume": round(float(row['Traffic Volume']), 1)}
            for _, row in area_cong.iterrows()
        ]
        
        # Monthly congestion trend
        monthly = df.groupby('month')['cong_num'].mean().reset_index()
        month_names = {1:'Jan',2:'Feb',3:'Mar',4:'Apr',5:'May',6:'Jun',7:'Jul',8:'Aug',9:'Sep',10:'Oct',11:'Nov',12:'Dec'}
        monthly_data = [{"month": month_names.get(int(r['month']), ''), "congestion": round(float(r['cong_num']), 3)} for _, r in monthly.iterrows()]
        
        return {
            "success": True,
            "hourly_congestion": hourly_data,
            "top_congested_areas": top_areas,
            "monthly_trend": monthly_data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/heatmap")
async def get_heatmap_data():
    try:
        df = load_dataset()
        
        if 'hour' not in df.columns or 'day_of_week' not in df.columns:
            raise HTTPException(status_code=400, detail="Time columns not available")
        
        pivot = df.pivot_table(
            values='Traffic Volume',
            index='hour',
            columns='day_of_week',
            aggfunc='mean'
        ).fillna(0)
        
        day_map = {0:'Mon', 1:'Tue', 2:'Wed', 3:'Thu', 4:'Fri', 5:'Sat', 6:'Sun'}
        heatmap = []
        for hour in range(24):
            row = {"hour": hour}
            for day in range(7):
                val = float(pivot.loc[hour, day]) if hour in pivot.index and day in pivot.columns else 0
                row[day_map[day]] = round(val, 1)
            heatmap.append(row)
        
        return {"success": True, "heatmap": heatmap}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/locations")
async def get_location_data():
    try:
        df = load_dataset()
        if 'Latitude' not in df.columns or 'Longitude' not in df.columns:
            raise HTTPException(status_code=400, detail="Location data not available")
        
        location_data = df.groupby(['Area Name', 'Road/Intersection Name']).agg({
            'Traffic Volume': 'mean',
            'Average Speed (km/h)': 'mean',
            'Congestion Level': lambda x: x.mode()[0] if len(x) > 0 else 'Unknown',
            'Latitude': 'first',
            'Longitude': 'first'
        }).reset_index()
        
        locations = []
        for _, row in location_data.iterrows():
            locations.append({
                "area": row['Area Name'],
                "road": row['Road/Intersection Name'],
                "lat": float(row['Latitude']),
                "lng": float(row['Longitude']),
                "traffic_volume": round(float(row['Traffic Volume']), 1),
                "avg_speed": round(float(row['Average Speed (km/h)']), 1),
                "congestion": row['Congestion Level']
            })
        
        return {"success": True, "locations": locations}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
