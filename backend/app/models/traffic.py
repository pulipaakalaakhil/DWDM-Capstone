from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Boolean, ForeignKey, Date, Time
from sqlalchemy.orm import relationship
from app.database.connection import Base
from datetime import datetime


class TrafficRecord(Base):
    __tablename__ = "traffic_records"
    
    id = Column(Integer, primary_key=True, index=True)
    date = Column(String, index=True)
    time = Column(String, index=True)
    area_name = Column(String, index=True)
    road_name = Column(String, index=True)
    traffic_volume = Column(Integer)
    average_speed = Column(Float)
    travel_time_index = Column(Float)
    congestion_level = Column(String, index=True)
    road_capacity_utilization = Column(Float)
    incident_reports = Column(Integer)
    environmental_score = Column(Float)
    public_transport_usage = Column(Float)
    traffic_signal_compliance = Column(Float)
    parking_usage = Column(Float)
    pedestrian_cyclist_count = Column(Integer)
    weather_conditions = Column(String)
    latitude = Column(Float)
    longitude = Column(Float)
    hour = Column(Integer)
    day_of_week = Column(Integer)
    month = Column(Integer)
    year = Column(Integer)
    is_weekend = Column(Boolean)
    is_peak_hour = Column(Boolean)
    created_at = Column(DateTime, default=datetime.utcnow)


class ProcessedDataset(Base):
    __tablename__ = "processed_datasets"
    
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String)
    total_records = Column(Integer)
    missing_values = Column(Integer)
    duplicate_records = Column(Integer)
    processed_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default="pending")
    notes = Column(Text)


class PredictionResult(Base):
    __tablename__ = "prediction_results"
    
    id = Column(Integer, primary_key=True, index=True)
    model_name = Column(String)
    target_variable = Column(String)
    mae = Column(Float)
    rmse = Column(Float)
    r2_score = Column(Float)
    accuracy = Column(Float)
    f1_score = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)
    parameters = Column(Text)


class HotspotRecord(Base):
    __tablename__ = "hotspots"
    
    id = Column(Integer, primary_key=True, index=True)
    area_name = Column(String)
    road_name = Column(String)
    avg_traffic_volume = Column(Float)
    avg_speed = Column(Float)
    congestion_score = Column(Float)
    cluster_id = Column(Integer)
    latitude = Column(Float)
    longitude = Column(Float)
    detected_at = Column(DateTime, default=datetime.utcnow)
