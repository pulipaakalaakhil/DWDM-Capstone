import pandas as pd
import numpy as np
import os
import json
from pathlib import Path

DATA_PATH = Path(__file__).parent.parent.parent.parent / "data" / "raw" / "bangalore_traffic.csv"
PROCESSED_PATH = Path(__file__).parent.parent.parent.parent / "data" / "processed" / "processed_traffic.csv"

# Authentic Bangalore Geographic Coordinates for each corridor
BANGALORE_CORRIDORS = {
    ('Bannerghatta Road', 'Bannerghatta National Park'): (12.8000, 77.5770),
    ('Bannerghatta Road', 'Gottigere'): (12.8620, 77.5840),
    ('Bannerghatta Road', 'JP Nagar Junction'): (12.9080, 77.5950),
    ('Electronic City', 'EC Phase 2'): (12.8398, 77.6770),
    ('Electronic City', 'Electronic City Phase 1'): (12.8452, 77.6602),
    ('Electronic City', 'Hosur Road'): (12.8500, 77.6620),
    ('HSR Layout', '27th Main Road'): (12.9121, 77.6446),
    ('HSR Layout', 'BDA Junction'): (12.9116, 77.6389),
    ('HSR Layout', 'Sector 1 Junction'): (12.9160, 77.6510),
    ('Hebbal', 'Bellary Road'): (13.0280, 77.5910),
    ('Hebbal', 'Hebbal Flyover'): (13.0358, 77.5970),
    ('Hebbal', 'KIAL Road Junction'): (13.0450, 77.5990),
    ('Indiranagar', '100 Feet Road'): (12.9719, 77.6412),
    ('Indiranagar', 'CMH Road Junction'): (12.9783, 77.6443),
    ('Indiranagar', 'Defense Colony Signal'): (12.9750, 77.6390),
    ('Jayanagar', '11th Main Road'): (12.9250, 77.5870),
    ('Jayanagar', '4th Block Junction'): (12.9298, 77.5833),
    ('Jayanagar', 'South End Circle'): (12.9372, 77.5804),
    ('Koramangala', '80 Feet Road'): (12.9352, 77.6245),
    ('Koramangala', 'BDA Complex Junction'): (12.9310, 77.6225),
    ('Koramangala', 'Sony World Signal'): (12.9345, 77.6288),
    ('MG Road', 'Brigade Road Junction'): (12.9738, 77.6074),
    ('MG Road', 'MG Road Metro'): (12.9756, 77.6066),
    ('MG Road', 'Trinity Circle'): (12.9724, 77.6186),
    ('Marathahalli', 'Doddanakundi'): (12.9714, 77.6974),
    ('Marathahalli', 'Marathahalli Bridge'): (12.9569, 77.7011),
    ('Marathahalli', 'ORR Marathahalli'): (12.9510, 77.6990),
    ('Old Airport Road', 'Domlur Junction'): (12.9610, 77.6380),
    ('Old Airport Road', 'HAL Airport Road'): (12.9550, 77.6670),
    ('Old Airport Road', 'Kodihalli'): (12.9600, 77.6510),
    ('Outer Ring Road', 'Bellandur Junction'): (12.9304, 77.6784),
    ('Outer Ring Road', 'Haralur Road'): (12.9120, 77.6650),
    ('Outer Ring Road', 'Sarjapur ORR'): (12.9230, 77.6720),
    ('Rajajinagar', 'Chord Road Junction'): (12.9915, 77.5526),
    ('Rajajinagar', 'Palace Road'): (13.0030, 77.5620),
    ('Rajajinagar', 'Rajajinagar Complex'): (12.9980, 77.5550),
    ('Silk Board', 'BTM Layout Junction'): (12.9165, 77.6101),
    ('Silk Board', 'Madiwala'): (12.9226, 77.6174),
    ('Silk Board', 'Silk Board Junction'): (12.9176, 77.6238),
    ('Whitefield', 'ITPL Main Road'): (12.9863, 77.7340),
    ('Whitefield', 'Varthur Road'): (12.9580, 77.7420),
    ('Whitefield', 'Whitefield Main Road'): (12.9698, 77.7499),
    ('Yeshwanthpur', 'Peenya Signal'): (13.0320, 77.5250),
    ('Yeshwanthpur', 'Tumkur Road Junction'): (13.0280, 77.5410),
    ('Yeshwanthpur', 'Yeshwanthpur Circle'): (13.0238, 77.5503)
}

_df_cache = None

def load_dataset(force_reload=False) -> pd.DataFrame:
    global _df_cache
    if _df_cache is not None and not force_reload:
        return _df_cache.copy()
    
    if not DATA_PATH.exists():
        raise FileNotFoundError(f"Dataset not found at {DATA_PATH}")
    
    df = pd.read_csv(DATA_PATH)
    df = _enrich_dataframe(df)
    _df_cache = df
    return df.copy()

def load_processed_dataset() -> pd.DataFrame:
    if PROCESSED_PATH.exists():
        return pd.read_csv(PROCESSED_PATH)
    return load_dataset()

def _enrich_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    if 'Date' in df.columns and 'Time' in df.columns:
        df['datetime'] = pd.to_datetime(df['Date'] + ' ' + df['Time'], format='%Y-%m-%d %H:%M:%S', errors='coerce')
        df['hour'] = df['datetime'].dt.hour
        df['day_of_week'] = df['datetime'].dt.dayofweek
        df['month'] = df['datetime'].dt.month
        df['year'] = df['datetime'].dt.year
        df['day_name'] = df['datetime'].dt.day_name()
        df['is_weekend'] = df['day_of_week'] >= 5
        df['is_peak_hour'] = df['hour'].isin([7, 8, 9, 17, 18, 19, 20])

    # Assign authentic corridor coordinates
    if 'Area Name' in df.columns and 'Road/Intersection Name' in df.columns:
        coords_series = list(zip(df['Area Name'], df['Road/Intersection Name']))
        mapped_lats = [BANGALORE_CORRIDORS.get(pair, (12.9716, 77.5946))[0] for pair in coords_series]
        mapped_lngs = [BANGALORE_CORRIDORS.get(pair, (12.9716, 77.5946))[1] for pair in coords_series]
        df['Latitude'] = mapped_lats
        df['Longitude'] = mapped_lngs

    return df

def get_summary_stats(df: pd.DataFrame) -> dict:
    congestion_map = {'Free Flow': 0, 'Low': 1, 'Moderate': 2, 'High': 3, 'Severe': 4}
    
    total_records = len(df)
    total_vehicles = int(df['Traffic Volume'].sum()) if 'Traffic Volume' in df.columns else 0
    avg_speed = float(df['Average Speed (km/h)'].mean()) if 'Average Speed (km/h)' in df.columns else 0
    avg_volume = float(df['Traffic Volume'].mean()) if 'Traffic Volume' in df.columns else 0
    
    if 'Congestion Level' in df.columns:
        df['congestion_numeric'] = df['Congestion Level'].map(congestion_map).fillna(2)
        congestion_index = float(df['congestion_numeric'].mean())
    else:
        congestion_index = 0
    
    peak_hour = None
    if 'hour' in df.columns and 'Traffic Volume' in df.columns:
        peak_hour = int(df.groupby('hour')['Traffic Volume'].mean().idxmax())
    
    return {
        "total_records": total_records,
        "total_vehicles": total_vehicles,
        "avg_speed": round(avg_speed, 2),
        "avg_volume": round(avg_volume, 2),
        "congestion_index": round(congestion_index, 2),
        "peak_hour": peak_hour,
        "missing_values": int(df.isnull().sum().sum()),
        "duplicate_records": int(df.duplicated().sum()),
        "areas": df['Area Name'].nunique() if 'Area Name' in df.columns else 0,
        "roads": df['Road/Intersection Name'].nunique() if 'Road/Intersection Name' in df.columns else 0,
    }
