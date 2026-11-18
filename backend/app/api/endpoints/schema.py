from fastapi import APIRouter
router = APIRouter()

NORMALIZED_SCHEMA = {
    "tables": [
        {
            "name": "Traffic_Locations",
            "columns": [
                {"name": "location_id", "type": "SERIAL", "pk": True},
                {"name": "area_name", "type": "VARCHAR(100)", "nullable": False},
                {"name": "road_name", "type": "VARCHAR(200)", "nullable": False},
                {"name": "latitude", "type": "DECIMAL(10,6)"},
                {"name": "longitude", "type": "DECIMAL(10,6)"},
                {"name": "city", "type": "VARCHAR(100)", "default": "Bangalore"},
                {"name": "state", "type": "VARCHAR(100)", "default": "Karnataka"}
            ],
            "primary_key": "location_id",
            "description": "Master table of all traffic monitoring locations"
        },
        {
            "name": "Traffic_Records",
            "columns": [
                {"name": "record_id", "type": "SERIAL", "pk": True},
                {"name": "location_id", "type": "INTEGER", "fk": "Traffic_Locations.location_id"},
                {"name": "condition_id", "type": "INTEGER", "fk": "Traffic_Conditions.condition_id"},
                {"name": "weather_id", "type": "INTEGER", "fk": "Weather_Records.weather_id"},
                {"name": "record_date", "type": "DATE", "nullable": False},
                {"name": "record_time", "type": "TIME", "nullable": False},
                {"name": "traffic_volume", "type": "INTEGER"},
                {"name": "average_speed", "type": "DECIMAL(5,2)"},
                {"name": "travel_time_index", "type": "DECIMAL(4,2)"},
                {"name": "road_capacity_utilization", "type": "DECIMAL(5,2)"},
                {"name": "incident_reports", "type": "INTEGER", "default": "0"},
                {"name": "pedestrian_count", "type": "INTEGER"},
                {"name": "created_at", "type": "TIMESTAMP", "default": "NOW()"}
            ],
            "primary_key": "record_id",
            "foreign_keys": ["location_id", "condition_id", "weather_id"],
            "description": "Core traffic observation records (3NF)"
        },
        {
            "name": "Traffic_Conditions",
            "columns": [
                {"name": "condition_id", "type": "SERIAL", "pk": True},
                {"name": "congestion_level", "type": "VARCHAR(20)", "nullable": False},
                {"name": "congestion_numeric", "type": "SMALLINT"},
                {"name": "description", "type": "TEXT"},
                {"name": "speed_range_min", "type": "DECIMAL(5,2)"},
                {"name": "speed_range_max", "type": "DECIMAL(5,2)"}
            ],
            "primary_key": "condition_id",
            "description": "Traffic condition classifications"
        },
        {
            "name": "Weather_Records",
            "columns": [
                {"name": "weather_id", "type": "SERIAL", "pk": True},
                {"name": "weather_condition", "type": "VARCHAR(50)", "nullable": False},
                {"name": "environmental_score", "type": "DECIMAL(5,2)"},
                {"name": "impact_factor", "type": "DECIMAL(3,2)"}
            ],
            "primary_key": "weather_id",
            "description": "Weather and environmental conditions"
        },
        {
            "name": "Prediction_Results",
            "columns": [
                {"name": "prediction_id", "type": "SERIAL", "pk": True},
                {"name": "model_name", "type": "VARCHAR(100)"},
                {"name": "target_variable", "type": "VARCHAR(100)"},
                {"name": "mae", "type": "DECIMAL(10,4)"},
                {"name": "rmse", "type": "DECIMAL(10,4)"},
                {"name": "r2_score", "type": "DECIMAL(6,4)"},
                {"name": "accuracy", "type": "DECIMAL(6,4)"},
                {"name": "f1_score", "type": "DECIMAL(6,4)"},
                {"name": "trained_at", "type": "TIMESTAMP", "default": "NOW()"}
            ],
            "primary_key": "prediction_id",
            "description": "ML model training results and metrics"
        }
    ],
    "relationships": [
        {"from": "Traffic_Records", "to": "Traffic_Locations", "type": "many-to-one", "fk": "location_id"},
        {"from": "Traffic_Records", "to": "Traffic_Conditions", "type": "many-to-one", "fk": "condition_id"},
        {"from": "Traffic_Records", "to": "Weather_Records", "type": "many-to-one", "fk": "weather_id"}
    ]
}

STAR_SCHEMA = {
    "fact_table": {
        "name": "Fact_Traffic",
        "columns": [
            {"name": "fact_id", "type": "BIGSERIAL", "pk": True},
            {"name": "date_id", "type": "INTEGER", "fk": "Dim_Date.date_id"},
            {"name": "time_id", "type": "INTEGER", "fk": "Dim_Time.time_id"},
            {"name": "location_id", "type": "INTEGER", "fk": "Dim_Location.location_id"},
            {"name": "vehicle_id", "type": "INTEGER", "fk": "Dim_Vehicle.vehicle_id"},
            {"name": "road_id", "type": "INTEGER", "fk": "Dim_Road.road_id"},
            {"name": "weather_id", "type": "INTEGER", "fk": "Dim_Weather.weather_id"},
            {"name": "traffic_volume", "type": "INTEGER", "measure": True},
            {"name": "average_speed", "type": "DECIMAL(5,2)", "measure": True},
            {"name": "travel_time_index", "type": "DECIMAL(4,2)", "measure": True},
            {"name": "congestion_value", "type": "DECIMAL(4,2)", "measure": True},
            {"name": "road_capacity_utilization", "type": "DECIMAL(5,2)", "measure": True},
            {"name": "incident_count", "type": "INTEGER", "measure": True},
            {"name": "pedestrian_count", "type": "INTEGER", "measure": True}
        ],
        "description": "Central fact table with traffic measurements"
    },
    "dimensions": [
        {
            "name": "Dim_Date",
            "columns": [
                {"name": "date_id", "type": "INTEGER", "pk": True},
                {"name": "full_date", "type": "DATE"},
                {"name": "day", "type": "SMALLINT"},
                {"name": "month", "type": "SMALLINT"},
                {"name": "year", "type": "SMALLINT"},
                {"name": "quarter", "type": "SMALLINT"},
                {"name": "day_name", "type": "VARCHAR(20)"},
                {"name": "is_weekend", "type": "BOOLEAN"},
                {"name": "season", "type": "VARCHAR(20)"}
            ]
        },
        {
            "name": "Dim_Time",
            "columns": [
                {"name": "time_id", "type": "INTEGER", "pk": True},
                {"name": "full_time", "type": "TIME"},
                {"name": "hour", "type": "SMALLINT"},
                {"name": "minute", "type": "SMALLINT"},
                {"name": "time_of_day", "type": "VARCHAR(20)"},
                {"name": "is_peak_hour", "type": "BOOLEAN"},
                {"name": "shift", "type": "VARCHAR(20)"}
            ]
        },
        {
            "name": "Dim_Location",
            "columns": [
                {"name": "location_id", "type": "INTEGER", "pk": True},
                {"name": "area_name", "type": "VARCHAR(100)"},
                {"name": "road_name", "type": "VARCHAR(200)"},
                {"name": "latitude", "type": "DECIMAL(10,6)"},
                {"name": "longitude", "type": "DECIMAL(10,6)"},
                {"name": "city", "type": "VARCHAR(100)"},
                {"name": "zone", "type": "VARCHAR(50)"}
            ]
        },
        {
            "name": "Dim_Vehicle",
            "columns": [
                {"name": "vehicle_id", "type": "INTEGER", "pk": True},
                {"name": "vehicle_category", "type": "VARCHAR(50)"},
                {"name": "vehicle_type", "type": "VARCHAR(50)"},
                {"name": "public_transport_pct", "type": "DECIMAL(5,2)"}
            ]
        },
        {
            "name": "Dim_Road",
            "columns": [
                {"name": "road_id", "type": "INTEGER", "pk": True},
                {"name": "road_name", "type": "VARCHAR(200)"},
                {"name": "road_type", "type": "VARCHAR(50)"},
                {"name": "lanes", "type": "SMALLINT"},
                {"name": "capacity", "type": "INTEGER"},
                {"name": "speed_limit", "type": "SMALLINT"}
            ]
        },
        {
            "name": "Dim_Weather",
            "columns": [
                {"name": "weather_id", "type": "INTEGER", "pk": True},
                {"name": "weather_condition", "type": "VARCHAR(50)"},
                {"name": "environmental_score", "type": "DECIMAL(5,2)"},
                {"name": "impact_level", "type": "VARCHAR(20)"}
            ]
        }
    ]
}

SNOWFLAKE_SCHEMA = {
    "fact_table": STAR_SCHEMA["fact_table"],
    "dimension_hierarchy": [
        {
            "root": "Dim_Date",
            "hierarchy": [
                {"level": 1, "table": "Dim_Date", "key": "date_id", "columns": ["full_date", "day", "month_id"]},
                {"level": 2, "table": "Dim_Month", "key": "month_id", "columns": ["month_name", "quarter_id"], "fk_to": "Dim_Date"},
                {"level": 3, "table": "Dim_Quarter", "key": "quarter_id", "columns": ["quarter_name", "year_id"], "fk_to": "Dim_Month"},
                {"level": 4, "table": "Dim_Year", "key": "year_id", "columns": ["year_value", "decade"], "fk_to": "Dim_Quarter"}
            ]
        },
        {
            "root": "Dim_Location",
            "hierarchy": [
                {"level": 1, "table": "Dim_Location", "key": "location_id", "columns": ["road_name", "area_id"]},
                {"level": 2, "table": "Dim_Area", "key": "area_id", "columns": ["area_name", "zone_id"], "fk_to": "Dim_Location"},
                {"level": 3, "table": "Dim_Zone", "key": "zone_id", "columns": ["zone_name", "city_id"], "fk_to": "Dim_Area"},
                {"level": 4, "table": "Dim_City", "key": "city_id", "columns": ["city_name", "state"], "fk_to": "Dim_Zone"}
            ]
        },
        {
            "root": "Dim_Road",
            "hierarchy": [
                {"level": 1, "table": "Dim_Road", "key": "road_id", "columns": ["road_name", "road_type_id"]},
                {"level": 2, "table": "Dim_Road_Type", "key": "road_type_id", "columns": ["type_name", "category"], "fk_to": "Dim_Road"}
            ]
        }
    ]
}

router = APIRouter()

@router.get("/normalized")
async def get_normalized_schema():
    return {"success": True, "schema": NORMALIZED_SCHEMA}

@router.get("/star")
async def get_star_schema():
    return {"success": True, "schema": STAR_SCHEMA}

@router.get("/snowflake")
async def get_snowflake_schema():
    return {"success": True, "schema": SNOWFLAKE_SCHEMA}
