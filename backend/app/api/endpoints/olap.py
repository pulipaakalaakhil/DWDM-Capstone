from fastapi import APIRouter, HTTPException, Query
import pandas as pd
import numpy as np
from app.services.data_service import load_dataset

router = APIRouter()

def to_py(val):
    if isinstance(val, (np.integer,)): return int(val)
    if isinstance(val, (np.floating,)): return float(val)
    if isinstance(val, dict): return {k: to_py(v) for k, v in val.items()}
    if isinstance(val, list): return [to_py(v) for v in val]
    return val

@router.get("/rollup")
async def rollup(
    from_level: str = Query("hourly"),  # hourly, daily, monthly
    measure: str = Query("Traffic Volume")
):
    try:
        df = load_dataset()
        
        if from_level == "hourly" and 'hour' in df.columns:
            grouped = df.groupby('hour')[measure].agg(['mean', 'sum', 'count']).reset_index()
            result = [{"period": f"{int(r['hour']):02d}:00", "avg": round(float(r['mean']),1), "sum": round(float(r['sum']),1), "count": int(r['count'])} for _, r in grouped.iterrows()]
            label = "Hourly"
        elif from_level == "daily" and 'day_of_week' in df.columns:
            day_map = {0:'Mon',1:'Tue',2:'Wed',3:'Thu',4:'Fri',5:'Sat',6:'Sun'}
            grouped = df.groupby('day_of_week')[measure].agg(['mean','sum','count']).reset_index()
            result = [{"period": day_map.get(int(r['day_of_week']),''), "avg": round(float(r['mean']),1), "sum": round(float(r['sum']),1), "count": int(r['count'])} for _, r in grouped.iterrows()]
            label = "Daily"
        elif from_level == "monthly" and 'month' in df.columns:
            m_map = {1:'Jan',2:'Feb',3:'Mar',4:'Apr',5:'May',6:'Jun',7:'Jul',8:'Aug',9:'Sep',10:'Oct',11:'Nov',12:'Dec'}
            grouped = df.groupby('month')[measure].agg(['mean','sum','count']).reset_index()
            result = [{"period": m_map.get(int(r['month']),''), "avg": round(float(r['mean']),1), "sum": round(float(r['sum']),1), "count": int(r['count'])} for _, r in grouped.iterrows()]
            label = "Monthly"
        elif from_level == "yearly" and 'year' in df.columns:
            grouped = df.groupby('year')[measure].agg(['mean','sum','count']).reset_index()
            result = [{"period": str(int(r['year'])), "avg": round(float(r['mean']),1), "sum": round(float(r['sum']),1), "count": int(r['count'])} for _, r in grouped.iterrows()]
            label = "Yearly"
        else:
            grouped = df.groupby('month' if 'month' in df.columns else 'hour')[measure].mean().reset_index()
            result = [{"period": str(r.iloc[0]), "avg": round(float(r.iloc[1]),1)} for _, r in grouped.iterrows()]
            label = "Aggregated"
        
        return {"success": True, "operation": "Roll-Up", "level": label, "measure": measure, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/drilldown")
async def drilldown(
    area: str = Query(None),
    road: str = Query(None),
    measure: str = Query("Traffic Volume")
):
    try:
        df = load_dataset()
        
        if road and 'Road/Intersection Name' in df.columns:
            df = df[df['Road/Intersection Name'] == road]
            label = f"Road: {road}"
        elif area and 'Area Name' in df.columns:
            df = df[df['Area Name'] == area]
            label = f"Area: {area}"
        else:
            label = "All Areas"
        
        if 'hour' in df.columns:
            grouped = df.groupby('hour')[measure].agg(['mean','sum','count']).reset_index()
            result = [{"period": f"{int(r['hour']):02d}:00", "avg": round(float(r['mean']),1), "sum": round(float(r['sum']),1), "count": int(r['count'])} for _, r in grouped.iterrows()]
        else:
            result = []
        
        roads_in_area = df['Road/Intersection Name'].unique().tolist() if area else []
        
        return {
            "success": True,
            "operation": "Drill-Down",
            "label": label,
            "measure": measure,
            "data": result,
            "sub_dimensions": roads_in_area
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/slice")
async def slice_cube(
    dimension: str = Query("hour"),
    value: str = Query("8"),
    measure: str = Query("Traffic Volume")
):
    try:
        df = load_dataset()
        
        dim_col_map = {
            "hour": "hour",
            "day": "day_of_week",
            "month": "month",
            "area": "Area Name",
            "congestion": "Congestion Level",
            "weather": "Weather Conditions"
        }
        
        col = dim_col_map.get(dimension, dimension)
        if col not in df.columns:
            raise HTTPException(status_code=400, detail=f"Dimension {dimension} not found")
        
        try:
            if df[col].dtype in [int, float, 'int64', 'float64']:
                df_slice = df[df[col] == float(value)]
            else:
                df_slice = df[df[col] == value]
        except:
            df_slice = df[df[col].astype(str) == value]
        
        # Aggregate result across other dimensions
        if 'Area Name' in df_slice.columns:
            grouped = df_slice.groupby('Area Name')[measure].agg(['mean','sum','count']).reset_index()
            result = [{"area": r['Area Name'], "avg": round(float(r['mean']),1), "sum": round(float(r['sum']),1), "count": int(r['count'])} for _, r in grouped.iterrows()]
        else:
            result = [{"total": round(float(df_slice[measure].mean()),1), "count": len(df_slice)}]
        
        return {
            "success": True,
            "operation": "Slice",
            "dimension": dimension,
            "value": value,
            "measure": measure,
            "data": result,
            "records_in_slice": len(df_slice)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/dice")
async def dice_cube(
    area: str = Query(None),
    hour_start: int = Query(None),
    hour_end: int = Query(None),
    congestion: str = Query(None),
    measure: str = Query("Traffic Volume")
):
    try:
        df = load_dataset()
        
        if area:
            df = df[df['Area Name'] == area]
        if hour_start is not None and 'hour' in df.columns:
            df = df[df['hour'] >= hour_start]
        if hour_end is not None and 'hour' in df.columns:
            df = df[df['hour'] <= hour_end]
        if congestion:
            df = df[df['Congestion Level'] == congestion]
        
        if 'hour' in df.columns:
            grouped = df.groupby('hour')[measure].agg(['mean','count']).reset_index()
            result = [{"hour": int(r['hour']), "label": f"{int(r['hour']):02d}:00", "avg": round(float(r['mean']),1), "count": int(r['count'])} for _, r in grouped.iterrows()]
        else:
            result = []
        
        return {
            "success": True,
            "operation": "Dice",
            "filters": {"area": area, "hour_range": f"{hour_start}-{hour_end}", "congestion": congestion},
            "measure": measure,
            "data": result,
            "records": len(df)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/pivot")
async def pivot_cube(
    row_dim: str = Query("Area Name"),
    col_dim: str = Query("Congestion Level"),
    measure: str = Query("Traffic Volume"),
    agg: str = Query("mean")
):
    try:
        df = load_dataset()
        
        if row_dim not in df.columns or col_dim not in df.columns:
            raise HTTPException(status_code=400, detail="Invalid dimensions")
        
        pivot = df.pivot_table(
            values=measure,
            index=row_dim,
            columns=col_dim,
            aggfunc=agg,
            fill_value=0
        ).round(1)
        
        rows = []
        for idx, row in pivot.iterrows():
            row_data = {"dimension": str(idx)}
            for col in pivot.columns:
                row_data[str(col)] = float(row[col])
            rows.append(row_data)
        
        return {
            "success": True,
            "operation": "Pivot",
            "row_dimension": row_dim,
            "col_dimension": col_dim,
            "measure": measure,
            "aggregation": agg,
            "data": rows,
            "columns": list(pivot.columns.astype(str))
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/cube-data")
async def get_cube_data():
    """Returns 3D cube data for the OLAP cube visualization."""
    try:
        df = load_dataset()
        
        hours = [0,6,8,12,18,20,22]
        areas = df['Area Name'].unique()[:5].tolist()
        congestion_levels = ['Free Flow','Low','Moderate','High','Severe']
        congestion_map = {c: i for i, c in enumerate(congestion_levels)}
        
        cells = []
        for h in hours:
            for area in areas:
                sub = df[(df['hour'] == h) & (df['Area Name'] == area)] if 'hour' in df.columns else pd.DataFrame()
                if len(sub) == 0:
                    continue
                cong_mode = sub['Congestion Level'].mode()[0] if len(sub) > 0 else 'Low'
                cells.append({
                    "x": h,
                    "y": areas.index(area),
                    "z": congestion_map.get(cong_mode, 1),
                    "hour": h,
                    "hour_label": f"{h:02d}:00",
                    "area": area,
                    "congestion": cong_mode,
                    "traffic_volume": round(float(sub['Traffic Volume'].mean()), 1),
                    "avg_speed": round(float(sub['Average Speed (km/h)'].mean()), 1),
                    "count": len(sub)
                })
        
        return {
            "success": True,
            "cells": cells,
            "x_labels": [f"{h:02d}:00" for h in hours],
            "y_labels": areas,
            "z_labels": congestion_levels,
            "x_dim": "Time (Hour)",
            "y_dim": "Location (Area)",
            "z_dim": "Congestion Level"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
