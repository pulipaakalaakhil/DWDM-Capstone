-- ============================================================================
-- TRAFFIC PATTERN ANALYSIS AND CONGESTION PREDICTION USING DATA MINING
-- Data Warehouse Star Schema Architecture
-- ============================================================================

-- Dimension: Date
CREATE TABLE IF NOT EXISTS dim_date (
    date_id INTEGER PRIMARY KEY,           -- e.g. YYYYMMDD (20240101)
    full_date DATE NOT NULL UNIQUE,
    day SMALLINT NOT NULL CHECK (day BETWEEN 1 AND 31),
    month SMALLINT NOT NULL CHECK (month BETWEEN 1 AND 12),
    year SMALLINT NOT NULL,
    quarter SMALLINT NOT NULL CHECK (quarter BETWEEN 1 AND 4),
    day_name VARCHAR(15) NOT NULL,
    month_name VARCHAR(15) NOT NULL,
    is_weekend BOOLEAN NOT NULL,
    season VARCHAR(20) NOT NULL
);

-- Dimension: Time
CREATE TABLE IF NOT EXISTS dim_time (
    time_id INTEGER PRIMARY KEY,           -- e.g. HHMMSS (083000)
    full_time TIME NOT NULL,
    hour SMALLINT NOT NULL CHECK (hour BETWEEN 0 AND 23),
    minute SMALLINT NOT NULL CHECK (minute BETWEEN 0 AND 59),
    time_of_day VARCHAR(20) NOT NULL,      -- 'Morning Peak', 'Afternoon', etc.
    is_peak_hour BOOLEAN NOT NULL,
    shift VARCHAR(20) NOT NULL
);

-- Dimension: Location
CREATE TABLE IF NOT EXISTS dim_location (
    location_id INTEGER PRIMARY KEY,
    area_name VARCHAR(100) NOT NULL,
    road_name VARCHAR(200) NOT NULL,
    latitude DECIMAL(10, 6),
    longitude DECIMAL(10, 6),
    city VARCHAR(100) DEFAULT 'Bangalore',
    zone VARCHAR(50) DEFAULT 'Central'
);

-- Dimension: Vehicle Context
CREATE TABLE IF NOT EXISTS dim_vehicle (
    vehicle_id INTEGER PRIMARY KEY,
    dominant_category VARCHAR(50) NOT NULL, -- 'Two-Wheeler', 'Four-Wheeler', etc.
    public_transport_share_tier VARCHAR(20),
    pedestrian_density_tier VARCHAR(20)
);

-- Dimension: Weather
CREATE TABLE IF NOT EXISTS dim_weather (
    weather_id INTEGER PRIMARY KEY,
    weather_condition VARCHAR(50) NOT NULL,
    environmental_score DECIMAL(5, 2),
    impact_level VARCHAR(20)               -- 'Low', 'Moderate', 'High'
);

-- ============================================================================
-- Central Fact Table: Fact_Traffic
-- Grain: One observation per intersection per temporal slot
-- ============================================================================
CREATE TABLE IF NOT EXISTS fact_traffic (
    fact_id BIGSERIAL PRIMARY KEY,
    
    -- Foreign Keys to Surrounding Dimensions
    date_id INTEGER NOT NULL REFERENCES dim_date(date_id),
    time_id INTEGER NOT NULL REFERENCES dim_time(time_id),
    location_id INTEGER NOT NULL REFERENCES dim_location(location_id),
    vehicle_id INTEGER NOT NULL REFERENCES dim_vehicle(vehicle_id),
    weather_id INTEGER NOT NULL REFERENCES dim_weather(weather_id),
    
    -- Additive and Semi-Additive Numerical Measures
    traffic_volume INTEGER NOT NULL,
    average_speed DECIMAL(5, 2) NOT NULL,
    travel_time_index DECIMAL(4, 2) NOT NULL,
    congestion_numeric_value DECIMAL(3, 2) NOT NULL,
    road_capacity_utilization DECIMAL(5, 2) NOT NULL,
    incident_count INTEGER DEFAULT 0,
    pedestrian_cyclist_count INTEGER DEFAULT 0,
    environmental_score DECIMAL(5, 2)
);

-- Analytical Bitmap and B-Tree Indexes
CREATE INDEX IF NOT EXISTS idx_fact_date ON fact_traffic(date_id);
CREATE INDEX IF NOT EXISTS idx_fact_time ON fact_traffic(time_id);
CREATE INDEX IF NOT EXISTS idx_fact_location ON fact_traffic(location_id);
CREATE INDEX IF NOT EXISTS idx_fact_volume ON fact_traffic(traffic_volume);
