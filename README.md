# Traffic Pattern Analysis and Congestion Prediction Using Data Mining
### Enterprise Smart City Traffic Intelligence Command Center (Bengaluru / Bangalore)

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/Frontend-React_18_TypeScript-61DAFB?logo=react)](https://reactjs.org/)
[![Three.js](https://img.shields.io/badge/3D_Engine-Three.js_React_Three_Fiber-black?logo=three.js)](https://threejs.org/)
[![PostgreSQL](https://img.shields.io/badge/Data_Warehouse-PostgreSQL_OLAP-336791?logo=postgresql)](https://www.postgresql.org/)
[![Scikit-Learn](https://img.shields.io/badge/ML-Scikit--Learn-F7931E?logo=scikitlearn)](https://scikit-learn.org/)

---

## 1. Project Overview & Capstone Scope

Urban mobility in Bangalore is characterized by rapid vehicular growth, localized chokepoints, and high sensitivity to peak hours and meteorological disruptions. This capstone platform demonstrates an end-to-end data mining and data warehousing implementation:
- **Spatial & Temporal Pattern Discovery:** Unsupervised clustering (K-Means, DBSCAN) identifying recurring congestion hotspots.
- **Supervised Machine Learning:** Decision Trees, Random Forests, Logistic Regression, and Gradient Boosting predicting velocity drops and volume spikes.
- **Multidimensional OLAP Cube:** Interactive 3D Cube with real-time **Roll-Up**, **Drill-Down**, **Slice**, **Dice**, and **Pivot** capabilities.
- **Dimensional Modeling:** Full implementation of 3rd Normal Form (3NF), Star Schema, and Snowflake Schema.
- **Digital Twin & GIS:** Leaflet map layers with circle density gradients and historical WebSocket streaming.

---

## 2. Architecture & Modules

```
                        ┌────────────────────────────────────────┐
                        │      React + Vite + TypeScript         │
                        │       (Dark Navy Command Center)       │
                        └───────────────────┬────────────────────┘
                                            │ REST / WebSockets
                                            ▼
                        ┌────────────────────────────────────────┐
                        │       FastAPI Backend Application      │
                        │   Endpoints · Services · Data Miners   │
                        └───────┬────────────────────────┬───────┘
                                │                        │
               ┌────────────────┴────────┐     ┌─────────┴──────────────┐
               │    Data Preprocessing   │     │   Machine Learning     │
               │   IQR Outliers · Scaler │     │  Random Forest · Trees │
               └────────────────┬────────┘     └─────────┬──────────────┘
                                │                        │
                                ▼                        ▼
       ┌──────────────────────────────────────────────────────────────────┐
       │             Database Architecture & Data Warehouse               │
       │  3NF Relational  ·  Fact_Traffic Star Schema  ·  Snowflake Cube  │
       └──────────────────────────────────────────────────────────────────┘
```

### Main Navigational Modules (All 19 Active):
1. **Overview Dashboard:** 8 KPI cards, volume line trends, donut distributions, area rankings, and hour-by-day density heatmaps.
2. **Live Traffic Monitoring:** WebSocket streaming mode with playback controls (Start/Pause/Stop) and live alert generation.
3. **3D Bangalore Traffic Map:** GIS coordinates across 15 Bangalore corridors with severity-colored circle markers.
4. **Traffic Pattern Analysis:** Diurnal flow cycles, day-of-week rhythms, weekday/weekend divergence, and weather sensitivity.
5. **Data Exploration:** Interactive table preview with pagination, search, column metadata, and statistical quartiles.
6. **Data Preprocessing Pipeline:** Automated pipeline with outlier capping, missing-value imputation, and before/after comparisons.
7. **Data Mining Algorithms:** K-Means clustering with Elbow curves, DBSCAN density segmentation, and Decision Tree visual splits.
8. **ML Congestion Prediction:** Multi-algorithm training, actual vs predicted evaluation, confusion matrices, and forecast horizons.
9. **Traffic Hotspot Detection:** Ranking tables and spatial risk indices for Silk Board, Marathahalli, Hebbal, and key corridors.
10. **Interactive 3D OLAP Cube:** Built using Three.js and React Three Fiber. Cell selection, dimension axes, and real-time slice/dice queries.
11. **Database Architecture:** Master workspace highlighting primary keys, foreign keys, and ER table structures.
12. **Normalized Schema (3NF):** Dedicated view of Boyce-Codd / 3NF relational normalization.
13. **Star Schema:** Dimensional model featuring central `Fact_Traffic` connected to Date, Time, Location, Vehicle, and Weather dimensions.
14. **Snowflake Schema:** Fully normalized dimensional hierarchy showcasing `Intersection → Area → Zone → City → State`.
15. **OLAP Analytics Workspace:** Hands-on analytical workbench for slicing data along temporal and spatial dimensions.
16. **Tableau-Style BI Analytics:** 5 integrated analytical dashboards with cross-filtering visualizations.
17. **Reports & Export:** Automated analytical PDF/JSON summary generator and dataset export.
18. **About Project:** Capstone research methodology, algorithms, and system specifications.
19. **Settings:** Operational velocity thresholds and backend telemetry configurations.

---

## 3. Technology Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Framer Motion, Lucide Icons, Recharts
- **3D & Spatial:** Three.js, React Three Fiber, Drei, Leaflet, React Leaflet
- **Backend:** Python 3.11 / 3.13, FastAPI, Uvicorn, WebSockets
- **Data Warehousing & SQL:** PostgreSQL 15, SQLite 3, Star Schema, Snowflake Schema
- **Data Mining & Analytics:** Pandas, NumPy, Scikit-Learn (Random Forest, K-Means, DBSCAN)
- **Containerization:** Docker, Docker Compose, Nginx

---

## 4. Quick Start (Local Development)

### Prerequisites:
- Python 3.10+
- Node.js 18+ and npm

### 1. Launch Backend:
```bash
cd backend
python -m pip install -r requirements.txt
python run.py
```
*Backend runs on `http://localhost:8000` (API documentation at `http://localhost:8000/api/docs`).*

### 2. Launch Frontend:
```bash
cd frontend
npm install
npm run dev
```
*Frontend runs on `http://localhost:5173`.*

---

## 5. Docker Deployment

Deploy the entire stack with a single command:
```bash
docker-compose up --build
```
- Frontend Web App: `http://localhost:5173`
- Backend API Docs: `http://localhost:8000/api/docs`
- PostgreSQL DW: `localhost:5432` (User: `traffic_user`, DB: `bangalore_traffic_dw`)

---

## 6. Dataset Schema Specification

The dataset contains **15,000 temporal observation records** spanning Bangalore corridors:
- `Date` & `Time`: ISO formatted temporal stamps
- `Area Name`: Corridors (Koramangala, Indiranagar, Whitefield, Silk Board, Hebbal, etc.)
- `Road/Intersection Name`: Specific junctions (Sony World, 100 Feet Rd, Marathahalli Bridge, etc.)
- `Traffic Volume`: Count of vehicles (100 to 5,000)
- `Average Speed (km/h)`: Observed velocity (5 to 90 km/h)
- `Congestion Level`: Categorical classification (`Free Flow`, `Low`, `Moderate`, `High`, `Severe`)
- `Road Capacity Utilization (%)`: Percentage of maximum capacity occupied
- `Incident Reports`: Stalled vehicles or accidents reported
- `Weather Conditions`: Meteorological impact factor (`Clear`, `Cloudy`, `Rainy`, `Foggy`)
- `Latitude` / `Longitude`: High-precision geospatial coordinates

---

## 7. Capstone Demonstration Checklist

- [x] All 19 navigation routes operational and styled with Smart City dark theme.
- [x] Functional 3D OLAP Cube with interactive hover, zoom, and slice/dice operations.
- [x] Data Preprocessing pipeline with before/after comparisons and outlier detection.
- [x] Machine learning training and evaluation comparing Random Forest, Decision Trees, and Gradient Boosting.
- [x] Real-time WebSocket streaming with historical dataset replay and alert dispatching.
- [x] Normalized, Star, and Snowflake database architecture visualizations.
- [x] Exportable analytical reports and CSV downloads.
