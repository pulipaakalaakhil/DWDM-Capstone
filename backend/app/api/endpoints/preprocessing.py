from fastapi import APIRouter, HTTPException, Body
import pandas as pd
import numpy as np
from pathlib import Path
from app.services.data_service import load_dataset, PROCESSED_PATH

router = APIRouter()

@router.get("/status")
async def preprocessing_status():
    try:
        df = load_dataset()
        numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        
        # Outlier detection (IQR method)
        outliers = {}
        for col in numeric_cols:
            Q1 = df[col].quantile(0.25)
            Q3 = df[col].quantile(0.75)
            IQR = Q3 - Q1
            n_outliers = int(((df[col] < Q1 - 1.5 * IQR) | (df[col] > Q3 + 1.5 * IQR)).sum())
            outliers[col] = n_outliers
        
        return {
            "success": True,
            "total_records": len(df),
            "missing_values": int(df.isnull().sum().sum()),
            "missing_by_column": {col: int(cnt) for col, cnt in df.isnull().sum().items() if cnt > 0},
            "duplicate_records": int(df.duplicated().sum()),
            "outliers_by_column": outliers,
            "numeric_columns": numeric_cols,
            "categorical_columns": df.select_dtypes(include=['object']).columns.tolist(),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/run")
async def run_preprocessing(options: dict = Body(default={})):
    try:
        df = load_dataset()
        log = []
        before_records = len(df)
        before_missing = int(df.isnull().sum().sum())
        before_duplicates = int(df.duplicated().sum())
        
        # 1. Remove duplicates
        df = df.drop_duplicates()
        removed_dups = before_records - len(df)
        log.append(f"Removed {removed_dups} duplicate records")
        
        # 2. Handle missing values
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        for col in numeric_cols:
            if df[col].isnull().sum() > 0:
                strategy = options.get('missing_strategy', 'median')
                if strategy == 'mean':
                    df[col].fillna(df[col].mean(), inplace=True)
                elif strategy == 'zero':
                    df[col].fillna(0, inplace=True)
                else:
                    df[col].fillna(df[col].median(), inplace=True)
        
        cat_cols = df.select_dtypes(include=['object']).columns
        for col in cat_cols:
            if df[col].isnull().sum() > 0:
                df[col].fillna(df[col].mode()[0] if len(df[col].mode()) > 0 else 'Unknown', inplace=True)
        
        log.append(f"Filled missing values using {options.get('missing_strategy', 'median')}")
        
        # 3. Outlier handling (cap at IQR bounds)
        if options.get('handle_outliers', True):
            for col in ['Traffic Volume', 'Average Speed (km/h)', 'Travel Time Index']:
                if col in df.columns:
                    Q1 = df[col].quantile(0.25)
                    Q3 = df[col].quantile(0.75)
                    IQR = Q3 - Q1
                    lower = Q1 - 1.5 * IQR
                    upper = Q3 + 1.5 * IQR
                    df[col] = df[col].clip(lower, upper)
            log.append("Outliers capped using IQR method")
        
        # 4. Feature engineering
        if 'Date' in df.columns and 'Time' in df.columns:
            df['datetime'] = pd.to_datetime(df['Date'] + ' ' + df['Time'], errors='coerce')
            df['hour'] = df['datetime'].dt.hour
            df['day_of_week'] = df['datetime'].dt.dayofweek
            df['month'] = df['datetime'].dt.month
            df['year'] = df['datetime'].dt.year
            df['day_name'] = df['datetime'].dt.day_name()
            df['is_weekend'] = df['day_of_week'] >= 5
            df['is_peak_hour'] = df['hour'].isin([7, 8, 9, 17, 18, 19, 20])
            df['season'] = df['month'].map({
                12: 'Winter', 1: 'Winter', 2: 'Winter',
                3: 'Spring', 4: 'Spring', 5: 'Spring',
                6: 'Summer', 7: 'Summer', 8: 'Summer',
                9: 'Autumn', 10: 'Autumn', 11: 'Autumn'
            })
            log.append("Feature engineering: extracted hour, day, month, week flags, season")
        
        # 5. Congestion encoding
        congestion_map = {'Free Flow': 0, 'Low': 1, 'Moderate': 2, 'High': 3, 'Severe': 4}
        if 'Congestion Level' in df.columns:
            df['congestion_encoded'] = df['Congestion Level'].map(congestion_map)
            log.append("Encoded congestion levels as numeric (0-4)")
        
        # 6. Normalize key numeric columns
        if options.get('normalize', False):
            from sklearn.preprocessing import MinMaxScaler
            scaler = MinMaxScaler()
            cols_to_scale = ['Traffic Volume', 'Average Speed (km/h)']
            cols_present = [c for c in cols_to_scale if c in df.columns]
            if cols_present:
                df[[c + '_normalized' for c in cols_present]] = scaler.fit_transform(df[cols_present])
                log.append(f"Normalized columns: {cols_present}")
        
        # Save processed dataset
        import os
        os.makedirs(PROCESSED_PATH.parent, exist_ok=True)
        df.to_csv(PROCESSED_PATH, index=False)
        
        return {
            "success": True,
            "log": log,
            "before": {
                "records": before_records,
                "missing_values": before_missing,
                "duplicates": before_duplicates
            },
            "after": {
                "records": len(df),
                "missing_values": int(df.isnull().sum().sum()),
                "duplicates": 0,
                "columns": len(df.columns)
            },
            "message": f"Preprocessing complete. {len(log)} steps applied."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/outliers")
async def get_outlier_analysis():
    try:
        df = load_dataset()
        numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        result = {}
        for col in numeric_cols[:8]:
            Q1 = df[col].quantile(0.25)
            Q3 = df[col].quantile(0.75)
            IQR = Q3 - Q1
            lower = Q1 - 1.5 * IQR
            upper = Q3 + 1.5 * IQR
            outlier_mask = (df[col] < lower) | (df[col] > upper)
            result[col] = {
                "n_outliers": int(outlier_mask.sum()),
                "lower_bound": round(float(lower), 3),
                "upper_bound": round(float(upper), 3),
                "Q1": round(float(Q1), 3),
                "Q3": round(float(Q3), 3),
                "IQR": round(float(IQR), 3),
                "pct": round(float(outlier_mask.mean() * 100), 2)
            }
        return {"success": True, "outliers": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
