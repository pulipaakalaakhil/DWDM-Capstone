from fastapi import APIRouter, UploadFile, File, HTTPException, Query
from fastapi.responses import FileResponse
import pandas as pd
import numpy as np
import json
import os
import shutil
from pathlib import Path
from app.services.data_service import load_dataset, load_processed_dataset, get_summary_stats, DATA_PATH, PROCESSED_PATH

router = APIRouter()

@router.get("/summary")
async def get_dataset_summary():
    try:
        df = load_dataset()
        stats = get_summary_stats(df)
        return {"success": True, "data": stats}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/preview")
async def preview_dataset(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=500),
    search: str = Query(None),
    area: str = Query(None),
    congestion: str = Query(None)
):
    try:
        df = load_dataset()
        
        if search:
            mask = df.apply(lambda row: row.astype(str).str.contains(search, case=False).any(), axis=1)
            df = df[mask]
        if area:
            df = df[df['Area Name'] == area]
        if congestion:
            df = df[df['Congestion Level'] == congestion]
        
        total = len(df)
        start = (page - 1) * page_size
        end = start + page_size
        page_df = df.iloc[start:end]
        
        # Convert to serializable format
        records = []
        for _, row in page_df.iterrows():
            record = {}
            for col, val in row.items():
                if pd.isna(val) if not isinstance(val, (list, dict)) else False:
                    record[col] = None
                elif isinstance(val, (np.integer,)):
                    record[col] = int(val)
                elif isinstance(val, (np.floating,)):
                    record[col] = float(val)
                elif isinstance(val, (np.bool_,)):
                    record[col] = bool(val)
                else:
                    record[col] = str(val) if not isinstance(val, str) else val
            records.append(record)
        
        return {
            "success": True,
            "data": records,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": (total + page_size - 1) // page_size
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/columns")
async def get_columns():
    try:
        df = load_dataset()
        cols = []
        for col in df.columns:
            dtype = str(df[col].dtype)
            non_null = int(df[col].count())
            unique = int(df[col].nunique())
            missing = int(df[col].isnull().sum())
            sample = df[col].dropna().head(3).tolist()
            sample = [str(s) for s in sample]
            cols.append({
                "name": col,
                "dtype": dtype,
                "non_null": non_null,
                "unique": unique,
                "missing": missing,
                "missing_pct": round(missing / len(df) * 100, 2),
                "sample": sample
            })
        return {"success": True, "columns": cols, "total_rows": len(df)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/statistics")
async def get_statistics():
    try:
        df = load_dataset()
        numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        stats = {}
        for col in numeric_cols:
            s = df[col].describe()
            stats[col] = {
                "count": float(s['count']),
                "mean": round(float(s['mean']), 3),
                "std": round(float(s['std']), 3),
                "min": round(float(s['min']), 3),
                "q25": round(float(s['25%']), 3),
                "median": round(float(s['50%']), 3),
                "q75": round(float(s['75%']), 3),
                "max": round(float(s['max']), 3),
            }
        return {"success": True, "statistics": stats}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/filters")
async def get_filter_options():
    try:
        df = load_dataset()
        return {
            "success": True,
            "areas": sorted(df['Area Name'].unique().tolist()) if 'Area Name' in df.columns else [],
            "roads": sorted(df['Road/Intersection Name'].unique().tolist()) if 'Road/Intersection Name' in df.columns else [],
            "congestion_levels": sorted(df['Congestion Level'].unique().tolist()) if 'Congestion Level' in df.columns else [],
            "weather": sorted(df['Weather Conditions'].unique().tolist()) if 'Weather Conditions' in df.columns else [],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/upload")
async def upload_dataset(file: UploadFile = File(...)):
    try:
        os.makedirs(DATA_PATH.parent, exist_ok=True)
        with open(DATA_PATH, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        if file.filename.endswith('.xlsx') or file.filename.endswith('.xls'):
            df = pd.read_excel(DATA_PATH)
            df.to_csv(DATA_PATH, index=False)
        
        df = pd.read_csv(DATA_PATH)
        return {
            "success": True,
            "message": f"Dataset uploaded: {len(df)} records, {len(df.columns)} columns",
            "columns": list(df.columns),
            "rows": len(df)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
