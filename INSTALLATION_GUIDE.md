# Installation and Setup Guide

## System Prerequisites
Ensure the following tools are installed on your machine:
1. **Python**: Version 3.10, 3.11, 3.12, or 3.13
2. **Node.js**: Version 18.x, 20.x, or 22.x with `npm`
3. **Git** (optional)
4. **Docker & Docker Compose** (optional for containerized deployment)

---

## Method 1: Local Development Setup (Recommended)

### Step 1: Clone or Navigate to the Project Root
```bash
cd "c:\Users\e020ax\OneDrive\Desktop\DWDM capstone"
```

### Step 2: Set Up Backend Environment
```bash
cd backend

# Create virtual environment (recommended)
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt
```

### Step 3: Run the FastAPI Backend Server
```bash
python run.py
```
- The backend will start on **`http://localhost:8000`**
- Swagger Interactive Documentation is available at **`http://localhost:8000/api/docs`**
- Redoc documentation is available at **`http://localhost:8000/api/redoc`**

### Step 4: Set Up Frontend Environment (Open a New Terminal)
```bash
cd "c:\Users\e020ax\OneDrive\Desktop\DWDM capstone\frontend"

# Install node dependencies
npm install

# Start Vite development server
npm run dev
```
- The frontend will launch at **`http://localhost:5173`**
- Open your browser to explore the dashboard.

---

## Method 2: Docker Containerized Deployment

To start the database, backend, and frontend inside isolated containers:

```bash
cd "c:\Users\e020ax\OneDrive\Desktop\DWDM capstone"
docker-compose up --build -d
```

### Container Endpoints:
- **Frontend Dashboard:** http://localhost:5173
- **FastAPI Backend:** http://localhost:8000
- **PostgreSQL Database:** localhost:5432 (Database: `bangalore_traffic_dw`)

To stop the containers:
```bash
docker-compose down
```

---

## Verification & Troubleshooting

1. **Verify Backend Status:**
   Visit `http://localhost:8000/api/health` in your browser. It should return:
   ```json
   {"status": "healthy", "service": "Traffic Intelligence API"}
   ```

2. **Verify Frontend Build:**
   You can verify that the production bundle builds without errors:
   ```bash
   cd frontend
   npm run build
   ```
   A production-ready `dist/` directory will be compiled.

3. **Verify Dataset:**
   The raw dataset is stored in:
   `c:\Users\e020ax\OneDrive\Desktop\DWDM capstone\data\raw\bangalore_traffic.csv`
   The system pre-loads this dataset upon startup.
