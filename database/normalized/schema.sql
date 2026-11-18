-- ============================================================================
-- TRAFFIC PATTERN ANALYSIS AND CONGESTION PREDICTION USING DATA MINING
-- Normalized Relational Database Schema (Third Normal Form - 3NF)
-- Database Engine: PostgreSQL 15+ / Compatible with SQLite 3
-- ============================================================================

-- 1. Locations Master Table
CREATE TABLE IF NOT EXISTS traffic_locations (
    location_id SERIAL PRIMARY KEY,
    area_name VARCHAR(100) NOT NULL,
    road_name VARCHAR(200) NOT NULL,
    latitude DECIMAL(10, 6),
    longitude DECIMAL(10, 6),
    city VARCHAR(100) DEFAULT 'Bangalore',
    state VARCHAR(100) DEFAULT 'Karnataka',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_location UNIQUE (area_name, road_name)
);

-- 2. Traffic Conditions Lookup (Enum / Reference Table)
CREATE TABLE IF NOT EXISTS traffic_conditions (
    condition_id SERIAL PRIMARY KEY,
    congestion_level VARCHAR(20) NOT NULL UNIQUE,
    congestion_numeric SMALLINT NOT NULL,
    description TEXT,
    speed_range_min DECIMAL(5, 2),
    speed_range_max DECIMAL(5, 2)
);

-- 3. Weather Records Master Table
CREATE TABLE IF NOT EXISTS weather_records (
    weather_id SERIAL PRIMARY KEY,
    weather_condition VARCHAR(50) NOT NULL UNIQUE,
    environmental_score DECIMAL(5, 2),
    impact_factor DECIMAL(3, 2) DEFAULT 1.0
);

-- 4. Main Traffic Observations (3NF Fact / Observation Table)
CREATE TABLE IF NOT EXISTS traffic_records (
    record_id BIGSERIAL PRIMARY KEY,
    location_id INTEGER NOT NULL REFERENCES traffic_locations(location_id) ON DELETE CASCADE,
    condition_id INTEGER NOT NULL REFERENCES traffic_conditions(condition_id),
    weather_id INTEGER NOT NULL REFERENCES weather_records(weather_id),
    record_date DATE NOT NULL,
    record_time TIME NOT NULL,
    traffic_volume INTEGER NOT NULL CHECK (traffic_volume >= 0),
    average_speed DECIMAL(5, 2) NOT NULL CHECK (average_speed >= 0),
    travel_time_index DECIMAL(4, 2) DEFAULT 1.0,
    road_capacity_utilization DECIMAL(5, 2),
    incident_reports INTEGER DEFAULT 0,
    public_transport_usage DECIMAL(5, 2),
    traffic_signal_compliance DECIMAL(5, 2),
    parking_usage DECIMAL(5, 2),
    pedestrian_cyclist_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Machine Learning Prediction Results Audit Table
CREATE TABLE IF NOT EXISTS prediction_results (
    prediction_id SERIAL PRIMARY KEY,
    model_name VARCHAR(100) NOT NULL,
    target_variable VARCHAR(100) NOT NULL,
    mae DECIMAL(10, 4),
    rmse DECIMAL(10, 4),
    r2_score DECIMAL(6, 4),
    accuracy DECIMAL(6, 4),
    f1_score DECIMAL(6, 4),
    precision_score DECIMAL(6, 4),
    recall_score DECIMAL(6, 4),
    trained_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    parameters JSONB
);

-- 6. Identified Congestion Hotspots Table
CREATE TABLE IF NOT EXISTS hotspot_records (
    hotspot_id SERIAL PRIMARY KEY,
    location_id INTEGER REFERENCES traffic_locations(location_id),
    congestion_score DECIMAL(5, 4) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    avg_traffic_volume DECIMAL(10, 2),
    avg_speed DECIMAL(5, 2),
    cluster_id INTEGER,
    identified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexing for Fast OLAP Query Performance
CREATE INDEX IF NOT EXISTS idx_traffic_date ON traffic_records(record_date);
CREATE INDEX IF NOT EXISTS idx_traffic_location ON traffic_records(location_id);
CREATE INDEX IF NOT EXISTS idx_traffic_condition ON traffic_records(condition_id);
CREATE INDEX IF NOT EXISTS idx_traffic_volume ON traffic_records(traffic_volume);
