-- ============================================================================
-- TRAFFIC PATTERN ANALYSIS AND CONGESTION PREDICTION USING DATA MINING
-- Data Warehouse Snowflake Schema Architecture
-- Normalized Hierarchical Dimensions for Systematic Roll-Up / Drill-Down
-- ============================================================================

-- Date Hierarchy: Day -> Month -> Quarter -> Year
CREATE TABLE IF NOT EXISTS dim_year (
    year_id INTEGER PRIMARY KEY,
    year_value SMALLINT NOT NULL UNIQUE,
    decade VARCHAR(20) NOT NULL
);

CREATE TABLE IF NOT EXISTS dim_quarter (
    quarter_id INTEGER PRIMARY KEY,
    quarter_name VARCHAR(10) NOT NULL,
    quarter_num SMALLINT NOT NULL CHECK (quarter_num BETWEEN 1 AND 4),
    year_id INTEGER NOT NULL REFERENCES dim_year(year_id)
);

CREATE TABLE IF NOT EXISTS dim_month (
    month_id INTEGER PRIMARY KEY,
    month_name VARCHAR(20) NOT NULL,
    month_num SMALLINT NOT NULL CHECK (month_num BETWEEN 1 AND 12),
    quarter_id INTEGER NOT NULL REFERENCES dim_quarter(quarter_id)
);

CREATE TABLE IF NOT EXISTS dim_date_snowflake (
    date_id INTEGER PRIMARY KEY,
    full_date DATE NOT NULL UNIQUE,
    day_of_month SMALLINT NOT NULL,
    day_name VARCHAR(15) NOT NULL,
    is_weekend BOOLEAN NOT NULL,
    month_id INTEGER NOT NULL REFERENCES dim_month(month_id)
);

-- Location Hierarchy: Intersection -> Area -> Zone -> City -> State
CREATE TABLE IF NOT EXISTS dim_state (
    state_id SERIAL PRIMARY KEY,
    state_name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS dim_city (
    city_id SERIAL PRIMARY KEY,
    city_name VARCHAR(100) NOT NULL,
    state_id INTEGER NOT NULL REFERENCES dim_state(state_id)
);

CREATE TABLE IF NOT EXISTS dim_zone (
    zone_id SERIAL PRIMARY KEY,
    zone_name VARCHAR(100) NOT NULL,
    city_id INTEGER NOT NULL REFERENCES dim_city(city_id)
);

CREATE TABLE IF NOT EXISTS dim_area (
    area_id SERIAL PRIMARY KEY,
    area_name VARCHAR(100) NOT NULL,
    zone_id INTEGER NOT NULL REFERENCES dim_zone(zone_id)
);

CREATE TABLE IF NOT EXISTS dim_intersection (
    intersection_id SERIAL PRIMARY KEY,
    road_name VARCHAR(200) NOT NULL,
    latitude DECIMAL(10, 6),
    longitude DECIMAL(10, 6),
    area_id INTEGER NOT NULL REFERENCES dim_area(area_id)
);

-- Central Fact Table (Snowflake Edition)
CREATE TABLE IF NOT EXISTS fact_traffic_snowflake (
    fact_id BIGSERIAL PRIMARY KEY,
    date_id INTEGER NOT NULL REFERENCES dim_date_snowflake(date_id),
    intersection_id INTEGER NOT NULL REFERENCES dim_intersection(intersection_id),
    
    -- Numerical Observations / Measures
    traffic_volume INTEGER NOT NULL,
    average_speed DECIMAL(5, 2) NOT NULL,
    congestion_score DECIMAL(4, 2) NOT NULL,
    capacity_utilization DECIMAL(5, 2) NOT NULL,
    incident_count INTEGER DEFAULT 0
);
