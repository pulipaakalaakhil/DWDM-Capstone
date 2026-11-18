from fastapi import APIRouter, HTTPException, Body
import pandas as pd
import numpy as np
from app.services.data_service import load_dataset

router = APIRouter()

def to_py(val):
    if isinstance(val, (np.integer,)): return int(val)
    if isinstance(val, (np.floating,)): return float(val)
    if isinstance(val, (np.bool_,)): return bool(val)
    if isinstance(val, dict): return {k: to_py(v) for k, v in val.items()}
    if isinstance(val, list): return [to_py(v) for v in val]
    return val

@router.post("/clustering")
async def run_clustering(params: dict = Body(default={})):
    try:
        from sklearn.cluster import KMeans, DBSCAN
        from sklearn.preprocessing import StandardScaler
        
        df = load_dataset()
        algorithm = params.get('algorithm', 'kmeans')
        n_clusters = params.get('n_clusters', 5)
        
        features = ['Traffic Volume', 'Average Speed (km/h)', 'Road Capacity Utilization (%)']
        features = [f for f in features if f in df.columns]
        
        X = df[features].fillna(df[features].median())
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)
        
        if algorithm == 'kmeans':
            model = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
            labels = model.fit_predict(X_scaled)
            centers = scaler.inverse_transform(model.cluster_centers_)
            
            cluster_info = []
            for i in range(n_clusters):
                mask = labels == i
                cluster_df = df[mask]
                cluster_info.append({
                    "cluster_id": i,
                    "count": int(mask.sum()),
                    "avg_traffic": round(float(cluster_df['Traffic Volume'].mean()), 1),
                    "avg_speed": round(float(cluster_df['Average Speed (km/h)'].mean()), 1),
                    "dominant_congestion": cluster_df['Congestion Level'].mode()[0] if len(cluster_df) > 0 else 'Unknown',
                    "top_areas": cluster_df['Area Name'].value_counts().head(3).index.tolist(),
                    "center": {f: round(float(centers[i][j]), 2) for j, f in enumerate(features)}
                })
            
            # Elbow method data
            inertias = []
            for k in range(2, 11):
                km = KMeans(n_clusters=k, random_state=42, n_init=10)
                km.fit(X_scaled)
                inertias.append({"k": k, "inertia": float(km.inertia_)})
            
            # Scatter plot data (sample)
            sample_idx = np.random.choice(len(df), min(500, len(df)), replace=False)
            scatter_data = [
                {
                    "x": float(X.iloc[i]['Traffic Volume']),
                    "y": float(X.iloc[i]['Average Speed (km/h)']),
                    "cluster": int(labels[i]),
                    "area": df.iloc[i]['Area Name']
                }
                for i in sample_idx
            ]
            
            return {
                "success": True,
                "algorithm": "K-Means",
                "n_clusters": n_clusters,
                "clusters": cluster_info,
                "elbow_data": inertias,
                "scatter_data": scatter_data,
                "inertia": float(model.inertia_),
                "features_used": features
            }
        
        elif algorithm == 'dbscan':
            eps = params.get('eps', 0.5)
            min_samples = params.get('min_samples', 10)
            model = DBSCAN(eps=eps, min_samples=min_samples)
            labels = model.fit_predict(X_scaled)
            
            n_clusters_found = len(set(labels)) - (1 if -1 in labels else 0)
            n_noise = int((labels == -1).sum())
            
            cluster_info = []
            for label in sorted(set(labels)):
                mask = labels == label
                cluster_df = df[mask]
                cluster_info.append({
                    "cluster_id": int(label),
                    "label": "Noise" if label == -1 else f"Cluster {label}",
                    "count": int(mask.sum()),
                    "avg_traffic": round(float(cluster_df['Traffic Volume'].mean()), 1),
                    "avg_speed": round(float(cluster_df['Average Speed (km/h)'].mean()), 1),
                    "top_areas": cluster_df['Area Name'].value_counts().head(3).index.tolist()
                })
            
            sample_idx = np.random.choice(len(df), min(500, len(df)), replace=False)
            scatter_data = [
                {
                    "x": float(X.iloc[i]['Traffic Volume']),
                    "y": float(X.iloc[i]['Average Speed (km/h)']),
                    "cluster": int(labels[i]),
                    "area": df.iloc[i]['Area Name']
                }
                for i in sample_idx
            ]
            
            return {
                "success": True,
                "algorithm": "DBSCAN",
                "n_clusters_found": n_clusters_found,
                "n_noise": n_noise,
                "clusters": cluster_info,
                "scatter_data": scatter_data,
                "features_used": features
            }
        
        raise HTTPException(status_code=400, detail=f"Unknown algorithm: {algorithm}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/decision-tree")
async def run_decision_tree(params: dict = Body(default={})):
    try:
        from sklearn.tree import DecisionTreeClassifier, export_text
        from sklearn.model_selection import train_test_split
        from sklearn.metrics import classification_report, accuracy_score, confusion_matrix
        from sklearn.preprocessing import LabelEncoder
        
        df = load_dataset()
        congestion_map = {'Free Flow': 0, 'Low': 1, 'Moderate': 2, 'High': 3, 'Severe': 4}
        df['target'] = df['Congestion Level'].map(congestion_map)
        df = df.dropna(subset=['target'])
        
        feature_cols = ['Traffic Volume', 'Average Speed (km/h)', 'Travel Time Index',
                       'Road Capacity Utilization (%)', 'Incident Reports']
        if 'hour' in df.columns: feature_cols.append('hour')
        if 'day_of_week' in df.columns: feature_cols.append('day_of_week')
        feature_cols = [f for f in feature_cols if f in df.columns]
        
        X = df[feature_cols].fillna(df[feature_cols].median())
        y = df['target'].astype(int)
        
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        max_depth = params.get('max_depth', 8)
        model = DecisionTreeClassifier(max_depth=max_depth, random_state=42)
        model.fit(X_train, y_train)
        
        y_pred = model.predict(X_test)
        acc = float(accuracy_score(y_test, y_pred))
        report = classification_report(y_test, y_pred, output_dict=True, zero_division=0)
        cm = confusion_matrix(y_test, y_pred).tolist()
        
        feature_importance = [
            {"feature": f, "importance": round(float(imp), 4)}
            for f, imp in zip(feature_cols, model.feature_importances_)
        ]
        feature_importance.sort(key=lambda x: x['importance'], reverse=True)
        
        return {
            "success": True,
            "algorithm": "Decision Tree",
            "accuracy": round(acc, 4),
            "max_depth": max_depth,
            "feature_importance": feature_importance,
            "confusion_matrix": cm,
            "classification_report": to_py(report),
            "tree_text": export_text(model, feature_names=feature_cols, max_depth=4),
            "features_used": feature_cols
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/random-forest")
async def run_random_forest(params: dict = Body(default={})):
    try:
        from sklearn.ensemble import RandomForestClassifier
        from sklearn.model_selection import train_test_split
        from sklearn.metrics import accuracy_score, f1_score, confusion_matrix
        
        df = load_dataset()
        congestion_map = {'Free Flow': 0, 'Low': 1, 'Moderate': 2, 'High': 3, 'Severe': 4}
        df['target'] = df['Congestion Level'].map(congestion_map)
        df = df.dropna(subset=['target'])
        
        feature_cols = ['Traffic Volume', 'Average Speed (km/h)', 'Travel Time Index',
                       'Road Capacity Utilization (%)', 'Incident Reports',
                       'Environmental Score', 'Public Transport Usage (%)']
        if 'hour' in df.columns: feature_cols.append('hour')
        if 'day_of_week' in df.columns: feature_cols.append('day_of_week')
        if 'month' in df.columns: feature_cols.append('month')
        feature_cols = [f for f in feature_cols if f in df.columns]
        
        X = df[feature_cols].fillna(df[feature_cols].median())
        y = df['target'].astype(int)
        
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        n_estimators = params.get('n_estimators', 100)
        model = RandomForestClassifier(n_estimators=n_estimators, random_state=42, n_jobs=-1)
        model.fit(X_train, y_train)
        
        y_pred = model.predict(X_test)
        acc = float(accuracy_score(y_test, y_pred))
        f1 = float(f1_score(y_test, y_pred, average='weighted', zero_division=0))
        cm = confusion_matrix(y_test, y_pred).tolist()
        
        feature_importance = [
            {"feature": f, "importance": round(float(imp), 4)}
            for f, imp in zip(feature_cols, model.feature_importances_)
        ]
        feature_importance.sort(key=lambda x: x['importance'], reverse=True)
        
        return {
            "success": True,
            "algorithm": "Random Forest",
            "accuracy": round(acc, 4),
            "f1_score": round(f1, 4),
            "n_estimators": n_estimators,
            "feature_importance": feature_importance,
            "confusion_matrix": cm,
            "features_used": feature_cols
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
